const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI

mongoose.set('strictQuery', true);
const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
    // Do not exit; app can still run for development without DB
  }
}

module.exports = { connectDb, mongoose };
