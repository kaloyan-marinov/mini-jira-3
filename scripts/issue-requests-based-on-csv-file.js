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

const determineEpicNames = async (pathToCSVFile) => {
  return new Promise((resolve, reject) => {
    const epicNames = [];

    fs.createReadStream(pathToCSVFile)
      .pipe(csvParser())
      .on('data', async (row) => {
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

const requestsForCreatingEpics = async (epicNames, accessToken) => {
  const epicNameToEpic = {};

  for (const epicName of epicNames) {
    try {
      const response = await fetch('http://localhost:5000/api/v1/issues', {
        method: 'POST',
        body: JSON.stringify({
          createdAt: new Date('2023-11-20T06:55:17'),
          status: '3 = in progress',
          deadline: new Date('2024-12-31T17:17:17'),
          finishedAt: null,
          parentId: null,
          description: epicName,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
      });

      epicNameToEpic[epicName] = await response.json();
    } catch (err) {
      console.log(err);
    }
  }

  return epicNameToEpic;
};

const requestsForCreatingIssues = async (
  epicNameToEpic,
  pathToCSVFile,
  accessToken
) => {
  fs.createReadStream(pathToCSVFile)
    .pipe(csvParser())
    .on('data', async (row) => {
      // A JavaScript object representing the current row is stored in `row`.
      // console.log(row);

      if (!Object.keys(epicNameToEpic).includes(row['category/Epic/project'])) {
        console.log(
          'will not issue an HTTP request based on the current `row`'
        );
      } else {
        // Sanitize `row`.
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

        sanitizedRow['parentId'] = epicNameToEpic[row['category/Epic/project']];
        delete sanitizedRow['category/Epic/project'];

        console.log(
          ['(start)', row['id'], sanitizedRow['deadline']].join(' - ')
        );

        // Issue an HTTP request, whose body is set equal to `sanitizedRow`.
        let response;

        try {
          response = await fetch('http://localhost:5000/api/v1/issues', {
            method: 'POST',
            body: JSON.stringify(sanitizedRow),
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + accessToken,
            },
          });

          const data = await response.json();

          console.log(['(final)', response.status, data._id].join(' - '));
        } catch (err) {
          console.log(err);
        }
      }
    })
    .on('end', () => {
      console.log('finished processing the CSV file');
    });
};

// TODO: (2024/10/22, 06:53)
//      re-order the symbols defined in this file
//      to match the order in which they are used within the IIFE
//      (:= Immediately Invoked Function Expression) below
const path = process.argv[2];

if (!path) {
  console.error('boo!');
  process.exit(1);
}

(async () => {
  const accessToken = await obtainAccessToken(
    process.env.USERNAME,
    process.env.PASSWORD
  );

  const epicNames = await determineEpicNames(path);
  console.log(epicNames);

  const epicNameToEpic = await requestsForCreatingEpics(epicNames, accessToken);
  console.log(epicNameToEpic);

  await requestsForCreatingIssues(epicNameToEpic, path, accessToken);
})();
