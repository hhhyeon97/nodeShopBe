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

const MONGODB_URI_PROD = process.env.MONGODB_URI_PROD;
// console.log('mongo-uri', MONGODB_URI_PROD);
mongoose
  .connect(MONGODB_URI_PROD, { useNewUrlParser: true })
  .then(() => console.log('mongoose connected !'))
  .catch((err) => console.log('db connection fail', err));

app.listen(process.env.PORT || 5000, () => {
  console.log('server on');
});
