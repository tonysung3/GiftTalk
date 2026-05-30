const { db } = require('../models/schema');

/**
 * Get analytics summary.
 */
exports.getAnalytics = (req, res) => {
    try {
        // 1. Total gifts sent
        const totalGifts = db.prepare("SELECT COUNT(*) as count FROM event_logs WHERE event_type = 'gift_send'").get().count;

        // 2. Total revenue (sum of coin purchase prices)
        const totalRevenue = db.prepare(`
            SELECT SUM(CAST(json_extract(event_data, '$.price') AS REAL)) as total 
            FROM event_logs 
            WHERE event_type = 'payment_complete'
        `).get().total || 0;

        // 3. Most popular gifts
        const popularGifts = db.prepare(`
            SELECT g.name, COUNT(*) as sent_count
            FROM event_logs e
            JOIN gifts g ON CAST(json_extract(e.event_data, '$.giftId') AS INTEGER) = g.id
            WHERE e.event_type = 'gift_send'
            GROUP BY g.id
            ORDER BY sent_count DESC
            LIMIT 5
        `).all();

        // 4. Daily Active Users (DAU)
        const dau = db.prepare(`
            SELECT COUNT(DISTINCT user_id) as count
            FROM event_logs
            WHERE date(created_at) = date('now')
        `).get().count;

        // 5. Conversion Rate (Purchasers / Total Users)
        const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
        const totalPurchasers = db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM event_logs WHERE event_type = 'payment_complete'").get().count;
        const conversionRate = totalUsers > 0 ? (totalPurchasers / totalUsers) * 100 : 0;

        res.json({
            summary: {
                totalGifts,
                totalRevenue,
                dau,
                totalUsers,
                conversionRate: conversionRate.toFixed(2) + '%'
            },
            popularGifts
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get detailed event logs (for admin).
 */
exports.getEventLogs = (req, res) => {
    try {
        const { limit = 50, offset = 0, eventType } = req.query;
        
        let query = 'SELECT * FROM event_logs';
        let params = [];
        
        if (eventType) {
            query += ' WHERE event_type = ?';
            params.push(eventType);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const logs = db.prepare(query).all(...params);
        res.json(logs);
    } catch (error) {
        console.error('Event logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
