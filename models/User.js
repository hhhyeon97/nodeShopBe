const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const userSchema = Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    level: { type: String, default: 'customer' }, // 2types: customer, admin
    refreshToken: { type: String, default: undefined }, // !! refreshToken 필드 추가
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

// 기존 어세스 토큰만 발급한 코드
/*
userSchema.methods.generateToken = async function () {
  const token = await jwt.sign({ _id: this.id }, JWT_SECRET_KEY, {
    expiresIn: '1d',
  });
  return token;
};
*/

// !! 업데이트 -> 어세스 토큰 + 리프레시 토큰 발급
userSchema.methods.generateTokens = async function () {
  const accessToken = await jwt.sign({ _id: this.id }, JWT_SECRET_KEY, {
    expiresIn: '10s', // 짧은 유효 기간
  });

  const refreshToken = await jwt.sign({ _id: this.id }, JWT_SECRET_KEY, {
    expiresIn: '7d', // 긴 유효 기간
  });

  this.accessToken = accessToken;
  this.refreshToken = refreshToken; // 리프레시토큰 저장
  await this.save();

  return { accessToken, refreshToken };
};

const User = mongoose.model('User', userSchema);
module.exports = User;
