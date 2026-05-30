const { db } = require('../models/schema');

exports.searchUsers = (req, res) => {
    try {
        const query = req.query.q || req.query.query;
        const userId = req.user.id;

        if (!query) {
            return res.json([]);
        }

        const users = db.prepare('SELECT id, username, display_name, avatar_url FROM users WHERE (username LIKE ? OR display_name LIKE ?) AND id != ? LIMIT 20').all(`%${query}%`, `%${query}%`, userId);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getProfile = (req, res) => {
    try {
        const user = db.prepare('SELECT id, username, display_name, coins, role, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateProfile = (req, res) => {
    try {
        const { displayName, avatarUrl } = req.body;
        const userId = req.user.id;

        if (displayName !== undefined && avatarUrl !== undefined) {
            db.prepare('UPDATE users SET display_name = ?, avatar_url = ? WHERE id = ?').run(displayName, avatarUrl, userId);
        } else if (displayName !== undefined) {
            db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName, userId);
        } else if (avatarUrl !== undefined) {
            db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, userId);
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateAvatar = (req, res) => {
    try {
        const { avatarUrl } = req.body;
        const userId = req.user.id;

        db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, userId);
        res.json({ message: 'Avatar updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllUsers = (req, res) => {
    try {
        const users = db.prepare('SELECT id, username, display_name, coins, role, avatar_url, created_at FROM users').all();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
