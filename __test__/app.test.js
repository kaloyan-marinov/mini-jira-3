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

describe('PUT /api/v1/issues/:id', () => {
  test('if a invalid ID is provided, should return 400', async () => {
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

describe('GET /api/v1/issues', () => {
  test('if there are no Issue resources in the MongoDB server, should return 200 and an empty list', async () => {
    // Act.
    const response = await request(app).get('/api/v1/issues');

    // Assert.
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
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

    // TODO: (2024/08/20, 23:20) make this test lighter on manipulation/logic + easier to just read and understand
    const issue1JSON = issue1.toJSON();
    const issue2JSON = issue2.toJSON();
    expect(response.body).toEqual({
      resources: [
        {
          ...issue1JSON,
          _id: issue1JSON._id.toString(),
          deadline: issue1JSON.deadline.toISOString(),
          createdAt: issue1JSON.createdAt.toISOString(),
        },
        {
          ...issue2JSON,
          _id: issue2JSON._id.toString(),
          deadline: issue2JSON.deadline.toISOString(),
          createdAt: issue2JSON.createdAt.toISOString(),
        },
      ],
    });
  });
});
