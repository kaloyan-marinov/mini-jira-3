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

  test('if ID exists, should return 200 and corresponding issue', async () => {
    // Act.
    const response = await request(app).get('/api/v1/issues/1');

    // Assert.
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      id: 1,
      createdAt: null,
      status: '3 = in progress',
      deadline: null,
      finishedAt: null,
      epic: 'backend',
      description:
        'build a backend application using Express (without a persistence layer)',
    });
  });
});

describe('POST /api/v1/issues', () => {
  test('if "status" is missing, should return 400', async () => {
    // Act.
    const response = await request(app).post('/api/v1/issues').send({
      description: 'containerize the backend',
    });

    // Assert.
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message:
        "Each of 'status', 'description' must be specified in the HTTP request's body",
    });
  });

  test('if "description" is missing, should return 400', async () => {
    // Act.
    const response = await request(app).post('/api/v1/issues').send({
      status: '1 = in backlog',
    });

    // Assert.
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message:
        "Each of 'status', 'description' must be specified in the HTTP request's body",
    });
  });

  xtest('if "status" and "description", should return 201', async () => {
    // Act.
    const response = await request(app).post('/api/v1/issues').send({
      status: '1 = in backlog',
      description: 'containerize the backend',
    });

    // Assert.
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      id: 4,
      createdAt: null,
      status: '1 = in backlog',
      deadline: null,
      finishedAt: null,
      description: 'containerize the backend',
    });
  });
});
