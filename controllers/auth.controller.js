const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authController = {};
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

authController.loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // token
        const token = await user.generateToken();
        return res.status(200).json({ status: 'success', user, token });
      }
    }
    throw new Error('이메일 혹은 비밀번호가 잘못되었습니다 !');
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

authController.loginWithGoogle = async (req, res) => {
  try {
    // 토큰 읽어오기
    const { token } = req.body;
    const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const { email, name } = ticket.getPayload();
    // console.log('eee', email, name);
    let user = await User.findOne({ email });
    if (!user) {
      // 유저를 새로 생성
      const randomPassword = '' + Math.floor(Math.random() * 1000000);
      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name,
        email,
        password: newPassword,
      });
      await user.save();
    }
    // 토큰 발행 리턴
    const sessionToken = await user.generateToken();
    res.status(200).json({ status: 'success', user, token: sessionToken });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

authController.authenticate = async (req, res, next) => {
  try {
    const tokenString = req.headers.authorization;
    if (!tokenString) throw new Error('Token not found');
    const token = tokenString.replace('Bearer ', '');
    jwt.verify(token, JWT_SECRET_KEY, (error, payload) => {
      if (error) throw new Error('로그인 후 이용가능합니다.');
      req.userId = payload._id;
    });
    next();
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

// authController.authenticate = (req, res, next) => {
//   const token = req.header('Authorization').replace('Bearer ', '');
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET_KEY);
//     req.userId = decoded._id;
//     next();
//   } catch (error) {
//     res.status(401).json({ status: 'fail', error: 'Unauthorized' });
//   }
// };

authController.checkAdminPermission = async (req, res, next) => {
  try {
    // token으로 찾아낸 userId 값을 authenticate에서 받아옴 !
    const { userId } = req;
    const user = await User.findById(userId);
    if (user.level !== 'admin') throw new Error('no permission');
    next();
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

module.exports = authController;
