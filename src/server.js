const dotenv = require('dotenv');
const connectToDatabase = require('./database');
const app = require('./app');

// Load all environment variables, which are set in a file at the specified path.
dotenv.config({
  path: '.env',
});

const connectToDatabasePromise = connectToDatabase();

console.log();
console.log(`BACKEND_USERNAME = ${process.env.BACKEND_USERNAME}`);
console.log(`BACKEND_PASSWORD = ${process.env.BACKEND_PASSWORD}`);
console.log();

connectToDatabasePromise
  .then(() => {
    const PORT = 5000;

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err);
  });
