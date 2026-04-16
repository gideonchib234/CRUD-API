const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const PORT = require(process.env.PORT || 5000);
const router = require('./routes');
require('dotenv').config();

app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));

app.use('/api', );

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
