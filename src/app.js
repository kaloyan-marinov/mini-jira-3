const express = require('express');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { User, RevokedToken, Issue } = require('./models');
const { determinePaginationInfoInitial } = require('./utilities');

const app = express();

// This middleware function enables the backend application
// to "understand" when an incoming HTTP request's body contains a JSON payload.
app.use(express.json());

// This middleware function enables logging of incoming HTTP requests.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.post('/api/v1/users', async (req, res) => {
  let newUser;
  try {
    newUser = await User.create(req.body);
  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: 'Unable to create a new user.',
    });

    return;
  }

  const newUserJSON = newUser.toJSON();
  delete newUserJSON['password'];
  res
    .status(201)
    .set('Location', `/api/v1/users/${newUser._id.toString()}`)
    .json(newUserJSON);
});

app.get('/api/v1/users/:id', async (req, res) => {
  let user;

  try {
    user = await User.findOne({
      _id: req.params.id,
    }).select('-email');
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Failed to process your HTTP request',
    });

    return;
  }

  res.status(200).json(user);
});

const basicAuth = async (req, res, next) => {
  const headerAuth = req.headers.authorization;
  if (!headerAuth) {
    res.status(400).json({
      message: 'Missing "Authorization" header',
    });

    return;
  }

  const [type, authCredsEncoded] = headerAuth.split(' ');
  if (type !== 'Basic') {
    res.status(400).json({
      message: '"Authorization" header must specify Basic Auth',
    });

    return;
  }

  const authCredsDecoded = Buffer.from(authCredsEncoded, 'base64').toString();
  const [username, password] = authCredsDecoded.split(':');
  let user;
  try {
    user = await User.findOne({
      username,
    }).select('+password');
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Failed to process your HTTP request',
    });

    return;
  }
  if (password !== user.password) {
    res.status(401).json({
      message: 'Incorrect credentials',
    });

    return;
  }

  req.userId = user.id;

  next();
};

app.put('/api/v1/users/:id', basicAuth, async (req, res) => {
  const userId = req.params.id;

  if (req.userId !== userId) {
    res.status(403).json({
      message:
        'You are authenticated as one User but are targeting another one',
    });

    return;
  }

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    res.status(400).json({
      message: 'Invalid ID provided',
    });

    return;
  }

  if (!user) {
    res.status(404).json({
      message: 'Resource not found',
    });

    return;
  }

  user = await User.findByIdAndUpdate(userId, req.body, {
    new: true, // Causes the response to contain the updated JSON document.
    runValidators: true,
  });
  res.status(200).json(user);
});

app.post('/api/v1/tokens', basicAuth, async (req, res) => {
  // TODO: (2024/09/07, 17:10)
  //      arrange for creation of a 'refreshToken' that gets returned here as well
  console.log('req.userId = ', req.userId);
  const payload = {
    userId: req.userId,
  };
  const options = {
    expiresIn: process.env.BACKEND_JWT_EXPIRES_IN,
  };
  const accessToken = jwt.sign(
    payload,
    process.env.BACKEND_SECRET_KEY,
    options
  );
  res.status(200).json({
    accessToken,
  });
});

const tokenAuth = async (req, res, next) => {
  // Inspect the "Authorization" header for an access token.
  const headerAuth = req.headers.authorization;
  if (!headerAuth) {
    res.status(400).json({
      message: 'Missing "Authorization" header',
    });

    return;
  }

  const [type, accessToken] = headerAuth.split(' ');
  if (type !== 'Bearer') {
    res.status(400).json({
      message: '"Authorization" header must specify Bearer Auth',
    });

    return;
  }

  // Check whether the access token was revoked
  // prior to the current request-response cycle.
  let wasRevoked;
  try {
    const revokedToken = await RevokedToken.findOne({
      accessToken,
    });
    wasRevoked = revokedToken === null ? false : true;
  } catch (err) {
    res.status(500).json({
      message: 'Failed to process your HTTP request',
    });

    return;
  }
  if (wasRevoked) {
    res.status(401).json({
      message: 'Revoked access token',
    });

    return;
  }

  // Verify the access token.
  let jwtPayload;
  try {
    jwtPayload = jwt.verify(accessToken, process.env.BACKEND_SECRET_KEY);
  } catch (err) {
    res.status(401).json({
      message: 'Invalid access token',
    });

    return;
  }

  // Make the following information available to all downstream middleware functions,
  // which will be executed as part of the current request-response cycle.
  req.userId = jwtPayload.userId;
  req.accessToken = accessToken;

  next();
};

app.delete('/api/v1/tokens', tokenAuth, async (req, res) => {
  try {
    let revokedToken = await RevokedToken.create({
      userId: req.userId,
      accessToken: req.accessToken,
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: 'Unable to revoke the access token',
    });
    return;
  }

  res.set('Content-Length', '0');
  res.status(204).end();
});

app.post('/api/v1/issues', tokenAuth, async (req, res) => {
  //console.log('req.userId = ', req.userId);
  //console.log('typeof req.userId = ', typeof req.userId);

  let newIssue;

  if (req.body.parentId) {
    let parentIssue;

    try {
      parentIssue = await Issue.findById(req.body.parentId);
    } catch (err) {
      console.error(err);

      res.status(400).json({
        message: 'The value provided for "parentId" is invalid',
      });

      return;
    }

    if (!parentIssue) {
      res.status(400).json({
        message: 'The value provided for `parentId` is non-existent',
      });

      return;
    }
  }

  try {
    newIssue = await Issue.create({
      userId: req.userId,
      ...req.body,
    });
  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: 'Unable to create a new issue.',
    });

    return;
  }

  res
    .status(201)
    .set('Location', `/api/v1/issues/${newIssue._id.toString()}`)
    .json(newIssue);
});

app.get('/api/v1/issues', tokenAuth, async (req, res) => {
  let query;

  // Exclude all query parameters,
  // which do not get passed directly into the query
  // but require to be processed separately.
  const reqQuery = {
    ...req.query,
  };

  const excludedParam2Value = {};
  const fieldsToExcludeFromReqQuery = ['select', 'sort', 'perPage', 'page'];
  for (const f of fieldsToExcludeFromReqQuery) {
    if (reqQuery[f]) {
      excludedParam2Value[f] = reqQuery[f];
    }

    delete reqQuery[f];
  }

  // Allow for the `parentId` query parameter to be set to «a void value».
  const nullValuesForParentId = new Set(['', 'null']);
  if (
    reqQuery.hasOwnProperty('parentId') &&
    nullValuesForParentId.has(reqQuery['parentId'])
  ) {
    reqQuery['parentId'] = null;
  }

  const queryRawStr = JSON.stringify(reqQuery);

  // Create the following Mongoose operators: `$in`, `$lt`, `$lte`, `$gt`, `$gte` .
  const queryStr = queryRawStr.replace(
    /\b(in|lt|lte|gt|gte)\b/g,
    (match) => `$${match}`
  );
  //console.log('queryStr', queryStr);
  const queryJSON = JSON.parse(queryStr);
  //console.log('queryJSON', queryJSON);

  // Apply filtering criteria.
  query = Issue.find({
    userId: req.userId,
    ...queryJSON,
  });

  // Create an empty pagination-info bundle
  // which, in a step-by-step fashion, will be supplemented with information
  // about how to paginate beyond the returned resources.
  // (The completed bundle will be sent in the body of the HTTP response.)
  let paginationInfoFinal = {};

  //  - Supplement the pagination-info bundle with the number of all resources,
  //    which match the filtering criteria.
  try {
    const queryClone = query.clone();
    const total = await queryClone.countDocuments();
    paginationInfoFinal.total = total;
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Failed to process your HTTP request',
    });

    return;
  }

  if (paginationInfoFinal.total === 0) {
    paginationInfoFinal = {
      total: 0,
      first: '/api/v1/issues?page=1',
      prev: null,
      curr: '/api/v1/issues',
      next: null,
      last: '/api/v1/issues?page=1',
    };

    res.status(200).json({
      meta: paginationInfoFinal,
      resources: [],
    });

    return;
  }

  //  - Supplement the pagination-info bundle with the indices of
  //    the first, previous, current, next, and last pages.
  const { perPage, pageFirst, pagePrev, pageCurr, pageNext, pageLast } =
    determinePaginationInfoInitial(
      req.query.perPage,
      req.query.page,
      paginationInfoFinal.total
    );

  const queryParams = new URLSearchParams({
    ...reqQuery,
    ...excludedParam2Value,
  });
  queryParams.set('perPage', perPage);

  queryParams.set('page', pageFirst);
  paginationInfoFinal.first = `/api/v1/issues` + `?` + queryParams.toString();

  if (pagePrev) {
    queryParams.set('page', pagePrev);
    paginationInfoFinal.prev = `/api/v1/issues` + `?` + queryParams.toString();
  } else {
    paginationInfoFinal.prev = null;
  }

  queryParams.set('page', pageCurr);
  paginationInfoFinal.curr = `/api/v1/issues` + `?` + queryParams.toString();

  if (pageNext) {
    queryParams.set('page', pageNext);
    paginationInfoFinal.next = `/api/v1/issues` + `?` + queryParams.toString();
  } else {
    paginationInfoFinal.next = null;
  }

  queryParams.set('page', pageLast);
  paginationInfoFinal.last = `/api/v1/issues` + `?` + queryParams.toString();

  // Make the query return only the fields
  // specified by the value of the `select` query parameter.
  if (req.query.select) {
    const fields = req.query.select.split(',');
    query = query.select(fields);
  }

  // Apply sorting.
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  }

  // Apply pagination.
  const startIndex = (pageCurr - 1) * perPage;
  query = query.skip(startIndex).limit(perPage);
  try {
    const issues = await query;

    res.status(200).json({
      meta: paginationInfoFinal,
      resources: issues,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Failed to process your HTTP request',
    });
  }
});

app.get('/api/v1/issues/:id', tokenAuth, async (req, res) => {
  let issue;
  const issueId = req.params.id;
  try {
    issue = await Issue.findById(issueId);
  } catch (err) {
    res.status(400).json({
      message: 'Invalid ID provided',
    });

    return;
  }

  if (!issue) {
    res.status(404).json({
      message: 'Resource not found',
    });

    return;
  }

  if (issue.userId.toString() !== req.userId) {
    res.status(403).json({
      message:
        'The targeted resource does not belong to the authenticated User',
    });

    return;
  }

  res.status(200).json(issue);
});

app.put('/api/v1/issues/:id', tokenAuth, async (req, res) => {
  let issue;
  const issueId = req.params.id;
  try {
    issue = await Issue.findById(issueId);
  } catch (err) {
    res.status(400).json({
      message: 'Invalid ID provided',
    });

    return;
  }

  if (!issue) {
    res.status(404).json({
      message: 'Resource not found',
    });

    return;
  }

  if (issue.userId.toString() !== req.userId) {
    res.status(403).json({
      message:
        'The targeted resource does not belong to the authenticated User',
    });

    return;
  }

  issue = await Issue.findByIdAndUpdate(issueId, req.body, {
    new: true, // Causes the response to contain the updated JSON document.
    runValidators: true,
  });
  res.status(200).json(issue);
});

app.delete('/api/v1/issues/:id', tokenAuth, async (req, res) => {
  let issue;
  const issueId = req.params.id;
  try {
    issue = await Issue.findById(issueId);
  } catch (err) {
    res.status(400).json({
      message: 'Invalid ID provided',
    });

    return;
  }

  let countChildren;
  try {
    countChildren = await Issue.find({
      parentId: issueId,
    }).countDocuments();
  } catch (err) {
    res.status(500).json({
      message: 'Failed to process your HTTP request',
    });

    return;
  }
  if (countChildren > 0) {
    res.status(400).json({
      message:
        'Cannot delete the targeted issue,' +
        ` because there exist ${countChildren} other issues` +
        ' whose `parentId` points to the targeted issue',
    });
    return;
  }

  if (!issue) {
    res.status(404).json({
      message: 'Resource not found',
    });

    return;
  }

  if (issue.userId.toString() !== req.userId) {
    res.status(403).json({
      message:
        'The targeted resource does not belong to the authenticated User',
    });

    return;
  }

  await issue.deleteOne();
  res.set('Content-Length', '0');
  res.status(204).end();
});

module.exports = app;
