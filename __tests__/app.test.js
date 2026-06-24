// backend/__tests__/app.test.js
const request = require('supertest');
const app = require('../app');
const db = require('../db');
const axios = require('axios');

jest.mock('axios');

describe('App API Integration Tests', () => {
    beforeAll(async () => {
        // Clean test database cache
        await db.query('DELETE FROM teams_cache WHERE id = 128268');
    });

    afterAll(async () => {
        await db.query('DELETE FROM teams_cache WHERE id = 128268');
    });

    describe('GET /', () => {
        it('should return 200 OK and running message', async () => {
            const response = await request(app).get('/');
            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('eSportCal API is running...');
        });
    });

    describe('GET /api/teams/:id', () => {
        it('should fetch team from PandaScore, cache it, and return JSON', async () => {
            const mockTeamData = {
                id: 128268,
                name: 'Karmine Corp',
                image_url: 'https://cdn.pandascore.co/images/team/image/128268/karmine-corp.png',
                players: [
                    { id: 1, name: 'Canna', role: 'top', image_url: 'canna.webp' },
                    { id: 2, name: 'Skewmond', role: 'jungle', image_url: 'skewmond.webp' }
                ]
            };

            axios.get.mockResolvedValue({ data: mockTeamData });

            const response = await request(app).get('/api/teams/128268');

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(128268);
            expect(response.body.name).toBe('Karmine Corp');
            expect(response.body.players.length).toBe(2);
            expect(response.body.players[0].name).toBe('Canna');

            // Verify it was saved in db cache
            const dbCheck = await db.query('SELECT * FROM teams_cache WHERE id = 128268');
            expect(dbCheck.rows.length).toBe(1);
            expect(dbCheck.rows[0].name).toBe('Karmine Corp');
        });

        it('should return cached team directly on subsequent call without calling PandaScore', async () => {
            // Reset mock to check if it's NOT called
            axios.get.mockClear();

            const response = await request(app).get('/api/teams/128268');

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(128268);
            expect(axios.get).not.toHaveBeenCalled();
        });
    });
});