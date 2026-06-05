// backend/__tests__/app.test.js
const request = require('supertest');
const app = require('../app');

describe('GET /', () => {
    it('should return 200 OK and running message', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('eSportCal API is running...');
    });
});