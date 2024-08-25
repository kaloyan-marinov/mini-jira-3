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

app.put('/api/v1/issues/:id', (req, res) => {
  // Check if an existing issue is targeted.
  const issueId = parseInt(req.params.id);

  const issueIndex = issues.findIndex((i) => i.id === issueId);
  // console.log(issueIndex);

  if (issueIndex === -1) {
    res.status(404).json({
      message: 'Resource not found',
    });

    return;
  }

  // Check if there is something relevant in the body of the incoming request.
  const { status, epic, description } = req.body;

  if (!status && !epic && !description) {
    res.status(400).json({
      message:
        "At least one of 'status', 'epic', 'description' is missing from" +
        " the HTTP request's body",
    });

    return;
  }

  // Update the targeted issue.
  if (status) {
    issues[issueIndex].status = status;
  }
  if (epic) {
    issues[issueIndex].epic = epic;
  }
  if (description) {
    issues[issueIndex].description = description;
  }

  res.status(200).json(issues[issueIndex]);
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
