const request = require('supertest');
const fs = require('fs');
const path = require('path');

const testDbPath = path.join(__dirname, 'test_convos.db');
process.env.DB_PATH = testDbPath;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const app = require('../src/index');
const { db } = require('../src/models/schema');

describe('Conversations API', () => {
    let token1, token2, user1Id, user2Id;

    beforeAll(async () => {
        // Register and login user1
        await request(app).post('/api/auth/register').send({ username: 'user1', password: 'password1' });
        let login = await request(app).post('/api/auth/login').send({ username: 'user1', password: 'password1' });
        token1 = login.body.token;
        user1Id = login.body.user.id;

        // Register and login user2
        await request(app).post('/api/auth/register').send({ username: 'user2', password: 'password2' });
        login = await request(app).post('/api/auth/login').send({ username: 'user2', password: 'password2' });
        token2 = login.body.token;
        user2Id = login.body.user.id;
    });

    afterAll(() => {
        db.close();
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    it('should create a 1-on-1 conversation', async () => {
        const res = await request(app)
            .post('/api/conversations')
            .set('Authorization', `Bearer ${token1}`)
            .send({ participantId: user2Id });
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    it('should return existing conversation for same participants', async () => {
        const res = await request(app)
            .post('/api/conversations')
            .set('Authorization', `Bearer ${token1}`)
            .send({ participantId: user2Id });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id');
    });

    it('should create a group conversation', async () => {
        const res = await request(app)
            .post('/api/conversations/group')
            .set('Authorization', `Bearer ${token1}`)
            .send({
                name: 'Test Group',
                participantIds: [user2Id],
                avatarUrl: 'http://example.com/group.png'
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    it('should list user conversations', async () => {
        const res = await request(app)
            .get('/api/conversations')
            .set('Authorization', `Bearer ${token1}`);
        
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
        
        const group = res.body.find(c => c.is_group === 1);
        expect(group).toHaveProperty('group_name', 'Test Group');
    });
});
