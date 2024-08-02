const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // 쿠키 파서 추가
const indexRouter = require('./routes/index');

const app = express();

const passport = require('./config/passport');

require('dotenv').config();
// app.use(cors());

app.use(
  cors({
    origin: 'http://localhost:3000', // 클라이언트의 도메인
    credentials: true, // 쿠키를 포함할 수 있게 설정
  }),
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser()); // 쿠키 파서 미들웨어 추가

app.use('/api', indexRouter);

const LOCAL_DB_ADDRESS = process.env.LOCAL_DB_ADDRESS;
const MONGODB_URI_PROD = process.env.MONGODB_URI_PROD;

mongoose
  .connect(LOCAL_DB_ADDRESS)
  .then(() => console.log('mongoose connected !'))
  .catch((err) => console.log('db connection fail', err));

app.listen(process.env.PORT || 5000, () => {
  console.log('server on');
});
