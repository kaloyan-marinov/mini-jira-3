const express = require('express');

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

app.post('/api/v1/issues', (req, res) => {
  // You are encouraged to take at a look at
  // what gets output in the terminal!
  // To do so, issue the 2nd HTTP request from `README.md`.
  console.log(req.body);

  res.status(501).json({
    message: 'This endpoint exists but is not ready for use.',
  });
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
