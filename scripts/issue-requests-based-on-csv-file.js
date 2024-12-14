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

const issueRequests = async (pathToCSVFile, accessToken) => {
  fs.createReadStream(pathToCSVFile)
    .pipe(csvParser())
    .on('data', async (row) => {
      // A JavaScript object representing the current row is stored in `row`.
      // console.log(row);

      // Sanitize `row`.
      const sanitizedRow = { ...row };

      delete sanitizedRow['id'];

      if (sanitizedRow['deadline'] === 'n/a') {
        // sanitizedRow['deadline'] = null;
        sanitizedRow['deadline'] =
          sanitizedRow['finished_at'] !== 'n/a'
            ? sanitizedRow['finished_at']
            : new Date('1970-01-01T17:17:17');
      } else {
        const deadlines = sanitizedRow['deadline'].split('<<');
        const mostRecentlySetDeadline = deadlines[0];
        sanitizedRow['deadline'] = mostRecentlySetDeadline.trim();
      }

      // if (sanitizedRow['finished_at'] === 'n/a') {
      //   sanitizedRow['finished_at'] = null;
      // }

      // TODO: (2024/10/21, 07:10)
      //      created_at >> createdAt
      //      finished_at >> finishedAt
      //      parentId

      console.log(['(start)', row['id'], sanitizedRow['deadline']].join(' - '));

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
      } catch (error) {
        console.log(error);
      }
    })
    .on('end', () => {
      console.log('finished processing the CSV file');
    });
};

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
  await issueRequests(path, accessToken);
})();
