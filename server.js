// Connect to MongoDB when MONGODB_URI is provided
if (process.env.MONGODB_URI) {
  try {
    const db = require('./src/Database/db');
    db.connect();
  } catch (err) {
    console.warn('Failed to load DB module:', err && err.message ? err.message : err);
  }
} else {
  console.log('MONGODB_URI not set — using JSON file store');
}

const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const PORT = process.env.PORT || 5000;
const profilesRouter = require('./src/routes/profiles');
require('dotenv').config();



app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));

app.use('/api', profilesRouter);



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
