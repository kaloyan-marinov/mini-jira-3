const mongoose = require('mongoose');

const connectToDatabase = async () => {
  console.log(
    `Connecting to a MongoDB host at` +
      ` ${process.env.MONGO_HOST}:27017` +
      ` (target database: "${process.env.MONGO_DATABASE}") ...`
  );

  const connection = await mongoose.connect(
    'mongodb://' +
      `${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}` +
      `@${process.env.MONGO_HOST}` +
      `/${process.env.MONGO_AUTHENTICATION_DATABASE}` +
      '?retryWrites=true&w=majority',
    {
      dbName: process.env.MONGO_DATABASE,
    }
  );

  console.log(
    `Connected successfully ( to the MongoDB host at` +
      ` ${connection.connection.host}:${connection.connection.port}` +
      ` ${connection.connection.db.databaseName} )`
  );
};

module.exports = connectToDatabase;
