// backend/__tests__/auth.test.js
const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Authentication API Integration Tests', () => {
    const testUser = {
        username: 'test_auth_jest',
        email: 'jest_auth@test-example.com',
        password: 'password123Secure'
    };

    // Clean up test users before and after tests
    const cleanup = async () => {
        await db.query("DELETE FROM users WHERE email LIKE '%@test-example.com'");
    };

    beforeAll(async () => {
        await cleanup();
    });

    afterAll(async () => {
        await cleanup();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully and return a token (auto-verified in test mode)', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe(testUser.username);
            expect(response.body.user.email).toBe(testUser.email);
        });

        it('should fail to register a user with an already existing email/username', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(response.statusCode).toBe(409);
            expect(response.body).toHaveProperty('error');
        });

        it('should fail to register a user with missing fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'short',
                    // missing email
                    password: 'password'
                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should successfully log in the registered user and return a JWT', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: testUser.email,
                    password: testUser.password
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(testUser.email);
        });

        it('should successfully log in using username as identifier', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: testUser.username,
                    password: testUser.password
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        it('should reject login with incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: testUser.email,
                    password: 'wrongPassword'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject login for non-existent users', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'does_not_exist@test-example.com',
                    password: 'password123'
                });

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });
});
