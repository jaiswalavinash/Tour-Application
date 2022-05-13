const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../model/tourSchema');
dotenv.config({ path: './config.env' });
const Review = require('../../model/reviewModel');
const User = require('../../model/userModel');

const DB = process.env.DATABASE;
mongoose
  .connect(DB)
  .then(() => {
    console.log('Database is connected 😍');
  })
  .catch((err) => {
    console.log('Database is not connected😒');
  });
// Read Json File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// Import data into data base
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users,{validateBeforeSave:false });
    await Review.create(reviews);
    console.log('Data Successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete All data from MongoDB.
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data Successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
