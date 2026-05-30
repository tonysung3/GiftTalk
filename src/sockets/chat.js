const jwt = require('jsonwebtoken');
const { db } = require('../models/schema');
const schemas = require('../utils/validationSchemas');

module.exports = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return next(new Error('Authentication error'));
            }
            socket.user = user;
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.username}`);

        socket.on('join_room', (roomId) => {
            const userId = socket.user.id;
            const participant = db.prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?').get(roomId, userId);
            
            if (participant) {
                socket.join(`room_${roomId}`);
                console.log(`User ${socket.user.username} joined room ${roomId}`);
            } else {
                console.log(`User ${socket.user.username} denied access to room ${roomId}`);
                socket.emit('error', { message: 'Access denied to this room' });
            }
        });

        socket.on('typing', (data) => {
            const { error, value } = schemas.sockets.typing.validate(data);
            if (error) return;
            
            const { roomId, isTyping } = value;
            
            // Basic throttling: only broadcast if state changed
            const stateKey = `typing_${roomId}`;
            if (socket[stateKey] === isTyping) return;
            
            socket[stateKey] = isTyping;
            socket.to(`room_${roomId}`).emit('user_typing', {
                userId: socket.user.id,
                username: socket.user.username,
                isTyping
            });
        });

        socket.on('mark_read', (data) => {
            const { error, value } = schemas.sockets.markRead.validate(data);
            if (error) return;

            const { roomId, messageId } = value;
            const userId = socket.user.id;

            try {
                if (messageId) {
                    // Mark specific message as read
                    db.prepare('INSERT OR IGNORE INTO read_receipts (message_id, user_id) VALUES (?, ?)').run(messageId, userId);
                } else if (roomId) {
                    // Mark all messages in room as read
                    const messages = db.prepare('SELECT id FROM messages WHERE conversation_id = ? AND sender_id != ?').all(roomId, userId);
                    const insert = db.prepare('INSERT OR IGNORE INTO read_receipts (message_id, user_id) VALUES (?, ?)');
                    const transaction = db.transaction((msgs) => {
                        for (const msg of msgs) insert.run(msg.id, userId);
                    });
                    transaction(messages);
                }

                io.to(`room_${roomId}`).emit('messages_read', {
                    userId,
                    roomId,
                    messageId
                });
            } catch (error) {
                console.error('Mark read error:', error);
            }
        });

        socket.on('send_message', (data) => {
            const { error, value } = schemas.sockets.sendMessage.validate(data);
            if (error) {
                socket.emit('error', { message: error.details[0].message });
                return;
            }

            const { roomId, content, isGift, giftId, recipientAddress } = value;
            const userId = socket.user.id;

            try {
                if (isGift && giftId) {
                    const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(giftId);
                    if (!gift) return;

                    const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId);
                    if (user.coins < gift.price_coins) {
                        socket.emit('error', { message: 'Insufficient coins' });
                        return;
                    }

                    // Deduct coins and log transaction
                    const transaction = db.transaction(() => {
                        db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(gift.price_coins, userId);
                        db.prepare('INSERT INTO transactions (user_id, amount_coins, type, description) VALUES (?, ?, ?, ?)')
                            .run(userId, -gift.price_coins, 'gift_send', `Sent ${gift.name}`);
                        
                        const stmt = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, is_gift, gift_id) VALUES (?, ?, ?, ?, ?)');
                        const result = stmt.run(roomId, userId, content || `Sent a ${gift.name}`, 1, giftId);
                        const messageId = result.lastInsertRowid;

                        db.prepare('INSERT INTO gift_orders (message_id, recipient_address) VALUES (?, ?)').run(messageId, recipientAddress || null);
                        return messageId;
                    });
                    transaction();
                } else {
                    const stmt = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, is_gift) VALUES (?, ?, ?, ?)');
                    stmt.run(roomId, userId, content, 0);
                }

                const sender = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(userId);

                io.to(`room_${roomId}`).emit('receive_message', {
                    senderId: socket.user.id,
                    senderUsername: socket.user.username,
                    senderAvatar: sender ? sender.avatar_url : null,
                    content,
                    isGift: isGift || false,
                    giftId: giftId || null,
                    createdAt: new Date().toISOString()
                });
            } catch (error) {
                console.error('Socket error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.username}`);
        });
    });
};
