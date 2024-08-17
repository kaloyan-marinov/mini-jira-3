const connectToDatabase = require('./database');
const app = require('./app');

const connectToDatabasePromise = connectToDatabase();

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
