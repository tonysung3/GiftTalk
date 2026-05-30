const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/gifttalk.db');
const db = new Database(dbPath);

// Enable WAL mode for better write performance
db.pragma('journal_mode = WAL');

function initializeDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT,
            password_hash TEXT NOT NULL,
            coins INTEGER DEFAULT 0,
            role TEXT DEFAULT 'user',
            avatar_url TEXT,
            language TEXT DEFAULT 'en',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            is_group BOOLEAN DEFAULT 0,
            avatar_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS conversation_participants (
            conversation_id INTEGER,
            user_id INTEGER,
            PRIMARY KEY (conversation_id, user_id),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS gifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price_coins INTEGER NOT NULL,
            image_url TEXT,
            emoji TEXT DEFAULT '🎁'
        );

        CREATE TABLE IF NOT EXISTS gift_translations (
            gift_id INTEGER,
            locale TEXT NOT NULL, -- 'en', 'es', 'fr', etc.
            name TEXT NOT NULL,
            description TEXT,
            PRIMARY KEY (gift_id, locale),
            FOREIGN KEY (gift_id) REFERENCES gifts(id)
        );

        CREATE TABLE IF NOT EXISTS coin_packs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            coins INTEGER NOT NULL,
            price_usd REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            content TEXT,
            is_gift BOOLEAN DEFAULT 0,
            gift_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (gift_id) REFERENCES gifts(id)
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount_coins INTEGER NOT NULL,
            type TEXT NOT NULL, -- 'purchase', 'gift_send', 'gift_receive'
            description TEXT,
            status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
            paypal_order_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS gift_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
            recipient_address TEXT,
            tracking_number TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES messages(id)
        );

        CREATE TABLE IF NOT EXISTS read_receipts (
            message_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (message_id, user_id),
            FOREIGN KEY (message_id) REFERENCES messages(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS event_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            event_type TEXT NOT NULL, -- 'gift_send', 'coin_purchase', 'user_login', etc.
            event_data TEXT, -- JSON string for additional data
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    // Seed some initial gifts if table is empty
    const giftCount = db.prepare('SELECT COUNT(*) as count FROM gifts').get().count;
    if (giftCount === 0) {
        const insertGift = db.prepare('INSERT INTO gifts (name, description, price_coins, image_url) VALUES (?, ?, ?, ?)');
        insertGift.run('Red Rose', 'A beautiful classic red rose.', 10, 'https://example.com/rose.png');
        insertGift.run('Chocolate Box', 'A delicious box of assorted chocolates.', 50, 'https://example.com/chocolates.png');
        insertGift.run('Teddy Bear', 'A soft and cuddly teddy bear.', 100, 'https://example.com/teddy.png');
        insertGift.run('Birthday Cake', 'A delicious chocolate cake with candles.', 150, 'https://example.com/cake.png');
        insertGift.run('Flower Bouquet', 'A fresh bouquet of mixed flowers.', 80, 'https://example.com/bouquet.png');
        insertGift.run('Champagne Bottle', 'Premium champagne for celebrations.', 300, 'https://example.com/champagne.png');
        insertGift.run('Diamond Ring', 'A sparkling diamond ring for special moments.', 1000, 'https://example.com/ring.png');
        insertGift.run('Perfume', 'A luxury fragrance bottle.', 200, 'https://example.com/perfume.png');
        insertGift.run('Watch', 'A stylish elegant wristwatch.', 500, 'https://example.com/watch.png');
        insertGift.run('Coffee Mug', 'A cute personalized coffee mug.', 30, 'https://example.com/mug.png');
        insertGift.run('Heart Balloon', 'A floating red heart balloon.', 20, 'https://example.com/balloon.png');
    }

    // Seed initial coin packs
    const packCount = db.prepare('SELECT COUNT(*) as count FROM coin_packs').get().count;
    if (packCount === 0) {
        const insertPack = db.prepare('INSERT INTO coin_packs (name, coins, price_usd) VALUES (?, ?, ?)');
        insertPack.run('Small Pack', 100, 2.99);
        insertPack.run('Medium Pack', 500, 9.99);
        insertPack.run('Large Pack', 1200, 19.99);
    }

    // Seed admin user (password: admin123)
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('admin123', 12);
        db.prepare('INSERT INTO users (username, password_hash, role, coins) VALUES (?, ?, ?, ?)').run('admin', hash, 'admin', 9999);
    }

    console.log('Database initialized successfully.');
}

module.exports = {
    db,
    initializeDatabase
};
