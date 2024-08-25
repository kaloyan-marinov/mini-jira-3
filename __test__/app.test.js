const mms = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../src/app');
const Issue = require('../src/models');

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
  test('if ID does not exist, should return 404', async () => {
    // Act.
    const response = await request(app).get('/api/v1/issues/17');

    // Assert.
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: 'Invalid ID provided',
    });
  });

  test('if ID exists, should return 200 and corresponding issue', async () => {
    // Arrange.
    const deadline = new Date('2024-08-19T06:17:17.170Z');
    const issue = await Issue.create({
      status: '1 = backlog',
      deadline,
      epic: 'ease of development',
      description: 'introduce code coverage reports in HTML format',
    });

    // Act.
    const response = await request(app).get(`/api/v1/issues/${issue._id}`);

    // Assert.
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      __v: expect.anything(),
      _id: issue.id,
      createdAt: issue.createdAt.toISOString(),
      status: '1 = backlog',
      deadline: deadline.toISOString(),
      // finishedAt: null,
      epic: 'ease of development',
      description: 'introduce code coverage reports in HTML format',
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
