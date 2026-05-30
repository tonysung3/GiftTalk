const { db } = require('../src/models/schema');
const bcrypt = require('bcryptjs');

async function seedDemoData() {
    console.log('Starting demo data seeding...');

    try {
        const passwordHash = await bcrypt.hash('password123', 10);

        // Clear existing data to avoid conflicts during demo setup
        db.prepare('DELETE FROM conversation_participants').run();
        db.prepare('DELETE FROM gift_orders').run();
        db.prepare('DELETE FROM messages').run();
        db.prepare('DELETE FROM conversations').run();
        db.prepare('DELETE FROM transactions').run();
        db.prepare('DELETE FROM users WHERE username != ?').run('admin');

        // 1. Create Users with Avatars and Display Names
        const users = [
            { username: 'alice', display_name: 'Alice Smith', password_hash: passwordHash, coins: 500, role: 'user', avatar_url: 'https://i.pravatar.cc/150?u=alice' },
            { username: 'bob', display_name: 'Bob Jones', password_hash: passwordHash, coins: 150, role: 'user', avatar_url: 'https://i.pravatar.cc/150?u=bob' },
            { username: 'charlie', display_name: 'Charlie Brown', password_hash: passwordHash, coins: 1000, role: 'user', avatar_url: 'https://i.pravatar.cc/150?u=charlie' },
        ];

        const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, display_name, password_hash, coins, role, avatar_url) VALUES (?, ?, ?, ?, ?, ?)');
        users.forEach(u => insertUser.run(u.username, u.display_name, u.password_hash, u.coins, u.role, u.avatar_url));

        const alice = db.prepare('SELECT id FROM users WHERE username = ?').get('alice');
        const bob = db.prepare('SELECT id FROM users WHERE username = ?').get('bob');
        const charlie = db.prepare('SELECT id FROM users WHERE username = ?').get('charlie');

        // 2. Create Conversations
        const createConv = db.prepare('INSERT INTO conversations (name, is_group, avatar_url) VALUES (?, ?, ?)');
        const addParticipant = db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)');

        // Alice & Bob (1-on-1)
        let res = createConv.run(null, 0, null);
        const convAliceBob = res.lastInsertRowid;
        addParticipant.run(convAliceBob, alice.id);
        addParticipant.run(convAliceBob, bob.id);

        // Group Chat: Alice, Bob, Charlie
        res = createConv.run('Friends Group', 1, 'https://ui-avatars.com/api/?name=Friends+Group&background=random');
        const convGroup = res.lastInsertRowid;
        addParticipant.run(convGroup, alice.id);
        addParticipant.run(convGroup, bob.id);
        addParticipant.run(convGroup, charlie.id);

        // 3. Create Messages & Gifts
        const insertMsg = db.prepare('INSERT INTO messages (conversation_id, sender_id, content, is_gift, gift_id) VALUES (?, ?, ?, ?, ?)');
        const insertOrder = db.prepare('INSERT INTO gift_orders (message_id, recipient_address, status) VALUES (?, ?, ?)');
        const insertTransaction = db.prepare('INSERT INTO transactions (user_id, amount_coins, type, description) VALUES (?, ?, ?, ?)');

        // Get some gifts
        const rose = db.prepare('SELECT id, price_coins FROM gifts WHERE name = ?').get('Red Rose');
        const chocolates = db.prepare('SELECT id, price_coins FROM gifts WHERE name = ?').get('Chocolate Box');

        // Alice & Bob messages
        insertMsg.run(convAliceBob, alice.id, 'Hey Bob! Long time no see.', 0, null);
        insertMsg.run(convAliceBob, bob.id, 'Hi Alice! Yeah, how are you?', 0, null);
        
        // Group messages
        insertMsg.run(convGroup, charlie.id, 'Welcome to the group everyone!', 0, null);
        insertMsg.run(convGroup, alice.id, 'Thanks Charlie!', 0, null);
        
        // Alice sends a gift in group
        res = insertMsg.run(convGroup, alice.id, 'Sent a group gift!', 1, rose.id);
        insertOrder.run(res.lastInsertRowid, 'Group Office', 'pending');
        insertTransaction.run(alice.id, -rose.price_coins, 'gift_send', 'Sent Red Rose to group');

        console.log('Demo data seeded successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedDemoData();
