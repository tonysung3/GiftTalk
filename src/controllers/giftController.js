const { db } = require('../models/schema');
const { logEvent } = require('../utils/logger');
const { getGiftTranslation } = require('../utils/i18n');

exports.getAllGifts = (req, res) => {
    try {
        const locale = req.query.lang || (req.user && req.user.language) || 'en';
        const gifts = db.prepare('SELECT * FROM gifts').all();
        
        // Apply translations
        const translatedGifts = gifts.map(gift => {
            const translation = getGiftTranslation(gift.id, locale);
            if (translation) {
                return { ...gift, name: translation.name, description: translation.description };
            }
            return gift;
        });

        res.json(translatedGifts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getGiftById = (req, res) => {
    try {
        const { id } = req.params;
        const locale = req.query.lang || (req.user && req.user.language) || 'en';
        
        const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(id);
        if (!gift) {
            return res.status(404).json({ error: 'Gift not found' });
        }

        const translation = getGiftTranslation(gift.id, locale);
        if (translation) {
            gift.name = translation.name;
            gift.description = translation.description;
        }

        res.json(gift);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.sendGift = async (req, res) => {
    try {
        const { conversationId, giftId, recipientAddress } = req.body;
        const senderId = req.user.id;

        const gift = db.prepare('SELECT * FROM gifts WHERE id = ?').get(giftId);
        if (!gift) {
            return res.status(404).json({ error: 'Gift not found' });
        }

        const sender = db.prepare('SELECT coins FROM users WHERE id = ?').get(senderId);
        if (sender.coins < gift.price_coins) {
            return res.status(400).json({ error: 'Insufficient coins' });
        }

        // Deduct coins and log transaction
        const transaction = db.transaction(() => {
            db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(gift.price_coins, senderId);
            db.prepare('INSERT INTO transactions (user_id, amount_coins, type, description) VALUES (?, ?, ?, ?)')
                .run(senderId, -gift.price_coins, 'gift_send', `Sent ${gift.name}`);
            
            const stmt = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, is_gift, gift_id) VALUES (?, ?, ?, ?, ?)');
            const result = stmt.run(conversationId, senderId, `Sent a ${gift.name}`, 1, giftId);
            const messageId = result.lastInsertRowid;

            db.prepare('INSERT INTO gift_orders (message_id, recipient_address) VALUES (?, ?)').run(messageId, recipientAddress || null);
            
            return messageId;
        });
        const messageId = transaction();

        // Log event for analytics
        logEvent(senderId, 'gift_send', { giftId, conversationId, messageId, price: gift.price_coins });

        res.json({ message: 'Gift sent successfully', newBalance: sender.coins - gift.price_coins });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: Add a new gift to catalog
exports.addGift = (req, res) => {
    try {
        const { name, description, price_coins, image_url } = req.body;
        if (!name || !price_coins) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const stmt = db.prepare('INSERT INTO gifts (name, description, price_coins, image_url) VALUES (?, ?, ?, ?)');
        const result = stmt.run(name, description, price_coins, image_url);
        
        res.status(201).json({ message: 'Gift added successfully', giftId: result.lastInsertRowid });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: Update a gift
exports.updateGift = (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price_coins, image_url } = req.body;
        
        const stmt = db.prepare('UPDATE gifts SET name = ?, description = ?, price_coins = ?, image_url = ? WHERE id = ?');
        const result = stmt.run(name, description, price_coins, image_url, id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Gift not found' });
        }

        res.json({ message: 'Gift updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: Delete a gift
exports.deleteGift = (req, res) => {
    try {
        const { id } = req.params;
        const stmt = db.prepare('DELETE FROM gifts WHERE id = ?');
        const result = stmt.run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Gift not found' });
        }

        res.json({ message: 'Gift deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
