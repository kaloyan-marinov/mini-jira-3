const mongoose = require('mongoose');

const connectToDatabase = async () => {
  console.log('Establishing connection to MongoDB host...');

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
    `Established connection to MongoDB host at ${connection.connection.host}:${connection.connection.port} ${connection.connection.db.databaseName}`
  );
};

module.exports = connectToDatabase;
