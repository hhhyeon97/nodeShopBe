const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY; // 새로운 시크릿키
const userSchema = Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    level: { type: String, default: 'customer' }, // 2types: customer, admin
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function () {
  const obj = this._doc;
  delete obj.password;
  delete obj.__v;
  delete obj.updatedAt;
  delete obj.createdAt;
  return obj;
};

// userSchema.methods.generateToken = async function () {
//   const token = await jwt.sign({ _id: this.id }, JWT_SECRET_KEY, {
//     expiresIn: '1d',
//   });
//   return token;
// };

userSchema.methods.generateAccessToken = async function () {
  const token = await jwt.sign({ _id: this.id }, JWT_SECRET_KEY, {
    expiresIn: '15s', // 테스트 15초
  });
  return token;
};

userSchema.methods.generateRefreshToken = async function () {
  const token = await jwt.sign({ _id: this.id }, JWT_REFRESH_SECRET_KEY, {
    expiresIn: '30d', // 30일
  });
  return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
