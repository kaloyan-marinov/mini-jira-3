# Introduction

This is a backend application,
which is a pared-down version of [Jira](
  https://www.atlassian.com/software/jira
).

# How to set up the project locally

[step 1]

create `.env` file within your local repository by taking the following steps:

   ```bash
   $ cp \
      .env.template \
      .env

   # Edit the content of the created file as per the comments/instructions therein.
   ```

[step 2]

install the package dependencies
by issuing the following command:

```bash
npm install
```

[step 3]

run automated tests

> <u>This note is important only if your operating system is Fedora 40.</u>
>
> recall that:
>
>  - The `mongodb-memory-server` package is a Node.js library
>    used for testing MongoDB interactions
>    without requiring a running MongoDB instance.
>
>  - It typically downloads and runs a local, temporary MongoDB server
>    for the duration of your tests.
>
> at the time of writing (i.e. as of 2024/08/25):
>
>  - the `mongodb-memory-server` package specifically requires OpenSSL 1.1
>
>  - if you run the automated tests on a Fedora 40 operating system,
>    that will fail
>    (because Fedora 40 has a different version of OpenSSL installed)
>
>  - the preceding 2 bulletpoints are a «TLDR version» of [this comment](https://github.com/kaloyan-marinov/mini-jira-3/commit/989785eb272e72fb4bc7d44d70e761ac7a2812d9#commitcomment-145809410)
>
>  - if your operating system is Fedora 40,
>    it is possible to get the automated tests to pass
>    **_by influencing which OpenSSL version the MongoDB binary uses at runtime_**
>    **_(without altering/modifying the core libraries in the host system)_**:
>
>     - install [Miniconda](https://docs.anaconda.com/miniconda/miniconda-install/)
>
>     - create a Conda environment that contains OpenSSL 1.1:
>        ```bash
>        $ conda create \
>           --name=python-3-11-plus-openssl-1-1 \
>           --python=3.11 \
>           --openssl=1.1
>        ```
>
>     - verify that the preceding step worked as desired:
>        ```bash
>        $ conda activate python-3-11-plus-openssl-1-1
>
>        (python-3-11-plus-openssl-1-1) $ echo ${CONDA_PREFIX}
>        ~/miniconda3/envs/python-3-11-plus-openssl-1-1
>        (python-3-11-plus-openssl-1-1) $ which openssl
>        ~/miniconda3/envs/python-3-11-plus-openssl-1-1/bin/openssl
>        (python-3-11-plus-openssl-1-1) $ openssl version
>        OpenSSL 1.1.1w  11 Sep 2023
>
>        (python-3-11-plus-openssl-1-1) $ conda deactivate
>        ```
>
>     - ensure that each of the following bulletpoints is followed from within a terminal session,
>       which has an environment variable called `LD_LIBRARY_PATH`,
>       with that environment variable holding the value of `${CONDA_PREFIX}/lib` -
>       one way of ensuring that is to create a file called `jest.config.js`
>       and make it consist of the following single statement:
>
>       `process.env.LD_LIBRARY_PATH = '<the-value-of-${CONDA_PREFIX}/lib>';`;

- to run all of the project's suite of automated tests <u>in regular mode</u>,
  issue the following command:

   ```bash
   npm run test -- \
      --coverage \
      --collectCoverageFrom="./src/**"

   # The preceding command generates a file located at
   # `coverage/lcov-report/index.html`
   # which can be opened in a web browser.
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
      --coverage \
      --collectCoverageFrom="./src/**" \
      --watchAll

   # The preceding command generates a file located at
   # `coverage/lcov-report/index.html`
   # which can be opened in a web browser.
   ```

[step 4]

create an empty database:

- run a containerized MongoDB server

   ```bash
   docker run \
      --name container-m-j-3-mongo \
      --mount source=volume-m-j-3-mongo,destination=/data/db \
      --env MONGO_INITDB_ROOT_USERNAME=$(grep -oP '^MONGO_USERNAME=\K.*' .env) \
      --env MONGO_INITDB_ROOT_PASSWORD=$(grep -oP '^MONGO_PASSWORD=\K.*' .env) \
      --env MONGO_INITDB_DATABASE=$(grep -oP '^MONGO_DATABASE=\K.*' .env) \
      --publish 27017:27017 \
      mongo:latest
   ```

   <u>TODO: (2024/08/17, 11:00)</u> as of the commit that adds this line, the preceding command creates "a simple user with the role `root⁠` in the `admin` authentication database⁠" (cf. https://hub.docker.com/_/mongo ); investigate (a) what "creation scripts in /docker-entrypoint-initdb.d/*.js" (cf. ) would need to be created and (b) how the preceding commands would need to be changed _in order for_ a non-`root` user to be created (cf. https://www.mongodb.com/docs/manual/core/security-users/#user-authentication-database )

- optionally, connect to the MongoDB server
  by means of the `mongosh` command-line client

   ```bash
   docker container inspect container-m-j-3-mongo \
      | grep IPAddress
   ```

   ```bash
   export CONTAINER_M_J_3_MONGO_IP=<the-value-returned-by-the-preceding-command>
   ```

   ```bash
   docker run \
      -it \
      --rm \
      mongo:latest \
         mongosh \
         --host ${CONTAINER_M_J_3_MONGO_IP} \
         --username $(grep -oP '^MONGO_USERNAME=\K.*' .env) \
         --password $(grep -oP '^MONGO_PASSWORD=\K.*' .env) \
         --authenticationDatabase admin \
         $(grep -oP '^MONGO_DATABASE=\K.*' .env)
   ```

[step 5]

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

[step 6]

if you have performed the preceding step successfully,
then you can go on to
launch another terminal window and,
in it, issue the following requests to the HTTP server:



(leveraging the environment variables in your `.env` file,)
obtain an access token

```bash
curl -v \
   -X POST \
   localhost:5000/api/v1/tokens \
   | json_pp

# ...
< HTTP/1.1 400 Bad Request
# ...
{
   "message" : "Missing \"Authorization\" header"
}



curl -v \
   -X POST \
   -u "${BACKEND_USERNAME}:${BACKEND_PASSWORD}" \
   localhost:5000/api/v1/tokens \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "accessToken" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcyNTc5MTc0NywiZXhwIjoxNzI1NzkzMjQ3fQ.4Ts6B6PFXp9hemAdQKkh2_MhPUOp4Z-0SvJS-teZ3S4"
}



export ACCESS_TOKEN=<the-value-present-in-the-preceding-HTTP-response>>
```



create one `Issue`

```bash
curl -v \
   -X POST \
   -H "Content-Type: application/json" \
   -d "{
      \"status\": \"1 = backlog\"
   }" \
   localhost:5000/api/v1/issues \
   | json_pp

# ...
< HTTP/1.1 400 Bad Request
# ...
{
   "message" : "Missing \"Authorization\" header"
}
```

```bash
curl -v \
   -X POST \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   -H "Content-Type: application/json" \
   -d "{
      \"status\": \"1 = backlog\"
   }" \
   localhost:5000/api/v1/issues \
   | json_pp

# ...
< HTTP/1.1 400 Bad Request
# ...
{
   "message" : "Unable to create a new issue."
}
```

```bash
curl -v \
   -X POST \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   -H "Content-Type: application/json" \
   -d "{
      \"status\": \"3 = in progress\",
      \"deadline\": \"2024-09-08T21:08:36.367Z\",
      \"description\": \"backend\"
   }" \
   localhost:5000/api/v1/issues \
   | json_pp

# ...
< HTTP/1.1 201 Created
< Location: /api/v1/issues/66dc11fd1c3a2a743744172f
# ...
{
   "__v" : 0,
   "_id" : "66dd7e58e7c673746905ff27",
   "createdAt" : "2024-09-08T10:37:12.447Z",
   "deadline" : "2024-09-08T21:08:36.367Z",
   "description" : "backend",
   "parentId" : null,
   "status" : "3 = in progress"
}



export ISSUE_BACKEND_ID=<the-_id-present-in-the-preceding-HTTP-response>

export VALID_BUT_NONEXISTENT_ISSUE_ID=<same-as-ISSUE_BACKEND_ID-but-with-the-last-character-changed-to-another-hexadecimal-digit>



curl -v \
   -X POST \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   -H "Content-Type: application/json" \
   -d "{
      \"status\": \"1 = backlog\",
      \"deadline\": \"2024-09-15T21:08:36.367Z\",
      \"description\": \"frontend\"
   }" \
   localhost:5000/api/v1/issues \
   | json_pp

# ...
< HTTP/1.1 201 Created
# ...



export ISSUE_FRONTEND_ID=<the-_id-present-in-the-preceding-HTTP-response>



curl -v \
   -X POST \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   -H "Content-Type: application/json" \
   -d "{
      \"status\": \"3 = in progress\",
      \"deadline\": \"2024-08-31T21:08:36.367Z\",
      \"parentId\": \"${ISSUE_BACKEND_ID}\",
      \"description\": \"convert the \`epic\` field to a \`parentId\` field\"
   }" \
   localhost:5000/api/v1/issues \
   | json_pp

# ...
< HTTP/1.1 201 Created
# ...
```

```bash
curl -v \
   -X POST \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   -H "Content-Type: application/json" \
   -d "{
      \"status\": \"1 = backlog\",
      \"deadline\": \"2024-08-31T22:08:36.367Z\",
      \"parentId\": \"${ISSUE_FRONTEND_ID}\",
      \"description\": \"build a client (hopefully, a CLI tool combined with \`jq\`)\"
   }" \
   localhost:5000/api/v1/issues \
   | json_pp

# ...
< HTTP/1.1 201 Created
# ...
```

```bash
curl -v \
   -X POST \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   -H "Content-Type: application/json" \
   -d "{
      \"status\": \"2 = selected\",
      \"deadline\": \"2024-08-31T23:08:36.367Z\",
      \"parentId\": \"${ISSUE_BACKEND_ID}\",
      \"description\": \"containerize the backend\"
   }" \
   localhost:5000/api/v1/issues \
   | json_pp

# ...
< HTTP/1.1 201 Created
# ...



export ISSUE_5_ID=<the-_id-present-in-the-preceding-HTTP-response>
```



retrieve multiple `Issue`s

```bash
curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "meta" : {
      "curr" : "/api/v1/issues?perPage=100&page=1",
      "first" : "/api/v1/issues?perPage=100&page=1",
      "last" : "/api/v1/issues?perPage=100&page=1",
      "next" : null,
      "prev" : null,
      "total" : 5
   },
   "resources" : [
      {
         "__v" : 0,
         "_id" : "66dd7e58e7c673746905ff27",
         "createdAt" : "2024-09-08T10:37:12.447Z",
         "deadline" : "2024-09-08T21:08:36.367Z",
         "description" : "backend",
         "parentId" : null,
         "status" : "3 = in progress"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ea5e7c673746905ff2a",
         "createdAt" : "2024-09-08T10:38:29.616Z",
         "deadline" : "2024-09-15T21:08:36.367Z",
         "description" : "frontend",
         "parentId" : null,
         "status" : "1 = backlog"
      },
      {
         "__v" : 0,
         "_id" : "66dd7eb5e7c673746905ff2e",
         "createdAt" : "2024-09-08T10:38:45.259Z",
         "deadline" : "2024-08-31T21:08:36.367Z",
         "description" : "convert the `epic` field to a `parentId` field",
         "parentId" : "66dd7e58e7c673746905ff27",
         "status" : "3 = in progress"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ebce7c673746905ff32",
         "createdAt" : "2024-09-08T10:38:52.671Z",
         "deadline" : "2024-08-31T22:08:36.367Z",
         "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
         "parentId" : "66dd7ea5e7c673746905ff2a",
         "status" : "1 = backlog"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ec4e7c673746905ff36",
         "createdAt" : "2024-09-08T10:39:00.513Z",
         "deadline" : "2024-08-31T23:08:36.367Z",
         "description" : "containerize the backend",
         "parentId" : "66dd7e58e7c673746905ff27",
         "status" : "2 = selected"
      }
   ]
}
```

```bash
curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues?parentId=${ISSUE_FRONTEND_ID} \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "meta" : {
      "curr" : "/api/v1/issues?parentId=66dd7ea5e7c673746905ff2a&perPage=100&page=1",
      "first" : "/api/v1/issues?parentId=66dd7ea5e7c673746905ff2a&perPage=100&page=1",
      "last" : "/api/v1/issues?parentId=66dd7ea5e7c673746905ff2a&perPage=100&page=1",
      "next" : null,
      "prev" : null,
      "total" : 1
   },
   "resources" : [
      {
         "__v" : 0,
         "_id" : "66dd7ebce7c673746905ff32",
         "createdAt" : "2024-09-08T10:38:52.671Z",
         "deadline" : "2024-08-31T22:08:36.367Z",
         "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
         "parentId" : "66dd7ea5e7c673746905ff2a",
         "status" : "1 = backlog"
      }
   ]
}



curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues?parentId=null \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "meta" : {
      "curr" : "/api/v1/issues?parentId=null&perPage=100&page=1",
      "first" : "/api/v1/issues?parentId=null&perPage=100&page=1",
      "last" : "/api/v1/issues?parentId=null&perPage=100&page=1",
      "next" : null,
      "prev" : null,
      "total" : 2
   },
   "resources" : [
      {
         "__v" : 0,
         "_id" : "66dd7e58e7c673746905ff27",
         "createdAt" : "2024-09-08T10:37:12.447Z",
         "deadline" : "2024-09-08T21:08:36.367Z",
         "description" : "backend",
         "parentId" : null,
         "status" : "3 = in progress"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ea5e7c673746905ff2a",
         "createdAt" : "2024-09-08T10:38:29.616Z",
         "deadline" : "2024-09-15T21:08:36.367Z",
         "description" : "frontend",
         "parentId" : null,
         "status" : "1 = backlog"
      }
   ]
}



curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues?parentId= \
   | json_pp

# The HTTP response to this request is the same as
# the response to the preceding request. 
```

<u>TODO: (2024/08/29; 11:04)</u> consider whether this application needs to support Mongoose operators via URL query strings

```bash
curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   'localhost:5000/api/v1/issues?status\[lt\]=3' \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "meta" : {
      "curr" : "/api/v1/issues?status=%5Bobject+Object%5D&perPage=100&page=1",
      "first" : "/api/v1/issues?status=%5Bobject+Object%5D&perPage=100&page=1",
      "last" : "/api/v1/issues?status=%5Bobject+Object%5D&perPage=100&page=1",
      "next" : null,
      "prev" : null,
      "total" : 3
   },
   "resources" : [
      {
         "__v" : 0,
         "_id" : "66dd7ea5e7c673746905ff2a",
         "createdAt" : "2024-09-08T10:38:29.616Z",
         "deadline" : "2024-09-15T21:08:36.367Z",
         "description" : "frontend",
         "parentId" : null,
         "status" : "1 = backlog"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ebce7c673746905ff32",
         "createdAt" : "2024-09-08T10:38:52.671Z",
         "deadline" : "2024-08-31T22:08:36.367Z",
         "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
         "parentId" : "66dd7ea5e7c673746905ff2a",
         "status" : "1 = backlog"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ec4e7c673746905ff36",
         "createdAt" : "2024-09-08T10:39:00.513Z",
         "deadline" : "2024-08-31T23:08:36.367Z",
         "description" : "containerize the backend",
         "parentId" : "66dd7e58e7c673746905ff27",
         "status" : "2 = selected"
      }
   ]
}
```

```bash
curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   'localhost:5000/api/v1/issues?select=description,status' \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "meta" : {
      "curr" : "/api/v1/issues?select=description%2Cstatus&perPage=100&page=1",
      "first" : "/api/v1/issues?select=description%2Cstatus&perPage=100&page=1",
      "last" : "/api/v1/issues?select=description%2Cstatus&perPage=100&page=1",
      "next" : null,
      "prev" : null,
      "total" : 5
   },
   "resources" : [
      {
         "_id" : "66dd7e58e7c673746905ff27",
         "description" : "backend",
         "status" : "3 = in progress"
      },
      {
         "_id" : "66dd7ea5e7c673746905ff2a",
         "description" : "frontend",
         "status" : "1 = backlog"
      },
      {
         "_id" : "66dd7eb5e7c673746905ff2e",
         "description" : "convert the `epic` field to a `parentId` field",
         "status" : "3 = in progress"
      },
      {
         "_id" : "66dd7ebce7c673746905ff32",
         "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
         "status" : "1 = backlog"
      },
      {
         "_id" : "66dd7ec4e7c673746905ff36",
         "description" : "containerize the backend",
         "status" : "2 = selected"
      }
   ]
}
```

```bash
curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   'localhost:5000/api/v1/issues?sort=-status' \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "meta" : {
      "curr" : "/api/v1/issues?sort=-status&perPage=100&page=1",
      "first" : "/api/v1/issues?sort=-status&perPage=100&page=1",
      "last" : "/api/v1/issues?sort=-status&perPage=100&page=1",
      "next" : null,
      "prev" : null,
      "total" : 5
   },
   "resources" : [
      {
         "__v" : 0,
         "_id" : "66dd7e58e7c673746905ff27",
         "createdAt" : "2024-09-08T10:37:12.447Z",
         "deadline" : "2024-09-08T21:08:36.367Z",
         "description" : "backend",
         "parentId" : null,
         "status" : "3 = in progress"
      },
      {
         "__v" : 0,
         "_id" : "66dd7eb5e7c673746905ff2e",
         "createdAt" : "2024-09-08T10:38:45.259Z",
         "deadline" : "2024-08-31T21:08:36.367Z",
         "description" : "convert the `epic` field to a `parentId` field",
         "parentId" : "66dd7e58e7c673746905ff27",
         "status" : "3 = in progress"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ec4e7c673746905ff36",
         "createdAt" : "2024-09-08T10:39:00.513Z",
         "deadline" : "2024-08-31T23:08:36.367Z",
         "description" : "containerize the backend",
         "parentId" : "66dd7e58e7c673746905ff27",
         "status" : "2 = selected"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ea5e7c673746905ff2a",
         "createdAt" : "2024-09-08T10:38:29.616Z",
         "deadline" : "2024-09-15T21:08:36.367Z",
         "description" : "frontend",
         "parentId" : null,
         "status" : "1 = backlog"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ebce7c673746905ff32",
         "createdAt" : "2024-09-08T10:38:52.671Z",
         "deadline" : "2024-08-31T22:08:36.367Z",
         "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
         "parentId" : "66dd7ea5e7c673746905ff2a",
         "status" : "1 = backlog"
      }
   ]
}



curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   'localhost:5000/api/v1/issues?sort=status' \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "meta" : {
      "curr" : "/api/v1/issues?sort=status&perPage=100&page=1",
      "first" : "/api/v1/issues?sort=status&perPage=100&page=1",
      "last" : "/api/v1/issues?sort=status&perPage=100&page=1",
      "next" : null,
      "prev" : null,
      "total" : 5
   },
   "resources" : [
      {
         "__v" : 0,
         "_id" : "66dd7ea5e7c673746905ff2a",
         "createdAt" : "2024-09-08T10:38:29.616Z",
         "deadline" : "2024-09-15T21:08:36.367Z",
         "description" : "frontend",
         "parentId" : null,
         "status" : "1 = backlog"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ebce7c673746905ff32",
         "createdAt" : "2024-09-08T10:38:52.671Z",
         "deadline" : "2024-08-31T22:08:36.367Z",
         "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
         "parentId" : "66dd7ea5e7c673746905ff2a",
         "status" : "1 = backlog"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ec4e7c673746905ff36",
         "createdAt" : "2024-09-08T10:39:00.513Z",
         "deadline" : "2024-08-31T23:08:36.367Z",
         "description" : "containerize the backend",
         "parentId" : "66dd7e58e7c673746905ff27",
         "status" : "2 = selected"
      },
      {
         "__v" : 0,
         "_id" : "66dd7e58e7c673746905ff27",
         "createdAt" : "2024-09-08T10:37:12.447Z",
         "deadline" : "2024-09-08T21:08:36.367Z",
         "description" : "backend",
         "parentId" : null,
         "status" : "3 = in progress"
      },
      {
         "__v" : 0,
         "_id" : "66dd7eb5e7c673746905ff2e",
         "createdAt" : "2024-09-08T10:38:45.259Z",
         "deadline" : "2024-08-31T21:08:36.367Z",
         "description" : "convert the `epic` field to a `parentId` field",
         "parentId" : "66dd7e58e7c673746905ff27",
         "status" : "3 = in progress"
      }
   ]
}
```

```bash
curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   'localhost:5000/api/v1/issues?perPage=2&page=2' \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "meta" : {
      "curr" : "/api/v1/issues?perPage=2&page=2",
      "first" : "/api/v1/issues?perPage=2&page=1",
      "last" : "/api/v1/issues?perPage=2&page=3",
      "next" : "/api/v1/issues?perPage=2&page=3",
      "prev" : "/api/v1/issues?perPage=2&page=1",
      "total" : 5
   },
   "resources" : [
      {
         "__v" : 0,
         "_id" : "66dd7eb5e7c673746905ff2e",
         "createdAt" : "2024-09-08T10:38:45.259Z",
         "deadline" : "2024-08-31T21:08:36.367Z",
         "description" : "convert the `epic` field to a `parentId` field",
         "parentId" : "66dd7e58e7c673746905ff27",
         "status" : "3 = in progress"
      },
      {
         "__v" : 0,
         "_id" : "66dd7ebce7c673746905ff32",
         "createdAt" : "2024-09-08T10:38:52.671Z",
         "deadline" : "2024-08-31T22:08:36.367Z",
         "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
         "parentId" : "66dd7ea5e7c673746905ff2a",
         "status" : "1 = backlog"
      }
   ]
}
```



retrieve one `Issue`

```bash
curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues/17 \
   | json_pp

# ...
< HTTP/1.1 400 Bad Request
# ...
{
   "message" : "Invalid ID provided"
}
```

```bash
curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues/${VALID_BUT_NONEXISTENT_ISSUE_ID} \
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
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues/${ISSUE_5_ID} \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "__v" : 0,
   "_id" : "66dd7ec4e7c673746905ff36",
   "createdAt" : "2024-09-08T10:39:00.513Z",
   "deadline" : "2024-08-31T23:08:36.367Z",
   "description" : "containerize the backend",
   "parentId" : "66dd7e58e7c673746905ff27",
   "status" : "2 = selected"
}
```



update one `Issue`

```bash
curl -v \
   -X PUT \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues/17 \
   | json_pp

# ...
< HTTP/1.1 400 Bad Request
# ...
{
   "message" : "Invalid ID provided"
}
```

```bash
curl -v \
   -X PUT \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues/${VALID_BUT_NONEXISTENT_ISSUE_ID} \
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
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   -H "Content-Type: application/json" \
   -d "{
      \"status\": \"3 = in progress\"
   }" \
   localhost:5000/api/v1/issues/${ISSUE_5_ID} \
   | json_pp

# ...
< HTTP/1.1 200 OK
# ...
{
   "__v" : 0,
   "_id" : "66dd7ec4e7c673746905ff36",
   "createdAt" : "2024-09-08T10:39:00.513Z",
   "deadline" : "2024-08-31T23:08:36.367Z",
   "description" : "containerize the backend",
   "parentId" : "66dd7e58e7c673746905ff27",
   "status" : "3 = in progress"
}
```



delete one `Issue`

```bash
curl -v \
   -X DELETE \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues/17 \
   | json_pp

# ...
< HTTP/1.1 400 Bad Request
# ...
{
   "message" : "Invalid ID provided"
}
```

```bash
curl -v \
   -X DELETE \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues/${VALID_BUT_NONEXISTENT_ISSUE_ID} \
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
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues/${ISSUE_5_ID}

# ...
< HTTP/1.1 204 No Content
# ...
# The body of the HTTP response is empty.
```



revoke the access token
and
verify that the backend will not accept the revoked token

```bash
curl -v \
   -X DELETE \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/tokens

# ...
< HTTP/1.1 204 No Content
# ...
# The body of the HTTP response is empty.



# Repeat any one of the above-listed HTTP requests with status codes 2xx -
# for example:
curl -v \
   -H "Authorization: Bearer ${ACCESS_TOKEN}" \
   localhost:5000/api/v1/issues \
   | json_pp

# ...
< HTTP/1.1 401 Unauthorized
# ...
{
   "message" : "Revoked access token"
}
```



# Containerization using Docker

```bash
docker network create \
   network-mini-jira-3

docker volume create \
   volume-mini-jira-3-mongo

docker run \
   --network=network-mini-jira-3 \
   --name container-mini-jira-3-mongo \
   --mount source=volume-mini-jira-3-mongo,destination=/data/db \
   --env MONGO_INITDB_ROOT_USERNAME=$(grep -oP '^MONGO_USERNAME=\K.*' .env) \
   --env MONGO_INITDB_ROOT_PASSWORD=$(grep -oP '^MONGO_PASSWORD=\K.*' .env) \
   --env MONGO_INITDB_DATABASE=$(grep -oP '^MONGO_DATABASE=\K.*' .env) \
   --publish 27017:27017 \
   mongo:latest



docker run \
   --network=network-mini-jira-3 \
   --name=container-mini-jira-3-mongosh \
   -it \
   --rm \
   mongo:latest \
      mongosh \
      --host container-mini-jira-3-mongo \
      --username $(grep -oP '^MONGO_USERNAME=\K.*' .env) \
      --password $(grep -oP '^MONGO_PASSWORD=\K.*' .env) \
      --authenticationDatabase admin \
      $(grep -oP '^MONGO_DATABASE=\K.*' .env)


# TODO: (2024/09/09, 07:16) double-check whether the `containerization/Dockerfile.dockerignore` achieves what I expect; a concrete way for double-checking that is detailed at https://github.com/moby/moby/issues/12886#issuecomment-480575928
docker build \
   --file containerization/Dockerfile \
   --tag image-mini-jira-3:2024-09-08-16-21 \
   .

docker run \
   --network=network-mini-jira-3 \
   --name=container-mini-jira-3 \
   --env-file .env \
   --env MONGO_HOST=container-mini-jira-3-mongo \
   --publish 5000:5000 \
   --entrypoint npm \
   image-mini-jira-3:2024-09-08-16-21 \
   run dev
```
