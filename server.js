require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const PORT = process.env.PORT || 5000;
const profilesRouter = require('./src/routes/profiles');
const { connectDb } = require('./src/Database/db');

connectDb();

app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));

app.use('/api', profilesRouter);


  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });


module.exports = app;
