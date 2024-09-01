const express = require('express');
const morgan = require('morgan');
const Issue = require('./models');
const { determinePaginationInfoInitial } = require('./utilities');

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

  // Apply filtering criteria.
  query = Issue.find(queryJSON);

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
