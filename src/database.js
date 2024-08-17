const mongoose = require('mongoose');

const connectToDatabase = async () => {
  console.log('Establishing connection to MongoDB host...');

  const connection = await mongoose.connect(
    'mongodb://' +
      // 'srv+mongoadmin:secret@localhost:27017' +
      // 'mongoadmin:secret@localhost:27017' +
      'mongoadmin:secret@localhost' +
      '/admin?retryWrites=true&w=majority',
    {
      dbName: 'db-mini-jira-3',
    }
  );
  // const connection = await mongoose.connect(process.env.MONGO_URI);

  console.log(
    `Established connection to MongoDB host at ${connection.connection.host}:${connection.connection.port} ${connection.connection.db.databaseName}`
  );
};

module.exports = connectToDatabase;
