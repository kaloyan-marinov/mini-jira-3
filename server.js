const express = require('express');
const morgan = require('morgan');

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
    status: '1 = in backlog',
    deadline: null,
    finishedAt: null,
    epic: 'ease of development',
    description: 'make it possible to use VS Code to serve the backend',
  },
  {
    id: 3,
    createdAt: null,
    status: '1 = in backlog',
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

app.post('/api/v1/issues', (req, res, next) => {
  const { status, epic, description } = req.body;

  if (!status || !epic || !description) {
    res.status(400).json({
      message:
        "At least one of 'status', 'epic', 'description' is missing from" +
        " the HTTP request's body",
    });

    return;
  }

  const existingIds = issues.map((issuer) => issuer.id);
  const newId = Math.max(...existingIds) + 1;
  const newIssue = {
    id: newId,
    createdAt: null,
    status,
    deadline: null,
    finishedAt: null,
    epic,
    description,
  };
  issues.push(newIssue);

  res.status(201).json(newIssue);
});

app.get('/api/v1/issues', (req, res) => {
  res.status(200).json({
    resources: issues,
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
