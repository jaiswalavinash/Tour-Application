const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE;
mongoose
  .connect(DB)
  .then(() => {
    console.log('Database is connected 😍');
  })
  .catch((err) => {
    console.log('Database is not connected😒',err);
  });


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`server is listening on PORT ${PORT}...`);
});


