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
  try {
    const issues = await Issue.find(req.query);

    res.status(200).json({
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
