const express = require('express');
const morgan = require('morgan');
const Issue = require('./models');

const issues = [
  {
    id: 1,
    createdAt: null,
    status: '3 = in progress',
    deadline: null,
    finishedAt: null,
    epic: 'backend',
    description:
      'build a backend application using Express (without a persistence layer)',
  },
  {
    id: 2,
    createdAt: null,
    status: '1 = backlog',
    deadline: null,
    finishedAt: null,
    epic: 'ease of development',
    description: 'make it possible to use VS Code to serve the backend',
  },
  {
    id: 3,
    createdAt: null,
    status: '1 = backlog',
    deadline: null,
    finishedAt: null,
    epic: 'backend',
    description: 'implement a persistence layer using MongoDB',
  },
];

const app = express();

// This middleware function enables the backend application
// to "understand" when an incoming HTTP request's body contains a JSON payload.
app.use(express.json());

// This middleware function enables logging of incoming HTTP requests.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.post('/api/v1/issues', async (req, res, next) => {
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
    const issues = await Issue.find();

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
  const issueId = req.params.id;
  try {
    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({
        message: 'Resource not found',
      });
    }

    res.status(200).json(issue);
  } catch (err) {
    res.status(400).json({
      message: 'Invalid ID provided',
    });
  }
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
  // TODO: (2024/08/20, 22:03)
  //       the preceding `try`/`except` differs from the one in `app.get` -
  //       look into rendering them consistent with each other

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

app.delete('/api/v1/issues/:id', (req, res) => {
  // Check if an existing issue is targeted.
  const issueId = parseInt(req.params.id);

  const issueIndex = issues.findIndex((i) => i.id === issueId);

  if (issueIndex === -1) {
    res.status(404).json({
      message: 'Resource not found',
    });

    return;
  }

  issues.splice(issueIndex, 1);

  res.status(204).json({});
});

module.exports = app;
