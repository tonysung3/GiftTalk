const { db } = require('../models/schema');

// Get all orders for the current user (sent gifts)
exports.getMySentGiftOrders = (req, res) => {
    try {
        const userId = req.user.id;
        const orders = db.prepare(`
            SELECT go.*, m.content, m.created_at, g.name as gift_name, g.image_url 
            FROM gift_orders go
            JOIN messages m ON go.message_id = m.id
            JOIN gifts g ON m.gift_id = g.id
            WHERE m.sender_id = ?
            ORDER BY go.updated_at DESC
        `).all(userId);
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getOrderById = (req, res) => {
    try {
        const { id } = req.params;
        const order = db.prepare(`
            SELECT go.*, m.content, m.created_at, g.name as gift_name, g.image_url 
            FROM gift_orders go
            JOIN messages m ON go.message_id = m.id
            JOIN gifts g ON m.gift_id = g.id
            WHERE go.id = ? AND m.sender_id = ?
        `).get(id, req.user.id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: Get all orders
exports.getAllOrders = (req, res) => {
    try {
        // In a real app, we would check if user is admin
        const orders = db.prepare(`
            SELECT go.*, m.content, m.created_at, g.name as gift_name, u.username as sender_username, r.username as recipient_username
            FROM gift_orders go
            JOIN messages m ON go.message_id = m.id
            JOIN gifts g ON m.gift_id = g.id
            JOIN users u ON m.sender_id = u.id
            LEFT JOIN users r ON r.id = (
                SELECT user_id FROM conversation_participants cp 
                WHERE cp.conversation_id = m.conversation_id AND cp.user_id != m.sender_id 
                LIMIT 1
            )
            ORDER BY go.updated_at DESC
        `).all();
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: Update order status
exports.updateOrderStatus = (req, res) => {
    try {
        const { orderId, status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const stmt = db.prepare('UPDATE gift_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const result = stmt.run(status, orderId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
