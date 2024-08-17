const connectToDatabase = require('./database');
const app = require('./app');

connectToDatabase();

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
