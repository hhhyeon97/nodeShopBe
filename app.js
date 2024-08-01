const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const indexRouter = require('./routes/index');

const app = express();

const passport = require('./config/passport');
const session = require('express-session');

require('dotenv').config();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // req.body가 객체로 인식이 된다.

app.use('/api', indexRouter);

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const LOCAL_DB_ADDRESS = process.env.LOCAL_DB_ADDRESS;
const MONGODB_URI_PROD = process.env.MONGODB_URI_PROD;
// console.log('mongo-uri', MONGODB_URI_PROD);
mongoose
  .connect(LOCAL_DB_ADDRESS)
  .then(() => console.log('mongoose connected !'))
  .catch((err) => console.log('db connection fail', err));

app.listen(process.env.PORT || 5000, () => {
  console.log('server on');
});
