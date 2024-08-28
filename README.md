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



- create one

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
      "message" : "Unable to create a new issue."
   }
   ```

   ```bash
   curl -v \
      -X POST \
      -H "Content-Type: application/json" \
      -d "{
               \"status\": \"1 = backlog\",
               \"deadline\": \"2024-08-19T09:00:00.000Z\",
               \"epic\": \"backend\",
               \"description\": \"containerize the backend\"
         }" \
      localhost:5000/api/v1/issues \
      | json_pp

   # ...
   < HTTP/1.1 201 Created
   # ...
   {
      "__v" : 0,
      "_id" : "66c2dbf2d0d5b26a9bdfbc9f",
      "createdAt" : "2024-08-19T05:45:22.243Z",
      "deadline" : "2024-08-19T09:00:00.000Z",
      "description" : "containerize the backend",
      "epic" : "backend",
      "status" : "1 = backlog"
   }
   ```

   ```bash
   curl -v \
      -X POST \
      -H "Content-Type: application/json" \
      -d "{
               \"status\": \"1 = backlog\",
               \"deadline\": \"2024-08-28T19:45:08.246Z\",
               \"epic\": \"backend\",
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
      -H "Content-Type: application/json" \
      -d "{
               \"status\": \"1 = backlog\",
               \"deadline\": \"2024-08-28T19:45:24.081Z\",
               \"epic\": \"frontend\",
               \"description\": \"build a client (hopefully, a CLI tool combined with \`jq\`)\"
         }" \
      localhost:5000/api/v1/issues \
      | json_pp

   # ...
   < HTTP/1.1 201 Created
   # ...
   ```

   ```bash
   export ISSUE_3_ID=<the-_id-present-in-the-preceding-HTTP-response>

   export VALID_BUT_NONEXISTENT_ISSUE_ID=<same-as-ISSUE_3_ID-but-with-the-last-character-changed-to-another-hexadecimal-digit>
   ```



- retrieve multiple

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
            "__v" : 0,
            "_id" : "66cf7dbbc96812bec9925392",
            "createdAt" : "2024-08-28T19:42:51.501Z",
            "deadline" : "2024-08-19T09:00:00.000Z",
            "description" : "containerize the backend",
            "epic" : "backend",
            "status" : "1 = backlog"
         },
         {
            "__v" : 0,
            "_id" : "66cf7eb7c96812bec9925394",
            "createdAt" : "2024-08-28T19:47:03.691Z",
            "deadline" : "2024-08-28T19:45:08.246Z",
            "description" : "convert the `epic` field to a `parentId` field",
            "epic" : "backend",
            "status" : "1 = backlog"
         },
         {
            "__v" : 0,
            "_id" : "66cf7edfc96812bec9925396",
            "createdAt" : "2024-08-28T19:47:43.611Z",
            "deadline" : "2024-08-28T19:45:24.081Z",
            "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
            "epic" : "frontend",
            "status" : "1 = backlog"
         }
      ]
   }
   ```

   ```bash
   curl -v \
      localhost:5000/api/v1/issues?epic=frontend \
      | json_pp

   # ...
   < HTTP/1.1 200 OK
   # ...
   {
      "resources" : [
         {
            "__v" : 0,
            "_id" : "66cf7edfc96812bec9925396",
            "createdAt" : "2024-08-28T19:47:43.611Z",
            "deadline" : "2024-08-28T19:45:24.081Z",
            "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
            "epic" : "frontend",
            "status" : "1 = backlog"
         }
      ]
   }
   ```

   ```bash
   curl -v \
      'localhost:5000/api/v1/issues?deadline\[lte\]=2024-08-23' \
      | json_pp
   
   # ...
   < HTTP/1.1 200 OK
   # ...
   {
      "resources" : [
         {
            "__v" : 0,
            "_id" : "66cf7dbbc96812bec9925392",
            "createdAt" : "2024-08-28T19:42:51.501Z",
            "deadline" : "2024-08-19T09:00:00.000Z",
            "description" : "containerize the backend",
            "epic" : "backend",
            "status" : "3 = in progress"
         }
      ]
   }
   ```

   ```bash
   curl -v \
      'localhost:5000/api/v1/issues?select=description,status' \
      | json_pp
   
   # ...
   < HTTP/1.1 200 OK
   # ...
   {
      "resources" : [
         {
            "_id" : "66cf7dbbc96812bec9925392",
            "description" : "containerize the backend",
            "status" : "3 = in progress"
         },
         {
            "_id" : "66cf7eb7c96812bec9925394",
            "description" : "convert the `epic` field to a `parentId` field",
            "status" : "1 = backlog"
         },
         {
            "_id" : "66cf7edfc96812bec9925396",
            "description" : "build a client (hopefully, a CLI tool combined with `jq`)",
            "status" : "2 = selected"
         }
      ]
   }
   ```



- retrieve one

   ```bash
   curl -v \
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
      localhost:5000/api/v1/issues/${ISSUE_3_ID} \
      | json_pp

   # ...
   < HTTP/1.1 200 OK
   # ...
   {
      "__v" : 0,
      "_id" : "66c2dbf2d0d5b26a9bdfbc9f",
      "createdAt" : "2024-08-19T05:45:22.243Z",
      "deadline" : "2024-08-19T09:00:00.000Z",
      "description" : "containerize the backend",
      "epic" : "backend",
      "status" : "1 = backlog"
   }
   ```



- update one

   ```bash
   curl -v \
      -X PUT \
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
      -H "Content-Type: application/json" \
      -d "{
               \"status\": \"4 = done\"
         }" \
      localhost:5000/api/v1/issues/${ISSUE_3_ID} \
      | json_pp

   # ...
   < HTTP/1.1 200 OK
   # ...
   {
      "__v" : 0,
      "_id" : "66c4f458e3788fc8e79d0c89",
      "createdAt" : "2024-08-20T19:54:00.804Z",
      "deadline" : "2024-08-19T09:00:00.000Z",
      "description" : "containerize the backend",
      "epic" : "backend",
      "status" : "4 = done"
   }
   ```



- delete one

   ```bash
   curl -v \
      -X DELETE \
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
      localhost:5000/api/v1/issues/${ISSUE_3_ID}

   # ...
   < HTTP/1.1 204 No Content
   # ...
   # The body of the HTTP response is empty.
   ```
