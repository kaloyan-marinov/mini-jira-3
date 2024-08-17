# Introduction

This is a backend application,
which is a pared-down version of [Jira](
  https://www.atlassian.com/software/jira
).

# How to set up the project locally

[step 1]

install the package dependencies
by issuing the following command:

```bash
npm install
```

[step 2]

run automated tests

- to run all of the project's suite of automated tests <u>in regular mode</u>,
  issue the following command:

   ```bash
   npm run test
   ```

- to run a specific automated test <u>in debug mode</u>,
  which allows you to set breakpoints
  (not only in the test itself but also and the application code exercised by the test),
  take the following steps:
   1. open the project in VS Code
   2. click on the "View" menu item
   3. click on "Command Palette..."
   4. type "Jest: Run All Tests" and hit [Enter]
   5. click on "Testing" in VS Code's left-hand sidebar -
      that will display a Graphical User Interface (GUI)
      with all automated tests
   6. from that GUI,
      you can run any specific automated test of your choice <u>in debug mode</u>.

- to run the project's suite of automated tests in watch mode,
  issue the following command:

   ```bash
   npm run test -- \
      --watchAll
   ```

[step 3]

- create an empty database:

   ```bash
   docker run \
      --name container-m-j-3-mongo \
      --add-host host.docker.internal:host-gateway \
      --mount source=volume-m-j-3-mongo,destination=/data/db \
      --env MONGO_INITDB_ROOT_USERNAME=mongoadmin \
	   --env MONGO_INITDB_ROOT_PASSWORD=secret \
      --env MONGO_INITDB_DATABASE=db-mini-jira-3 \
      --publish 27017:27017 \
      mongo:latest
   ```

   `--env MONGO_INITDB_DATABASE=<...>`

   `--env-file backend/.env \`

[step 4]

start a process responsible for serving the application instance

- to do that <u>in regular mode</u>,
  launch a terminal window and, in it, execute `npm run dev`

- to do that <u>in debug mode</u>,
  use VS Code by taking the following steps:
   1. by clicking on "Run and Debug" in VS Code's left-hand sidebar,
   2. selecting the launch configuration called "Backend app", and
   3. clicking "the Play button"

> One benefit of the 2nd option is that
> it serves the application in debug mode
> (i.e. it allows you to set breakpoints).

[step 5]

if you have performed the preceding step successfully,
then you can go on to
launch another terminal window and,
in it, issue the following requests to the HTTP server:

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
