const express = require('express');
const morgan = require('morgan');
const Issue = require('./models');

const app = express();

// This middleware function enables the backend application
// to "understand" when an incoming HTTP request's body contains a JSON payload.
app.use(express.json());

// This middleware function enables logging of incoming HTTP requests.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.post('/api/v1/issues', async (req, res) => {
  let newIssue;

  try {
    newIssue = await Issue.create(req.body);
  } catch (err) {
    console.error(err);

    res.status(400).json({
      message: 'Unable to create a new issue.',
    });

    return;
  }

  res.status(201).json(newIssue);
});

app.get('/api/v1/issues', async (req, res) => {
  let query;

  // Exclude all query parameters,
  // which do not get passed directly into the query
  // but require to be processed separately.
  const reqQuery = {
    ...req.query,
  };

  const excludedParam2Value = {};
  const fieldsToExcludeFromReqQuery = ['select', 'sort', 'perPage', 'page'];
  for (f of fieldsToExcludeFromReqQuery) {
    if (reqQuery[f]) {
      excludedParam2Value[f] = reqQuery[f];
    }

    delete reqQuery[f];
  }
  console.log('reqQuery', reqQuery);
  const queryRawStr = JSON.stringify(reqQuery);
  console.log('queryRawStr', queryRawStr);

  // Create the following Mongoose operators: `$in`, `$lt`, `$lte`, `$gt`, `$gte` .
  const queryStr = queryRawStr.replace(
    /\b(in|lt|lte|gt|gte)\b/g,
    (match) => `$${match}`
  );
  console.log('queryStr', queryStr);
  const queryJSON = JSON.parse(queryStr);
  console.log('queryJSON', queryJSON);

  // Initialize the query.
  query = Issue.find(queryJSON);

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
  // console.log('req.query.perPage', req.query.perPage);
  let perPage = parseInt(req.query.perPage) || 100;
  // console.log('perPage', perPage);
  perPage = Math.min(perPage, 100);
  let page = parseInt(req.query.page) || 1;
  page = Math.max(page, 1);
  // console.log('perPage', perPage);
  // console.log('page', page);
  const startIndex = (page - 1) * perPage;
  const finalIndex = page * perPage;
  // console.log('startIndex', startIndex);
  query = query.skip(startIndex).limit(perPage);

  try {
    const issues = await query;

    // Put together an «information bundle»,
    // which indicates how to paginate beyond the returned `issues`.
    // (That information bundle,
    // which will be sent in the body of the HTTP response.)
    const meta = {};

    const total = await Issue.countDocuments();
    meta.total = total;

    const queryParams = new URLSearchParams({
      ...reqQuery,
      ...excludedParam2Value,
    });
    queryParams.set('perPage', perPage);
    queryParams.set('page', page);
    meta.curr = `/api/v1/issues` + `?` + queryParams.toString();

    if (finalIndex < total) {
      queryParams.set('page', page + 1);
      meta.next = `/api/v1/issues` + `?` + queryParams.toString();
    } else {
      meta.next = null;
    }

    if (startIndex > 0 && issues.length > 0) {
      queryParams.set('page', page - 1);
      meta.prev = `/api/v1/issues` + `?` + queryParams.toString();
    } else {
      meta.prev = null;
    }

    res.status(200).json({
      meta,
      resources: issues,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Failed to process your HTTP request',
    });
  }
});

app.get('/api/v1/issues/:id', async (req, res) => {
  let issue;
  const issueId = req.params.id;
  try {
    issue = await Issue.findById(issueId);
  } catch (err) {
    return res.status(400).json({
      message: 'Invalid ID provided',
    });
  }

  if (!issue) {
    return res.status(404).json({
      message: 'Resource not found',
    });
  }

  res.status(200).json(issue);
});

app.put('/api/v1/issues/:id', async (req, res) => {
  let issue;
  const issueId = req.params.id;
  try {
    issue = await Issue.findById(issueId);
  } catch (err) {
    return res.status(400).json({
      message: 'Invalid ID provided',
    });
  }

  if (!issue) {
    return res.status(404).json({
      message: 'Resource not found',
    });
  }

  issue = await Issue.findByIdAndUpdate(issueId, req.body, {
    new: true, // Causes the response to contain the updated JSON document.
    runValidators: true,
  });
  res.status(200).json(issue);
});

app.delete('/api/v1/issues/:id', async (req, res) => {
  let issue;
  const issueId = req.params.id;
  try {
    issue = await Issue.findById(issueId);
  } catch (err) {
    return res.status(400).json({
      message: 'Invalid ID provided',
    });
  }

  if (!issue) {
    return res.status(404).json({
      message: 'Resource not found',
    });
  }

  await issue.deleteOne();
  res.set('Content-Length', '0');
  res.status(204).end();
});

module.exports = app;
