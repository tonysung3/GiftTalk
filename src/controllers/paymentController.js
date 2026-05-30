const paypal = require('../config/paypal');
const { db } = require('../models/schema');
const { logEvent } = require('../utils/logger');

exports.createPayPalOrder = async (req, res) => {
    try {
        const { packId } = req.body;
        const pack = db.prepare('SELECT * FROM coin_packs WHERE id = ?').get(packId);

        if (!pack) {
            return res.status(404).json({ error: 'Coin pack not found' });
        }

        const order = await paypal.createOrder(pack.price_usd.toString());
        
        // Record pending transaction
        db.prepare(`
            INSERT INTO transactions (user_id, amount_coins, type, description, status, paypal_order_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(req.user.id, pack.coins, 'purchase', `Pending: ${pack.name}`, 'pending', order.id);

        logEvent(req.user.id, 'payment_start', { packId, price: pack.price_usd, paypalOrderId: order.id });
        
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.capturePayPalOrder = async (req, res) => {
    try {
        const { orderId, packId } = req.body;
        const userId = req.user.id;

        // Verify pending transaction exists and belongs to this user
        const pendingTx = db.prepare('SELECT * FROM transactions WHERE paypal_order_id = ? AND user_id = ? AND status = ?')
            .get(orderId, userId, 'pending');

        if (!pendingTx) {
            return res.status(400).json({ error: 'Invalid order or order already processed' });
        }

        const capture = await paypal.captureOrder(orderId);

        if (capture.status === 'COMPLETED') {
            const pack = db.prepare('SELECT * FROM coin_packs WHERE id = ?').get(packId);
            
            // Check if packId matches what was requested originally (optional but good)
            // For now we just use the pack from the database linked to the transaction if we want to be super safe.
            // But the current implementation uses packId from body. Let's fix it to be safer.
            
            // Re-verify pack coins if needed, but we have pendingTx.amount_coins
            
            const coinsToCredit = pendingTx.amount_coins;

            // Update user balance and log transaction in a transaction
            const transaction = db.transaction(() => {
                db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(coinsToCredit, userId);
                db.prepare('UPDATE transactions SET status = ?, description = ? WHERE id = ?')
                    .run('completed', `Purchased ${coinsToCredit} coins`, pendingTx.id);
            });
            transaction();

            logEvent(userId, 'payment_complete', { packId, coins: coinsToCredit, paypalOrderId: orderId });

            res.json({ status: 'COMPLETED', coinsAdded: coinsToCredit });
        } else {
            db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('failed', pendingTx.id);
            logEvent(req.user.id, 'payment_failed', { packId, paypalOrderId: orderId, status: capture.status });
            res.status(400).json({ error: 'Payment not completed', capture });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
