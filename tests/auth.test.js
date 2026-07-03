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

    describe('PUT /api/user/me & DELETE /api/user/me Integration', () => {
        let userToken = '';

        beforeAll(async () => {
            // Log in the registered testUser to get the JWT
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: testUser.email,
                    password: testUser.password
                });
            userToken = response.body.token;
        });

        it('should fail to update profile if not authenticated', async () => {
            const response = await request(app)
                .put('/api/user/me')
                .send({ username: 'new_username_jest' });

            expect(response.statusCode).toBe(401);
        });

        it('should successfully update user username and password', async () => {
            const response = await request(app)
                .put('/api/user/me')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    username: 'updated_jest_user',
                    password: 'newPassword123Secure',
                    currentPassword: testUser.password
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.user.username).toBe('updated_jest_user');
            // If username changed, it should return a new token
            expect(response.body).toHaveProperty('token');
            userToken = response.body.token; // Update token for subsequent requests
        });

        it('should successfully login with the new password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'updated_jest_user',
                    password: 'newPassword123Secure'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        it('should fail to delete account if not authenticated', async () => {
            const response = await request(app)
                .delete('/api/user/me');

            expect(response.statusCode).toBe(401);
        });

        it('should successfully delete account (GDPR)', async () => {
            const response = await request(app)
                .delete('/api/user/me')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe('Account deleted successfully.');
        });

        it('should no longer be able to log in after account deletion', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'updated_jest_user',
                    password: 'newPassword123Secure'
                });

            expect(response.statusCode).toBe(401);
        });
    });

    describe('Forgot & Reset Password API Integration', () => {
        let resetUser = {
            username: 'reset_test_user',
            email: 'reset_user@test-example.com',
            password: 'originalPassword123'
        };

        beforeAll(async () => {
            // Register a user
            await request(app)
                .post('/api/auth/register')
                .send(resetUser);
        });

        it('should request a password reset email successfully', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: resetUser.email });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toContain('reset link has been sent');
        });

        it('should successfully reset password with the database token', async () => {
            // Fetch token from DB
            const userRes = await db.query('SELECT reset_token FROM users WHERE email = $1', [resetUser.email]);
            const token = userRes.rows[0].reset_token;
            expect(token).toBeDefined();

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    token,
                    password: 'newPassword999Secure'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toContain('Password has been reset successfully');
        });

        it('should successfully login with the new reset password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: resetUser.email,
                    password: 'newPassword999Secure'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('token');
        });
    });

    describe('SSO Redirects API Integration', () => {
        it('should redirect /api/auth/google to Google OAuth URL', async () => {
            const response = await request(app)
                .get('/api/auth/google');
            
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toContain('accounts.google.com');
        });

        it('should redirect /api/auth/twitch to Twitch OAuth URL', async () => {
            const response = await request(app)
                .get('/api/auth/twitch');
            
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toContain('twitch.tv');
        });
    });
});
