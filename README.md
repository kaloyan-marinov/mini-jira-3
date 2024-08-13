# Introduction

This is a backend application,
which is a pared-down version of [Jira](
  https://www.atlassian.com/software/jira
).

# How to set up the project locally

launch a terminal window and,
in it, start a process responsible for serving the application instance
by issuing the following command:

```bash
npm run dev
```

launch another terminal window and,
in it, issue an HTTP request to the server:

```bash
curl -v \
  localhost:5000/api/v1/issues \
  | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "resources" : [
      {
         "createdAt" : null,
         "deadline" : null,
         "description" : "build a backend application using Express (without a persistence layer)",
         "epic" : "backend",
         "finishedAt" : null,
         "id" : 1,
         "status" : "3 = in progress"
      },
      {
         "createdAt" : null,
         "deadline" : null,
         "description" : "make it possible to use VS Code to serve the backend",
         "epic" : "ease of development",
         "finishedAt" : null,
         "id" : 2,
         "status" : "1 = in backlog"
      },
      {
         "createdAt" : null,
         "deadline" : null,
         "description" : "implement a persistence layer using MongoDB",
         "epic" : "backend",
         "finishedAt" : null,
         "id" : 3,
         "status" : "1 = in backlog"
      }
   ]
}



curl -v \
  -X POST \
  -d \
    '{ \
         "status": "1 = in backlog",
         "epic": "ease of development",
         "description": "make it possible to use VS Code to serve the backend",
    }' \
  localhost:5000/api/v1/issues \
  | json_pp

# ...
< HTTP/1.1 501 Not Implemented
# ...
{
   "message" : "This endpoint exists but is not ready for use."
}
```
