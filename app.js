const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const indexRouter = require('./routes/index');

const app = express();

require('dotenv').config();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // req.body가 객체로 인식이 된다.

app.use('/api', indexRouter);

const LOCAL_DB_ADDRESS = process.env.LOCAL_DB_ADDRESS;
// console.log('mongo-uri', MONGODB_URI_PROD);
mongoose
  .connect(LOCAL_DB_ADDRESS, { useNewUrlParser: true })
  .then(() => console.log('mongoose connected !'))
  .catch((err) => console.log('db connection fail', err));

app.listen(process.env.PORT || 5000, () => {
  console.log('server on');
});
