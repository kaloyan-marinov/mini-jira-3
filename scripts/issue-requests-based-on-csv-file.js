/*
In order to be able to run this script,
you must begin by taking these preparatory steps:

1. create a `User`
   (as described in the repository's `README.md`)

2. run
```
cp \
  scripts/.env.template
  scripts/.env
```

3. provide real values in the newly-created `scripts/.env` file

4. in VS Code's sidebar that is on the left, click on "Run & Debug" ;
   using the dropdown menu,
   select the launch configuration called "Node.js : Current File" ;
   run it by clicking the [Play] button;

   alternatively,
   use a terminal to navigate into the repository
   and go on to execute
   ```
   node scripts/issue-requests-based-on-csv-file.js \
      scripts/example-issues.csv
   ```
*/

const dotenv = require('dotenv');
const fs = require('fs');
const csvParser = require('csv-parser');

// Load all environment variables, which are set in a file at the specified path.
dotenv.config({
  path: 'scripts/.env',
});

const obtainAccessToken = async (username, password) => {
  console.log('');
  console.log('obtaining an access token');

  let response;
  let accessToken;

  try {
    const base64EncodingOfCredentials = btoa(username + ':' + password);
    response = await fetch('http://localhost:5000/api/v1/tokens', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + base64EncodingOfCredentials,
      },
    });

    const data = await response.json();

    accessToken = data.accessToken;
  } catch (error) {
    console.log(error);
  }

  return accessToken;
};

const determineEpicNames = (pathToCSVFile) => {
  console.log('');
  console.log('determining the names of all epics');

  return new Promise((resolve, reject) => {
    const epicNames = [];

    fs.createReadStream(pathToCSVFile)
      .pipe(csvParser())
      .on('data', (row) => {
        // A JavaScript object representing the current row is stored in `row`.
        // console.log(row);

        const epicName = row['category/Epic/project'];
        if (!epicNames.includes(epicName)) {
          epicNames.push(epicName);
        }
      })
      .on('end', () => {
        console.log('finished processing the CSV file');
        resolve(epicNames);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

const requestForCreatingSingleIssue = async (accessToken, jsonPayload) => {
  let data;

  try {
    response = await fetch('http://localhost:5000/api/v1/issues', {
      method: 'POST',
      body: JSON.stringify(jsonPayload),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
    });

    data = await response.json();

    console.log(['(final)', response.status, data._id].join(' - '));
  } catch (err) {
    console.log(err);
  }

  return data;
};

const sanitizeRow = (row, epicNameToEpic) => {
  const sanitizedRow = { ...row };

  delete sanitizedRow['id'];

  if (sanitizedRow['deadline'] === 'n/a') {
    // sanitizedRow['deadline'] = null;
    // TODO: (2024/10/23, 05:27)
    //      update the file at `pathToCSVFile`
    //      s.t. no Issue lacks a `deadline`
    sanitizedRow['deadline'] =
      sanitizedRow['finished_at'] !== 'n/a'
        ? sanitizedRow['finished_at']
        : new Date('1970-01-01T17:17:17');
  } else {
    const deadlines = sanitizedRow['deadline'].split('<<');
    const mostRecentlySetDeadline = deadlines[0];
    sanitizedRow['deadline'] = mostRecentlySetDeadline.trim();
  }

  delete sanitizedRow['created_at'];
  sanitizedRow['createdAt'] = row['created_at'];

  delete sanitizedRow['finished_at'];
  sanitizedRow['finishedAt'] =
    row['finished_at'] === 'n/a' ? null : row['finished_at'];

  const parentId = epicNameToEpic[row['category/Epic/project']]._id;
  sanitizedRow['parentId'] = parentId;
  delete sanitizedRow['category/Epic/project'];

  // console.log('sanitizedRow =', sanitizedRow);

  console.log(['(start)', row['id'], sanitizedRow['deadline']].join(' - '));

  return sanitizedRow;
};

/**
 * This function processes a CSV file and issues an HTTP request for each row.
 *
 * More concretely, this function
 * reads a CSV file line by line, parses each row, and issues an HTTP request.
 * All requests are sent asynchronously,
 * but the function is designed to resolve
 * only after all requests have been completed.
 *
 * (
 * Technical justification for the way in which this function is implemented
 *
 *    To ensure that all HTTP requests issued by this function have been processed
 *    before the Node.js runtime goes on to the statement after this function has been called,
 *    this function needs to track the asynchronous operations in the `.on('data')` handler
 *    and wait for all those operations to complete.
 *
 *    The key problem is that
 *    the `on('data')` callback is not designed to await asynchronous operations.
 *
 *    So this function must explicitly manage these promises.
 *    That can achieved by using a combination of
 *    `Promise` handling and an array of all active requests.
 * )
 *
 * @param {string} pathToCSVFile - The path to the CSV file to be processed.
 * @param {string} accessToken - The access token to be included
 *                               in the Authorization header of each request.
 * @returns {Promise<void>} A promise that resolves when all requests have been processed.
 *
 * Usage:
 *
 * ```
 * try {
 *   await requestsForCreatingIssues('path/to/file.csv', 'your-access-token');
 *   console.log('All requests completed successfully');
 * } catch (error) {
 *   console.error('An error occurred:', error);
 * }
 * ```
 */
const requestsForCreatingIssues = async (
  epicNameToEpic,
  pathToCSVFile,
  accessToken
) => {
  console.log('');
  console.log(
    'creating all issues, each of which has a `parentId` different from `null`'
  );

  const activeRequests = [];

  const awaitAllActiveRequests = (resolve, reject) => {
    fs.createReadStream(pathToCSVFile)
      .pipe(csvParser())
      .on('data', (row) => {
        // A JavaScript object representing the current row is stored in `row`.
        // console.log(row);

        if (
          !Object.keys(epicNameToEpic).includes(row['category/Epic/project'])
        ) {
          console.log(
            'will not issue an HTTP request based on the current `row`'
          );
        } else {
          const sanitizedRow = sanitizeRow(row, epicNameToEpic);

          // Create a promise for an HTTP request,
          // whose body is set equal to `sanitizedRow`.
          const requestPromise = requestForCreatingSingleIssue(
            accessToken,
            sanitizedRow
          );

          activeRequests.push(requestPromise);
        }
      })
      .on('end', () => {
        console.log('finished processing the CSV file');

        // Wait for all active requests to finish.
        Promise.all(activeRequests)
          .then(() => resolve())
          .catch(reject);
      })
      .on('error', () => {
        // Handle errors in the stream.
        reject();
      });
  };

  return new Promise(awaitAllActiveRequests);
};

const revokeAccessToken = async (accessToken) => {
  console.log('');
  console.log('revoking the obtained access token');

  let response;

  try {
    response = await fetch('http://localhost:5000/api/v1/tokens', {
      method: 'DELETE',
      headers: {
        // 'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
    });

    // const data = await response.json();

    // console.log([response.status, data].join(' - '));
    console.log(['(final)', response.status].join(' - '));
  } catch (err) {
    console.log(err);
  }
};

const path = process.argv[2];

if (!path) {
  console.error(
    'must provide a CSV file with `Issue`s as a command-line argument - aborting!'
  );

  process.exit(1);
}

(async () => {
  const accessToken = await obtainAccessToken(
    process.env.USERNAME,
    process.env.PASSWORD
  );
  // console.log('accessToken =', accessToken);

  const epicNames = await determineEpicNames(path);
  console.log('epicNames =', epicNames);

  // Create all "epics" (= `Issue`s without a `parentId`).
  console.log('');
  console.log('creating all epics');

  const epicNameToEpic = {};
  for (const epicName of epicNames) {
    const data = await requestForCreatingSingleIssue(accessToken, {
      createdAt: new Date('2023-11-20T06:55:17'),
      status: '3 = in progress',
      deadline: new Date('2024-12-31T17:17:17'),
      finishedAt: null,
      parentId: null,
      description: epicName,
    });

    epicNameToEpic[epicName] = data;
  }
  console.log('epicNameToEpic =', epicNameToEpic);

  try {
    await requestsForCreatingIssues(epicNameToEpic, path, accessToken);
  } catch (err) {
    console.error(err);

    process.exit(1);
  }

  await revokeAccessToken(accessToken);
})();
