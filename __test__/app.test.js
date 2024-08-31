const mms = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../src/app');
const Issue = require('../src/models');
const decodeQueryStringWithinUrl = require('../src/utilities');

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

describe('GET /api/v1/issues', () => {
  test('if there are no Issue resources in the MongoDB server, should return 200 and an empty list', async () => {
    // Act.
    const response = await request(app).get('/api/v1/issues');

    // Assert.
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      meta: {
        total: 0,
        prev: null,
        curr: '/api/v1/issues?perPage=100&page=1',
        next: null,
      },
      resources: [],
    });
  });

  test('if there are Issue resources, should return 200 and representations of the resources', async () => {
    // Arrange.
    const issue1 = await Issue.create({
      status: '3 = in progress',
      deadline: new Date('2024-08-20T21:07:45.759Z'),
      description: 'write tests for the other request-handling functions',
    });

    const issue2 = await Issue.create({
      status: '1 = backlog',
      deadline: new Date('2024-08-20T21:08:31.345Z'),
      description:
        'switch from `const express = require(express)` to `import express from "express";"',
    });

    // Act.
    const response = await request(app).get('/api/v1/issues');

    // Assert.
    expect(response.status).toEqual(200);

    expect(response.body).toEqual({
      meta: {
        total: 2,
        prev: null,
        curr: '/api/v1/issues?perPage=100&page=1',
        next: null,
      },
      resources: [
        {
          __v: expect.anything(),
          _id: issue1._id.toString(),
          createdAt: expect.anything(),
          status: '3 = in progress',
          deadline: '2024-08-20T21:07:45.759Z',
          description: 'write tests for the other request-handling functions',
        },
        {
          __v: expect.anything(),
          _id: issue2._id.toString(),
          createdAt: expect.anything(),
          status: '1 = backlog',
          deadline: '2024-08-20T21:08:31.345Z',
          description:
            'switch from `const express = require(express)` to `import express from "express";"',
        },
      ],
    });
  });

  test(
    'if there are Issue resources and "select" is present as a URL query parameter,' +
      ' should return 200 and representations of the resources',
    async () => {
      // Arrange.
      const issue1 = await Issue.create({
        status: '2 = selected',
        deadline: new Date('2024-08-31T08:25:06.701Z'),
        description: 'fill out the tax return',
      });

      const issue2 = await Issue.create({
        status: '1 = backlog',
        deadline: new Date('2024-08-31T08:26:06.701Z'),
        description: 'submit the tax return',
      });

      // Act.
      const response = await request(app).get(
        '/api/v1/issues?select=status,description'
      );

      // Assert.
      expect(response.status).toEqual(200);

      expect(response.body).toEqual({
        meta: {
          total: 2,
          prev: null,
          curr: decodeQueryStringWithinUrl(
            '/api/v1/issues?select=status,description&perPage=100&page=1'
          ),
          next: null,
        },
        resources: [
          {
            _id: issue1._id.toString(),
            status: '2 = selected',
            description: 'fill out the tax return',
          },
          {
            _id: issue2._id.toString(),
            status: '1 = backlog',
            description: 'submit the tax return',
          },
        ],
      });
    }
  );
});

describe('GET /api/v1/issues/:id', () => {
  test('if an invalid ID is provided, should return 400', async () => {
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

describe('PUT /api/v1/issues/:id', () => {
  test('if an invalid ID is provided, should return 400', async () => {
    // Arrange.
    const issue = await Issue.create({
      status: '1 = backlog',
      deadline: new Date('2024-08-20T20:34:07.386Z'),
      description: 'code cvrg reports in HTML',
    });

    const issueId = issue._id.toString();
    const invalidId = issueId.slice(0, issueId.length - 1);

    // Act.
    const response = await request(app).put(`/api/v1/issues/${invalidId}`);

    // Assert.
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: 'Invalid ID provided',
    });
  });

  test('if a non-existent ID is provided, should return 404', async () => {
    // Arrange.
    const issue = await Issue.create({
      status: '1 = backlog',
      deadline: new Date('2024-08-20T20:18:09.763Z'),
      description: 'code cvrg reports in HTML',
    });

    const issueId = issue._id.toString();
    const notLastDigitOfId =
      issueId.charAt(issueId.length - 1) == '0' ? '1' : '0';
    const nonexistentId =
      issueId.slice(0, issueId.length - 1) + notLastDigitOfId;

    // Act.
    const response = await request(app).put(`/api/v1/issues/${nonexistentId}`);

    // Assert.
    expect(response.status).toEqual(404);
    expect(response.body).toEqual({
      message: 'Resource not found',
    });
  });

  test('if a valid ID is provided, should return 200', async () => {
    // Arrange.
    const issue = await Issue.create({
      status: '1 = backlog',
      deadline: new Date('2024-08-20T20:38:18.162Z'),
      description: 'code cvrg reports in HTML',
    });

    const issueId = issue._id.toString();

    // Act.
    const response = await request(app).put(`/api/v1/issues/${issueId}`).send({
      status: '2 = selected',
      description: 'generate code coverage reports in HTML format',
    });

    // Assert.
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      __v: expect.anything(),
      _id: issueId,
      createdAt: expect.anything(),
      status: '2 = selected',
      deadline: '2024-08-20T20:38:18.162Z',
      description: 'generate code coverage reports in HTML format',
    });
  });
});

describe('DELETE /api/v1/issues/:id', () => {
  test('if an invalid ID is provided, should return 400', async () => {
    // Arrange.
    const issue = await Issue.create({
      status: '1 = backlog',
      deadline: new Date('2024-08-22T20:40:41.277Z'),
      description: 'generate code coverage reports in HTML format',
    });

    const issueId = issue._id.toString();
    const invalidId = issueId.slice(0, issueId.length - 1);

    // Act.
    response = await request(app).delete(`/api/v1/issues/${invalidId}`);

    // Assert.
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: 'Invalid ID provided',
    });
  });

  test('if a non-existent ID is provided, should return 404', async () => {
    // Arrange.
    const issue = await Issue.create({
      status: '1 = backlog',
      deadline: new Date('2024-08-22T20:40:41.277Z'),
      description: 'generate code coverage reports in HTML format',
    });

    const issueId = issue._id.toString();
    const notLastDigitOfId =
      issueId.charAt(issueId.length - 1) == '0' ? '1' : '0';
    const nonexistentId =
      issueId.slice(0, issueId.length - 1) + notLastDigitOfId;

    // Act.
    const response = await request(app).delete(
      `/api/v1/issues/${nonexistentId}`
    );

    // Assert.
    expect(response.status).toEqual(404);
    expect(response.body).toEqual({
      message: 'Resource not found',
    });
  });

  test('if a valid ID is provided, should return 204', async () => {
    // Arrange.
    const issue = await Issue.create({
      status: '1 = backlog',
      deadline: new Date('2024-08-22T20:40:41.277Z'),
      description: 'generate code coverage reports in HTML format',
    });

    const issueId = issue._id.toString();

    // Act.
    const response = await request(app).delete(`/api/v1/issues/${issueId}`);

    // Assert.
    expect(response.status).toEqual(204);
    expect(response.headers['content-length']).toEqual('0');
    expect(response.body).toEqual({});
  });
});
