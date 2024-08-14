const request = require('supertest');

const app = require('../src/app');

describe('GET /api/v1/issues/:id', () => {
  test('if ID does not exist, should return 404', async () => {
    // Act.
    const response = await request(app).get('/api/v1/issues/17');

    // Assert.
    expect(response.status).toEqual(404);
    expect(response.body).toEqual({
      message: 'Resource not found',
    });
  });
});
