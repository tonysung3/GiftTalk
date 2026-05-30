const { db } = require('../models/schema');

exports.getConversations = (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get all conversations for the user with the last message and unread count
        const conversations = db.prepare(`
            SELECT 
                c.id, 
                c.created_at,
                c.is_group,
                c.name as group_name,
                c.avatar_url as group_avatar,
                m.content as last_message,
                COALESCE(m.created_at, c.created_at) as last_activity,
                m.sender_id as last_message_sender_id,
                u.username as other_user_username,
                u.id as other_user_id,
                u.avatar_url as other_user_avatar,
                (
                    SELECT COUNT(*) 
                    FROM messages m2 
                    WHERE m2.conversation_id = c.id 
                    AND m2.sender_id != ? 
                    AND NOT EXISTS (
                        SELECT 1 FROM read_receipts rr 
                        WHERE rr.message_id = m2.id AND rr.user_id = ?
                    )
                ) as unread_count
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            LEFT JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != ? AND c.is_group = 0
            LEFT JOIN users u ON cp2.user_id = u.id
            LEFT JOIN (
                SELECT conversation_id, content, created_at, sender_id, id
                FROM messages
                WHERE id IN (SELECT MAX(id) FROM messages GROUP BY conversation_id)
            ) m ON c.id = m.conversation_id
            WHERE cp.user_id = ?
            ORDER BY last_activity DESC
        `).all(userId, userId, userId, userId);

        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getConversationById = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const participant = db.prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?').get(id, userId);
        if (!participant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const conversation = db.prepare(`
            SELECT id, name, is_group, avatar_url, created_at
            FROM conversations
            WHERE id = ?
        `).get(id);

        const participants = db.prepare(`
            SELECT u.id, u.username, u.display_name, u.avatar_url, u.role
            FROM users u
            JOIN conversation_participants cp ON u.id = cp.user_id
            WHERE cp.conversation_id = ?
        `).all(id);

        res.json({ ...conversation, participants });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getMessages = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if user is participant
        const participant = db.prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?').get(id, userId);
        if (!participant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const messages = db.prepare(`
            SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar,
            (SELECT COUNT(*) FROM read_receipts rr WHERE rr.message_id = m.id) as read_count
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        `).all(id);

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createConversation = (req, res) => {
    try {
        const { participantId, participantIds, name, avatarUrl } = req.body;
        const userId = req.user.id;

        // Determine if it's a group or 1-on-1
        const allParticipantIds = participantIds || (participantId ? [participantId] : []);
        const isGroup = name || allParticipantIds.length > 1;

        if (allParticipantIds.length === 0) {
            return res.status(400).json({ error: 'At least one participant is required' });
        }

        if (!isGroup) {
            const targetId = allParticipantIds[0];
            if (userId === parseInt(targetId)) {
                return res.status(400).json({ error: 'Cannot create conversation with yourself' });
            }

            // Check if conversation already exists (for 1-on-1)
            const existing = db.prepare(`
                SELECT conversation_id 
                FROM conversation_participants cp1
                JOIN conversations c ON cp1.conversation_id = c.id
                WHERE cp1.user_id = ? AND c.is_group = 0
                INTERSECT 
                SELECT conversation_id 
                FROM conversation_participants cp2
                JOIN conversations c ON cp2.conversation_id = c.id
                WHERE cp2.user_id = ? AND c.is_group = 0
            `).get(userId, targetId);

            if (existing) {
                return res.json({ id: existing.conversation_id });
            }
        }

        const transaction = db.transaction(() => {
            const info = db.prepare('INSERT INTO conversations (name, is_group, avatar_url) VALUES (?, ?, ?)').run(name || null, isGroup ? 1 : 0, avatarUrl || null);
            const conversationId = info.lastInsertRowid;
            
            db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(conversationId, userId);
            
            const insertPart = db.prepare('INSERT OR IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)');
            for (const pId of allParticipantIds) {
                if (pId !== userId) {
                    insertPart.run(conversationId, pId);
                }
            }
            return conversationId;
        });

        const id = transaction();

        // WebSocket Notify: conversation_added
        const io = req.app.get('io');
        if (io) {
            allParticipantIds.forEach(pId => {
                io.to(`user_${pId}`).emit('conversation_added', { id });
            });
            // Also notify self
            io.to(`user_${userId}`).emit('conversation_added', { id });
        }

        res.status(201).json({ id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getParticipants = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const participant = db.prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?').get(id, userId);
        if (!participant) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const participants = db.prepare(`
            SELECT u.id, u.username, u.display_name, u.avatar_url, u.role
            FROM users u
            JOIN conversation_participants cp ON u.id = cp.user_id
            WHERE cp.conversation_id = ?
        `).all(id);

        res.json(participants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
