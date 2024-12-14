const fs = require('fs');
const csvParser = require('csv-parser');

// const fetch = require('node-fetch');

const issueRequests = (pathToCSVFile, accessToken) => {
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

// TODO: (2024/10/21, 07:09)
//      avoid hard-coding an `accessToken`
accessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzVkZjI3NGRiOTBhMzI0OWJkZDA0MzEiLCJpYXQiOjE3MzQyMTAxNjksImV4cCI6MTczNDIxMTY2OX0.gckY1i28sDkVu6eyThF3lFKIUD_0v_JkqTeBGcW94Q4';
issueRequests(path, accessToken);
