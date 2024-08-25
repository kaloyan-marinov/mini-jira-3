const mms = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../src/app');

console.log('process.env.HOME =', process.env.HOME);
console.log('process.env.LD_LIBRARY_PATH =', process.env.LD_LIBRARY_PATH);

let mongoMemoryServer;

beforeAll(async () => {
  mongoMemoryServer = await mms.MongoMemoryServer.create();
  const uri = mongoMemoryServer.getUri();
  await mongoose.connect(uri);
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoMemoryServer.stop();
});

describe('GET /api/v1/issues/:id', () => {
  xtest('if ID does not exist, should return 404', async () => {
    // Act.
    const response = await request(app).get('/api/v1/issues/17');

    // Assert.
    expect(response.status).toEqual(404);
    expect(response.body).toEqual({
      message: 'Resource not found',
    });
  });

  xtest('if ID exists, should return 200 and corresponding issue', async () => {
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
      message: 'Unable to create a new issue.',
    });
  });

  test('if "description" is missing, should return 400', async () => {
    // Act.
    const response = await request(app).post('/api/v1/issues').send({
      status: '1 = backlog',
    });

    // Assert.
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: 'Unable to create a new issue.',
    });
  });

  test('if "status" and "description", should return 201', async () => {
    // Act.
    const response = await request(app)
      .post('/api/v1/issues')
      .send({
        createdAt: new Date('2024-08-17T09:00:00.000Z'),
        status: '1 = backlog',
        deadline: new Date('2024-08-19T09:00:00.000Z'),
        epic: 'backend',
        description: 'containerize the backend',
      });

    // Assert.
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      __v: expect.anything(),
      _id: expect.anything(),
      createdAt: '2024-08-17T09:00:00.000Z',
      status: '1 = backlog',
      deadline: '2024-08-19T09:00:00.000Z',
      epic: 'backend',
      description: 'containerize the backend',
    });
  });
});
