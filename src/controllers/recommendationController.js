const { db } = require('../models/schema');

/**
 * Get gift recommendations for the current user.
 * Logic:
 * 1. Most popular gifts (most sent globally).
 * 2. Affordable gifts (within user's current coin balance).
 * 3. Recent gifts sent by the user.
 */
exports.getRecommendations = (req, res) => {
    try {
        const userId = req.user.id;
        const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId);

        // 1. Get most popular gifts from event_logs
        const popularGifts = db.prepare(`
            SELECT gift_id, COUNT(*) as count
            FROM (
                SELECT json_extract(event_data, '$.giftId') as gift_id
                FROM event_logs
                WHERE event_type = 'gift_send'
            )
            WHERE gift_id IS NOT NULL
            GROUP BY gift_id
            ORDER BY count DESC
            LIMIT 10
        `).all();

        const popularIds = popularGifts.map(g => parseInt(g.gift_id)).filter(id => !isNaN(id));

        // 2. Get user's recently sent gifts
        const recentGifts = db.prepare(`
            SELECT DISTINCT json_extract(event_data, '$.giftId') as gift_id
            FROM event_logs
            WHERE event_type = 'gift_send' AND user_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        `).all(userId);
        
        const recentIds = recentGifts.map(g => parseInt(g.gift_id)).filter(id => !isNaN(id));

        // Combine IDs, prioritize recent, then popular
        const candidateIds = [...new Set([...recentIds, ...popularIds])];

        let recommendations = [];
        if (candidateIds.length > 0) {
            const placeholders = candidateIds.map(() => '?').join(',');
            recommendations = db.prepare(`
                SELECT * FROM gifts 
                WHERE id IN (${placeholders}) AND price_coins <= ?
                LIMIT 5
            `).all(...candidateIds, user.coins);
        }

        // 3. If not enough recommendations, fill with random affordable gifts
        if (recommendations.length < 5) {
            const existingIds = recommendations.map(r => r.id);
            const remaining = 5 - recommendations.length;
            const notInClause = existingIds.length > 0 ? `AND id NOT IN (${existingIds.map(() => '?').join(',')})` : '';
            
            const randomGifts = db.prepare(`
                SELECT * FROM gifts 
                WHERE price_coins <= ? ${notInClause}
                ORDER BY RANDOM()
                LIMIT ?
            `).all(user.coins, ...existingIds, remaining);
            
            recommendations = [...recommendations, ...randomGifts];
        }

        res.json(recommendations);
    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
