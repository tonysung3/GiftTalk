const request = require('supertest');
const fs = require('fs');
const path = require('path');

const testDbPath = path.join(__dirname, 'test_gifts.db');
process.env.DB_PATH = testDbPath;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const app = require('../src/index');
const { db } = require('../src/models/schema');

describe('Gifts API', () => {
    let token;
    let adminToken;

    beforeAll(async () => {
        // Register and login a normal user
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'user1', password: 'password123' });
        
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'user1', password: 'password123' });
        token = loginRes.body.token;

        // Login as admin (seeded by schema)
        const adminLoginRes = await request(app)
            .post('/api/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        adminToken = adminLoginRes.body.token;
    });

    afterAll(() => {
        db.close();
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    it('should list all gifts', async () => {
        const res = await request(app).get('/api/gifts');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('should allow admin to add a new gift', async () => {
        const res = await request(app)
            .post('/api/gifts/admin')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Test Gift',
                description: 'Test Description',
                price_coins: 50,
                image_url: 'http://example.com/test.png'
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('giftId');
    });

    it('should NOT allow normal user to add a gift', async () => {
        const res = await request(app)
            .post('/api/gifts/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Hacker Gift',
                description: 'Should fail',
                price_coins: 1,
                image_url: 'http://example.com/fail.png'
            });
        
        expect(res.statusCode).toEqual(403);
    });
});
