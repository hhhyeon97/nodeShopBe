const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authController = {};
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const axios = require('axios');
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const { KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI } = process.env;
const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, NAVER_REDIRECT_URI } =
  process.env;

authController.loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // 기존 코드 access token만 사용
        //const token = await user.generateToken();
        //return res.status(200).json({ status: 'success', user, token });
        // !! 업데이트 -> access and refresh tokens
        const { accessToken, refreshToken } = await user.generateTokens();
        return res
          .status(200)
          .json({ status: 'success', user, accessToken, refreshToken });
      }
    }
    throw new Error('이메일 혹은 비밀번호가 잘못되었습니다 !');
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

// !! 업데이트 : 리프레시 토큰을 사용하여 어세스 토큰을 갱신할 수 있는 엔드포인트 추가
authController.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new Error('Refresh token is required');

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET_KEY);
    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== refreshToken)
      throw new Error('Invalid refresh token');

    // 새 access token 발급
    const accessToken = await jwt.sign({ _id: user._id }, JWT_SECRET_KEY, {
      expiresIn: '10s',
    });
    // const accessToken = await user.generateToken();
    console.log('어세스토큰 다시 발급해주자고 !!!');
    res.status(200).json({ accessToken });
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

// kakao sdk

authController.loginWithKakao = async (req, res) => {
  const { token } = req.body;
  // console.log('토큰 확인', token);
  try {
    const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const kakaoProfile = kakaoResponse.data;
    console.log('프로필 확인', kakaoProfile);
    const { kakao_account, properties } = kakaoProfile;
    const email = kakao_account.email;
    const name = properties.nickname;

    let user = await User.findOne({ email });
    if (!user) {
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

    const localToken = await user.generateToken();
    res.status(200).json({ status: 'success', user, token: localToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '카카오 로그인에 실패하였습니다.' });
  }
};

// kakao rest api

authController.kakaoCallback = async (req, res) => {
  const { code } = req.query;
  try {
    console.log('Received authorization code:', code);

    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          client_id: KAKAO_REST_API_KEY,
          redirect_uri: KAKAO_REDIRECT_URI,
          code,
        },
      },
    );

    console.log('Token response:', tokenResponse.data);

    const { access_token } = tokenResponse.data;

    const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log('User info response:', kakaoResponse.data);

    const kakaoProfile = kakaoResponse.data;
    const { kakao_account, properties } = kakaoProfile;
    const email = kakao_account.email;
    const name = properties.nickname;

    let user = await User.findOne({ email });
    if (!user) {
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

    const localToken = await user.generateToken();
    res.status(200).json({ status: 'success', user, token: localToken });
  } catch (error) {
    console.error('Error during Kakao callback:', error);
    res.status(500).json({
      error: '카카오 로그인에 실패하였습니다.',
      details: error.message,
    });
  }
};

// naver rest api

authController.naverCallback = async (req, res) => {
  const { code, state } = req.query;
  try {
    const tokenResponse = await axios.post(
      `https://nid.naver.com/oauth2.0/token`,
      null,
      {
        params: {
          grant_type: 'authorization_code',
          client_id: NAVER_CLIENT_ID,
          client_secret: NAVER_CLIENT_SECRET,
          redirect_uri: NAVER_REDIRECT_URI,
          code,
          state,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    const { access_token } = tokenResponse.data;
    const naverResponse = await axios.get(
      'https://openapi.naver.com/v1/nid/me',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const naverProfile = naverResponse.data.response;
    const { email, nickname } = naverProfile;

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = '' + Math.floor(Math.random() * 1000000);
      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name: nickname,
        email,
        password: newPassword,
      });
      await user.save();
    }
    const localToken = await user.generateToken();
    res.status(200).json({ status: 'success', user, token: localToken });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
    console.log('에러', error.message);
  }
};

/* 기존 코드 
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
*/

// !! authenticate 미들웨어를 리프레시 토큰 방식에 맞게 업데이트
authController.authenticate = async (req, res, next) => {
  try {
    const tokenString = req.headers.authorization;
    if (!tokenString) throw new Error('Token not found');
    const token = tokenString.replace('Bearer ', '');
    const payload = jwt.verify(token, JWT_SECRET_KEY);
    req.userId = payload._id;
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
