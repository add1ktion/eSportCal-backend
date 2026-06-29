// backend/__tests__/favorites.test.js
const request = require('supertest');
const app = require('../app');
const db = require('../db');

describe('Favorite Teams API Integration Tests', () => {
    const testUser = {
        username: 'test_favs_jest',
        email: 'jest_favs@test-example.com',
        password: 'password123Secure'
    };

    let token = '';

    // Clean up before and after
    const cleanup = async () => {
        await db.query("DELETE FROM users WHERE email LIKE '%@test-example.com'");
    };

    beforeAll(async () => {
        await cleanup();

        // Register the user to obtain a valid JWT token
        const response = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        token = response.body.token;
    });

    afterAll(async () => {
        await cleanup();
    });

    describe('POST /api/user/favorites', () => {
        it('should fail to add a favorite team if not authenticated', async () => {
            const response = await request(app)
                .post('/api/user/favorites')
                .send({ pandascore_team_id: 128268 });

            expect(response.statusCode).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('should successfully add a favorite team when authenticated', async () => {
            const response = await request(app)
                .post('/api/user/favorites')
                .set('Authorization', `Bearer ${token}`)
                .send({ pandascore_team_id: 128268 }); // Karmine Corp team ID

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('message');
            expect(response.body.favorite.pandascore_team_id).toBe(128268);
        });

        it('should ignore adding the duplicate favorite team due to unique constraint (ON CONFLICT DO NOTHING)', async () => {
            const response = await request(app)
                .post('/api/user/favorites')
                .set('Authorization', `Bearer ${token}`)
                .send({ pandascore_team_id: 128268 });

            expect(response.statusCode).toBe(201); // Still returns 201
            expect(response.body.favorite.pandascore_team_id).toBe(128268);
        });
    });

    describe('GET /api/user/favorites', () => {
        it('should fetch the list of favorite teams for the logged-in user', async () => {
            const response = await request(app)
                .get('/api/user/favorites')
                .set('Authorization', `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('favorites');
            expect(response.body.favorites.length).toBe(1);
            expect(response.body.favorites[0].pandascore_team_id).toBe(128268);
        });
    });

    describe('DELETE /api/user/favorites/:pandascore_team_id', () => {
        it('should successfully remove the favorite team', async () => {
            const response = await request(app)
                .delete('/api/user/favorites/128268')
                .set('Authorization', `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message');

            // Verify the list is now empty
            const checkRes = await request(app)
                .get('/api/user/favorites')
                .set('Authorization', `Bearer ${token}`);

            expect(checkRes.body.favorites.length).toBe(0);
        });

        it('should return 404 when trying to delete a non-existent favorite team', async () => {
            const response = await request(app)
                .delete('/api/user/favorites/999999')
                .set('Authorization', `Bearer ${token}`);

            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });
});
