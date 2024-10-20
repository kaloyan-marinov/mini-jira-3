const fs = require('fs');
const csvParser = require('csv-parser');

const issueRequests = (pathToCSVFile) => {
  fs.createReadStream(pathToCSVFile)
    .pipe(csvParser())
    .on('data', (row) => {
      // A JavaScript object representing the current row is stored in `row`.
      console.log(row);
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

issueRequests(path);
