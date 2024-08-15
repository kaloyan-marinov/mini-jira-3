# Introduction

This is a backend application,
which is a pared-down version of [Jira](
  https://www.atlassian.com/software/jira
).

# How to set up the project locally

install the package dependencies
by issuing the following command:

```bash
npm install
```

run the project's suite of automated tests
by issuing the following command:

```bash
npm run test
```

> To run a specific automated test in debug mode,
> which allows you to set breakpoints
> (not only in the test itself but also and the application code exercised by the test),
> open the project in VS Code,
> click on the "View" menu item,
> click on "Command Palette...",
> type "Jest: Run All Tests" and hit [Enter].
> Click on "Testing" in VS Code's left-hand sidebar -
> that will display a Graphical User Interface (GUI)
> with all automated tests;
> from that GUI, you can run any specific automated test of your choice in debug mode.

to run the project's suite of automated tests in watch mode,
issue the following command:

```bash
npm run test -- \
   --watchAll
```



to start a process responsible for serving the application instance,
you can
-  <u>either</u>
   launch a terminal window and, in it, execute `npm run dev`,
-  <u>or</u>
   use VS Code (
      by clicking on "Run and Debug" in VS Code's left-hand sidebar,
      selecting the launch configuration called "Backend app",
      and then clicking the Play button
   )
> One benefit of the 2nd option is that
> it serves the application in debug mode
> (i.e. it allows you to set breakpoints).


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
```



```bash
curl -v \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{
         \"status\": \"1 = in backlog\"
    }" \
  localhost:5000/api/v1/issues \
  | json_pp

# ...
< HTTP/1.1 400 Bad Request
# ...
{
   "message" : "Each of 'status', 'description' must be specified in the HTTP request's body"
}
```

```bash
curl -v \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{
         \"status\": \"1 = in backlog\",
         \"epic\": \"backend\",
         \"description\": \"containerize the backend\"
    }" \
  localhost:5000/api/v1/issues \
  | json_pp

# ...
< HTTP/1.1 201 Created
# ...
{
   "createdAt" : null,
   "deadline" : null,
   "description" : "containerize the backend",
   "epic" : "backend",
   "finishedAt" : null,
   "id" : 4,
   "status" : "1 = in backlog"
}
```

```bash
curl -v \
  localhost:5000/api/v1/issues/17 \
  | json_pp

# ...
< HTTP/1.1 404 Not Found
# ...
{
   "message" : "Resource not found"
}



curl -v \
  localhost:5000/api/v1/issues/1 \
  | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "createdAt" : null,
   "deadline" : null,
   "description" : "build a backend application using Express (without a persistence layer)",
   "epic" : "backend",
   "finishedAt" : null,
   "id" : 1,
   "status" : "3 = in progress"
}
```


```bash
curl -v \
  -X PUT \
  localhost:5000/api/v1/issues/17 \
  | json_pp

# ...
< HTTP/1.1 404 Not Found
# ...
{
   "message" : "Resource not found"
}
```

```bash
curl -v \
  -X PUT \
  localhost:5000/api/v1/issues/1 \
  | json_pp

# ...
< HTTP/1.1 400 Bad Request
# ...
{
   "message" : "At least one of 'status', 'epic', 'description' is missing from the HTTP request's body"
}
```

```bash
curl -v \
  -X PUT \
  -H "Content-Type: application/json" \
  -d "{
         \"status\": \"4 = done\"
    }" \
  localhost:5000/api/v1/issues/1 \
  | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "createdAt" : null,
   "deadline" : null,
   "description" : "build a backend application using Express (without a persistence layer)",
   "epic" : "backend",
   "finishedAt" : null,
   "id" : 1,
   "status" : "4 = done"
}
```

```bash
curl -v \
  -X DELETE \
  localhost:5000/api/v1/issues/17 \
  | json_pp

# ...
< HTTP/1.1 404 Not Found
# ...
{
   "message" : "Resource not found"
}
```

```bash
curl -v \
  -X DELETE \
  localhost:5000/api/v1/issues/1

# ...
< HTTP/1.1 204 No Content
# ...
# The body of the HTTP response is empty.
```
