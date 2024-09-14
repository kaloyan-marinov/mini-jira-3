const mms = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../src/app');
const { User, RevokedToken, Issue } = require('../src/models');
const {
  corruptIdOfMongooseObject,
  decodeQueryStringWithinUrl,
} = require('../src/utilities');

console.log('process.env.HOME =', process.env.HOME);
console.log('process.env.LD_LIBRARY_PATH =', process.env.LD_LIBRARY_PATH);

let mongoMemoryServer;

// // For debugging, set the timeout for each test case to the specified amount of time.
// const MILLISECONDS_IN_FIVE_MINUTES = 5 * 60 * 1000;
// jest.setTimeout(MILLISECONDS_IN_FIVE_MINUTES);

const JSON_4_USER_1 = {
  username: 'test-jd',
  password: 'test-123',
  email: 'test-john.doe@protonmail.com',
};

const JSON_4_ISSUE_EPIC_1 = {
  status: '3 = in progress',
  deadline: new Date('2024-09-02T02:45:36.214Z'),
  description: 'backend',
};

const JSON_4_ISSUE_EPIC_2 = {
  status: '1 = backlog',
  deadline: new Date('2024-09-02T03:28:39.611Z'),
  description: 'frontend',
};

beforeAll(async () => {
  mongoMemoryServer = await mms.MongoMemoryServer.create();
  const uri = mongoMemoryServer.getUri();
  await mongoose.connect(uri);
});

const PROCESS_ENV_ORIGINAL = process.env;

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();

  process.env = {
    ...PROCESS_ENV_ORIGINAL,
    BACKEND_SECRET_KEY:
      'this-must-be-very-secure-and-must-not-be-shared-with-anyone-else',
    BACKEND_USER_ID: '17',
    BACKEND_USERNAME: 'test-username',
    BACKEND_PASSWORD: 'test-password',
    BACKEND_JWT_EXPIRES_IN: '17m',
  };
});

afterEach(() => {
  process.env = PROCESS_ENV_ORIGINAL;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoMemoryServer.stop();
});

describe('POST /api/v1/users', () => {
  test('if "username", "password", "email" are provided, should return 201', async () => {
    // Act.
    const response = await request(app)
      .post('/api/v1/users')
      .send(JSON_4_USER_1);

    // Assert.
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      __v: expect.anything(),
      _id: expect.anything(),
      createdAt: expect.anything(),
      username: 'test-jd',
      // TODO: (2024/09/14, 12:04)
      //      remove the following line
      //      + modify the request-handler so as to restore the test to a PASSing state
      password: 'test-123',
      email: 'test-john.doe@protonmail.com',
    });
  });
});

describe('GET /api/v1/users/:id', () => {
  test('if ID exists, should return 200 and corresponding user', async () => {
    // Arrange.
    const user = await User.create(JSON_4_USER_1);

    // Act.
    const response = await request(app).get(`/api/v1/users/${user._id}`);

    // Assert.
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      __v: expect.anything(),
      _id: expect.anything(),
      createdAt: expect.anything(),
      username: 'test-jd',
      // TODO: (2024/09/14, 12:10)
      //      remove the following line
      //      + modify the request-handler so as to restore the test to a PASSing state
      email: 'test-john.doe@protonmail.com',
    });
  });
});

describe('PUT /api/v1/users/:id', () => {
  test('if a valid ID is provided, should return 200', async () => {
    // Arrange.
    const user = await User.create(JSON_4_USER_1);

    const userId = user._id.toString();

    // Act.
    const response = await request(app).put(`/api/v1/users/${userId}`).send({
      username: 'test-jd-updated',
    });

    // Assert.
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      __v: expect.anything(),
      _id: userId,
      createdAt: expect.anything(),
      username: 'test-jd-updated',
      email: 'test-john.doe@protonmail.com',
    });
  });
});

describe('POST /api/v1/tokens', () => {
  test(
    'if a client sends a correct set of Basic Auth credentials,' +
      ' should return 200',
    async () => {
      // Act.
      const response = await request(app)
        .post('/api/v1/tokens')
        .set('Authorization', 'Basic ' + btoa('test-username:test-password'));

      // Assert.
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        accessToken: expect.anything(),
      });
    }
  );
});

describe('DELETE /api/v1/tokens', () => {
  test('if a client sends a valid access token, should return 204', async () => {
    // Arrange.
    const response1 = await request(app)
      .post('/api/v1/tokens')
      .set('Authorization', 'Basic ' + btoa('test-username:test-password'));

    const accessToken = response1.body.accessToken;

    // Act.
    const response2 = await request(app)
      .delete('/api/v1/tokens')
      .set('Authorization', 'Bearer ' + accessToken);

    // Assert.
    expect(response2.status).toEqual(204);
    expect(response2.headers['content-length']).toEqual('0');
    expect(response2.body).toEqual({});

    const revokedToken = await RevokedToken.find({
      accessToken,
    });
    expect(revokedToken.length).toEqual(1);
  });
});

describe('POST /api/v1/issues', () => {
  let accessToken;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/tokens')
      .set('Authorization', 'Basic ' + btoa('test-username:test-password'));

    accessToken = response.body.accessToken;
  });

  test('if "status" is missing, should return 400', async () => {
    // Act.
    const response = await request(app)
      .post('/api/v1/issues')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({
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
    const response = await request(app)
      .post('/api/v1/issues')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({
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
      .set('Authorization', 'Bearer ' + accessToken)
      .send({
        createdAt: new Date('2024-08-17T09:00:00.000Z'),
        status: '1 = backlog',
        deadline: new Date('2024-08-19T09:00:00.000Z'),
        epic: 'backend',
        description: 'containerize the backend',
      });

    // Assert.
    expect(response.status).toEqual(201);
    expect(response.headers.location).toEqual(
      `/api/v1/issues/${response.body._id}`
    );
    expect(response.body).toEqual({
      __v: expect.anything(),
      _id: expect.anything(),
      createdAt: '2024-08-17T09:00:00.000Z',
      status: '1 = backlog',
      deadline: '2024-08-19T09:00:00.000Z',
      parentId: null,
      description: 'containerize the backend',
    });
  });

  test('if "parentId" is invalid, should return 400', async () => {
    // Arrange.
    const issueId = 'this is an invalid issue ID';

    // Act.
    const response = await request(app)
      .post('/api/v1/issues')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({
        status: '1 = backlog',
        deadline: new Date('2024-09-02T02:56:42.053Z'),
        parentId: issueId,
        description: 'implement a rudimentary authentication sub-system',
      });

    // Assert.
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: 'The value provided for "parentId" is invalid',
    });
  });

  test('if "parentId" is non-existent, should returnd 400', async () => {
    // Arrange.
    const issue = await Issue.create(JSON_4_ISSUE_EPIC_1);

    const nonexistentId = corruptIdOfMongooseObject(issue);

    // Act.
    const response = await request(app)
      .post(`/api/v1/issues`)
      .set('Authorization', 'Bearer ' + accessToken)
      .send({
        status: '1 = backlog',
        deadline: new Date('2024-09-02T02:56:42.053Z'),
        parentId: nonexistentId,
        description: 'implement a rudimentary authentication sub-system',
      });

    // Assert.
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      message: 'The value provided for `parentId` is non-existent',
    });
  });

  test(
    'if "status" and "description" and "parentId" are provided,' +
      ' should return 201',
    async () => {
      // Arrange.
      const issue = await Issue.create(JSON_4_ISSUE_EPIC_1);

      // Act.
      const response = await request(app)
        .post('/api/v1/issues')
        .set('Authorization', 'Bearer ' + accessToken)
        .send({
          status: '1 = backlog',
          deadline: new Date('2024-09-02T02:48:26.383Z'),
          parentId: issue._id.toString(),
          description: 'implement a rudimentary authentication sub-system',
        });

      // Assert.
      expect(response.status).toEqual(201);
      expect(response.headers.location).toEqual(
        `/api/v1/issues/${response.body._id}`
      );
      expect(response.body).toEqual({
        __v: expect.anything(),
        _id: expect.anything(),
        createdAt: expect.anything(),
        status: '1 = backlog',
        deadline: '2024-09-02T02:48:26.383Z',
        parentId: issue._id.toString(),
        description: 'implement a rudimentary authentication sub-system',
      });
    }
  );
});

describe('GET /api/v1/issues', () => {
  let accessToken;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/tokens')
      .set('Authorization', 'Basic ' + btoa('test-username:test-password'));

    accessToken = response.body.accessToken;
  });

  test(
    'if there are no Issue resources in the MongoDB server,' +
      ' should return 200 and an empty list',
    async () => {
      // Act.
      const response = await request(app)
        .get('/api/v1/issues')
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        meta: {
          total: 0,
          first: `/api/v1/issues?page=1`,
          prev: null,
          curr: '/api/v1/issues',
          next: null,
          last: `/api/v1/issues?page=1`,
        },
        resources: [],
      });
    }
  );

  test(
    'if there are Issue resources,' +
      ' should return 200 and representations of the resources',
    async () => {
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
      const response = await request(app)
        .get('/api/v1/issues')
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response.status).toEqual(200);

      expect(response.body).toEqual({
        meta: {
          total: 2,
          first: '/api/v1/issues?perPage=100&page=1',
          prev: null,
          curr: '/api/v1/issues?perPage=100&page=1',
          next: null,
          last: '/api/v1/issues?perPage=100&page=1',
        },
        resources: [
          {
            __v: expect.anything(),
            _id: issue1._id.toString(),
            createdAt: expect.anything(),
            status: '3 = in progress',
            deadline: '2024-08-20T21:07:45.759Z',
            parentId: null,
            description: 'write tests for the other request-handling functions',
          },
          {
            __v: expect.anything(),
            _id: issue2._id.toString(),
            createdAt: expect.anything(),
            status: '1 = backlog',
            deadline: '2024-08-20T21:08:31.345Z',
            parentId: null,
            description:
              'switch from `const express = require(express)` to `import express from "express";"',
          },
        ],
      });
    }
  );

  test(
    'if there are Issue resource' +
      ' and the URL query parameters represent a request for filtering,' +
      ' should return 200, a correct total, and representation of the resources',
    async () => {
      // Arrange.
      const issueEpic1 = await Issue.create(JSON_4_ISSUE_EPIC_1);
      const issueEpic2 = await Issue.create(JSON_4_ISSUE_EPIC_2);

      const issueEpic1Id = issueEpic1._id.toString();
      const issueEpic2Id = issueEpic2._id.toString();

      const issue1 = await Issue.create({
        status: '1 = backlog',
        deadline: new Date('2024-08-31T21:43:31.696Z'),
        description: 'containerize the backend',
        parentId: issueEpic1Id,
      });

      const issue2 = await Issue.create({
        status: '1 = backlog',
        deadline: new Date('2024-08-31T22:43:31.696Z'),
        description:
          'build a client (hopefully, a CLI tool combined with "jq")',
        parentId: issueEpic2._id.toString(),
      });

      const issue3 = await Issue.create({
        status: '1 = backlog',
        deadline: new Date('2024-08-31T23:43:31.696Z'),
        description: 'convert the "epic" field to a "parentId" field',
        parentId: issueEpic1Id,
      });

      // Act.
      const response1 = await request(app)
        .get(`/api/v1/issues?parentId=${issueEpic1Id}`)
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response1.status).toEqual(200);

      expect(response1.body).toEqual({
        meta: {
          total: 2,
          first: `/api/v1/issues?parentId=${issueEpic1Id}&perPage=100&page=1`,
          prev: null,
          curr: `/api/v1/issues?parentId=${issueEpic1Id}&perPage=100&page=1`,
          next: null,
          last: `/api/v1/issues?parentId=${issueEpic1Id}&perPage=100&page=1`,
        },
        resources: [
          {
            __v: expect.anything(),
            _id: issue1._id.toString(),
            createdAt: expect.anything(),
            status: '1 = backlog',
            deadline: '2024-08-31T21:43:31.696Z',
            description: 'containerize the backend',
            parentId: issueEpic1Id,
          },
          {
            __v: expect.anything(),
            _id: issue3._id.toString(),
            createdAt: expect.anything(),
            status: '1 = backlog',
            deadline: '2024-08-31T23:43:31.696Z',
            description: 'convert the "epic" field to a "parentId" field',
            parentId: issueEpic1Id,
          },
        ],
      });

      // Act.
      const response2 = await request(app)
        .get('/api/v1/issues?parentId=null')
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response2.status).toEqual(200);

      const expectedBodyOfResponse2 = {
        meta: {
          total: 2,
          first: '/api/v1/issues?parentId=null&perPage=100&page=1',
          prev: null,
          curr: '/api/v1/issues?parentId=null&perPage=100&page=1',
          next: null,
          last: '/api/v1/issues?parentId=null&perPage=100&page=1',
        },
        resources: [
          {
            __v: expect.anything(),
            _id: issueEpic1Id,
            createdAt: expect.anything(),
            status: '3 = in progress',
            deadline: '2024-09-02T02:45:36.214Z',
            description: 'backend',
            parentId: null,
          },
          {
            __v: expect.anything(),
            _id: issueEpic2Id,
            createdAt: expect.anything(),
            status: '1 = backlog',
            deadline: '2024-09-02T03:28:39.611Z',
            description: 'frontend',
            parentId: null,
          },
        ],
      };
      expect(response2.body).toEqual(expectedBodyOfResponse2);

      // Act.
      const response3 = await request(app)
        .get('/api/v1/issues?parentId=')
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response3.status).toEqual(200);

      const expectedBodyOfResponse3 = { ...expectedBodyOfResponse2 };
      expect(response3.body).toEqual(expectedBodyOfResponse3);
    }
  );

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
      const response = await request(app)
        .get('/api/v1/issues?select=status,description')
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response.status).toEqual(200);

      const currUrl = decodeQueryStringWithinUrl(
        '/api/v1/issues?select=status,description&perPage=100&page=1'
      );
      expect(response.body).toEqual({
        meta: {
          total: 2,
          first: currUrl,
          prev: null,
          curr: currUrl,
          next: null,
          last: currUrl,
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

  test(
    'if there are Issue resources and "sort" is present as a URL query parameter,' +
      ' should return 200 and representations of the resources',
    async () => {
      // Arrange.
      const issue1 = await Issue.create({
        status: '2 = selected',
        deadline: new Date('2024-08-31T09:58:50.783Z'),
        description:
          'supplement the pagination-info bundle with URLs for "first" and "last"',
      });

      const issue2 = await Issue.create({
        status: '3 = in progress',
        deadline: new Date('2024-08-31T09:59:50.783Z'),
        description:
          'enable the handler for GET requests' +
          ' to select only certain fields, to sort, and to paginate',
      });

      // Act. (Request a sorting in descending order.)
      const response1 = await request(app)
        .get('/api/v1/issues?sort=-status')
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response1.status).toEqual(200);

      const expectedResources1 = [
        {
          __v: expect.anything(),
          _id: issue2._id.toString(),
          createdAt: expect.anything(),
          status: '3 = in progress',
          deadline: '2024-08-31T09:59:50.783Z',
          parentId: null,
          description:
            'enable the handler for GET requests' +
            ' to select only certain fields, to sort, and to paginate',
        },
        {
          __v: expect.anything(),
          _id: issue1._id.toString(),
          createdAt: expect.anything(),
          status: '2 = selected',
          deadline: '2024-08-31T09:58:50.783Z',
          parentId: null,
          description:
            'supplement the pagination-info bundle with URLs for "first" and "last"',
        },
      ];
      expect(response1.body).toEqual({
        meta: {
          total: 2,
          first: '/api/v1/issues?sort=-status&perPage=100&page=1',
          prev: null,
          curr: '/api/v1/issues?sort=-status&perPage=100&page=1',
          next: null,
          last: '/api/v1/issues?sort=-status&perPage=100&page=1',
        },
        resources: expectedResources1,
      });

      // Act. (Request a sorting in ascending order.)
      const response2 = await request(app)
        .get('/api/v1/issues?sort=status')
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response2.status).toEqual(200);

      const expectedResources2 = expectedResources1.reverse();
      expect(response2.body).toEqual({
        meta: {
          total: 2,
          first: '/api/v1/issues?sort=status&perPage=100&page=1',
          prev: null,
          curr: '/api/v1/issues?sort=status&perPage=100&page=1',
          next: null,
          last: '/api/v1/issues?sort=status&perPage=100&page=1',
        },
        resources: expectedResources2,
      });
    }
  );

  test(
    'if there are multiple pages of Issue resources,' +
      ' should return 200 and a correct pagination-info bundle',
    async () => {
      // Arrange.
      const indices = Array.from({ length: 5 }, (value, idx) => idx);

      for (const idx of indices) {
        await Issue.create({
          status: '1 = backlog',
          deadline: new Date(`2024-09-0${idx + 1}T16:41:47.722Z`),
          description: `carry out step ${idx + 1}`,
        });
      }

      // Act.
      const response = await request(app)
        .get('/api/v1/issues?perPage=1&page=3')
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response.status).toEqual(200);

      expect(response.body).toEqual({
        meta: {
          total: 5,
          first: '/api/v1/issues?perPage=1&page=1',
          prev: '/api/v1/issues?perPage=1&page=2',
          curr: '/api/v1/issues?perPage=1&page=3',
          next: '/api/v1/issues?perPage=1&page=4',
          last: '/api/v1/issues?perPage=1&page=5',
        },
        resources: [
          {
            __v: expect.anything(),
            _id: expect.anything(),
            createdAt: expect.anything(),
            status: '1 = backlog',
            deadline: '2024-09-03T16:41:47.722Z',
            parentId: null,
            description: 'carry out step 3',
          },
        ],
      });
    }
  );
});

describe('GET /api/v1/issues/:id', () => {
  let accessToken;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/tokens')
      .set('Authorization', 'Basic ' + btoa('test-username:test-password'));

    accessToken = response.body.accessToken;
  });

  test('if an invalid ID is provided, should return 400', async () => {
    // Act.
    const response = await request(app)
      .get('/api/v1/issues/17')
      .set('Authorization', 'Bearer ' + accessToken);

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
      description: 'ease of development',
    });

    // Act.
    const response = await request(app)
      .get(`/api/v1/issues/${issue._id}`)
      .set('Authorization', 'Bearer ' + accessToken);

    // Assert.
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      __v: expect.anything(),
      _id: issue.id,
      createdAt: issue.createdAt.toISOString(),
      status: '1 = backlog',
      deadline: deadline.toISOString(),
      parentId: null,
      description: 'ease of development',
    });
  });
});

describe('PUT /api/v1/issues/:id', () => {
  let accessToken;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/tokens')
      .set('Authorization', 'Basic ' + btoa('test-username:test-password'));

    accessToken = response.body.accessToken;
  });

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
    const response = await request(app)
      .put(`/api/v1/issues/${invalidId}`)
      .set('Authorization', 'Bearer ' + accessToken);

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

    const nonexistentId = corruptIdOfMongooseObject(issue);

    // Act.
    const response = await request(app)
      .put(`/api/v1/issues/${nonexistentId}`)
      .set('Authorization', 'Bearer ' + accessToken);

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
    const response = await request(app)
      .put(`/api/v1/issues/${issueId}`)
      .send({
        status: '2 = selected',
        description: 'generate code coverage reports in HTML format',
      })
      .set('Authorization', 'Bearer ' + accessToken);

    // Assert.
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      __v: expect.anything(),
      _id: issueId,
      createdAt: expect.anything(),
      status: '2 = selected',
      deadline: '2024-08-20T20:38:18.162Z',
      parentId: null,
      description: 'generate code coverage reports in HTML format',
    });
  });
});

describe('DELETE /api/v1/issues/:id', () => {
  let accessToken;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/v1/tokens')
      .set('Authorization', 'Basic ' + btoa('test-username:test-password'));

    accessToken = response.body.accessToken;
  });

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
    response = await request(app)
      .delete(`/api/v1/issues/${invalidId}`)
      .set('Authorization', 'Bearer ' + accessToken);

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

    const nonexistentId = corruptIdOfMongooseObject(issue);

    // Act.
    const response = await request(app)
      .delete(`/api/v1/issues/${nonexistentId}`)
      .set('Authorization', 'Bearer ' + accessToken);

    // Assert.
    expect(response.status).toEqual(404);
    expect(response.body).toEqual({
      message: 'Resource not found',
    });
  });

  test(
    'if a valid ID is provided' +
      ' but there exist issues whose `parentId` equals the provided one,' +
      ' should return 400',
    async () => {
      // Arrange.
      const issueEpic1 = await Issue.create(JSON_4_ISSUE_EPIC_1);

      const issueEpic1Id = issueEpic1._id.toString();

      const issue1 = await Issue.create({
        status: '1 = backlog',
        deadline: new Date('2024-08-31T21:43:31.696Z'),
        description: 'containerize the backend',
        parentId: issueEpic1Id,
      });
      const issue2 = await Issue.create({
        status: '1 = backlog',
        deadline: new Date('2024-08-31T23:43:31.696Z'),
        description: 'convert the "epic" field to a "parentId" field',
        parentId: issueEpic1Id,
      });

      // Act.
      const response = await request(app)
        .delete(`/api/v1/issues/${issueEpic1Id}`)
        .set('Authorization', 'Bearer ' + accessToken);

      // Assert.
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        message:
          'Cannot delete the targeted issue,' +
          ` because there exist 2 other issues` +
          ' whose `parentId` points to the targeted issue',
      });

      const issueEpic1StillExists = await Issue.findById(issueEpic1Id);
      expect(issueEpic1StillExists.toJSON()).toEqual(issueEpic1.toJSON());
    }
  );

  test('if a valid ID is provided, should return 204', async () => {
    // Arrange.
    const issue = await Issue.create({
      status: '1 = backlog',
      deadline: new Date('2024-08-22T20:40:41.277Z'),
      description: 'generate code coverage reports in HTML format',
    });

    const issueId = issue._id.toString();

    // Act.
    const response = await request(app)
      .delete(`/api/v1/issues/${issueId}`)
      .set('Authorization', 'Bearer ' + accessToken);

    // Assert.
    expect(response.status).toEqual(204);
    expect(response.headers['content-length']).toEqual('0');
    expect(response.body).toEqual({});
  });
});
