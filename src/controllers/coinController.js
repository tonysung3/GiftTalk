const { db } = require('../models/schema');

exports.getCoinPacks = (req, res) => {
    try {
        const packs = db.prepare('SELECT * FROM coin_packs').all();
        res.json(packs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getBalance = (req, res) => {
    try {
        const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(req.user.id);
        res.json({ coins: user.coins });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getTransactions = (req, res) => {
    try {
        const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.addCoinPack = (req, res) => {
    try {
        const { name, coins, price_usd } = req.body;
        const result = db.prepare('INSERT INTO coin_packs (name, coins, price_usd) VALUES (?, ?, ?)').run(name, coins, price_usd);
        res.status(201).json({ id: result.lastInsertRowid, name, coins, price_usd });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateCoinPack = (req, res) => {
    try {
        const { id } = req.params;
        const { name, coins, price_usd } = req.body;
        db.prepare('UPDATE coin_packs SET name = ?, coins = ?, price_usd = ? WHERE id = ?').run(name, coins, price_usd, id);
        res.json({ message: 'Coin pack updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteCoinPack = (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM coin_packs WHERE id = ?').run(id);
        res.json({ message: 'Coin pack deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
