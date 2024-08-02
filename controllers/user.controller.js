const User = require('../models/User');
const bcrypt = require('bcryptjs');

const userController = {};

userController.createUser = async (req, res) => {
  try {
    let { email, password, name, level } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new Error('이미 가입된 유저입니다 !');
    }
    const salt = await bcrypt.genSaltSync(10);
    password = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password,
      name,
      level: level ? level : 'customer',
    });
    await newUser.save();
    return res.status(200).json({ status: 'success !' });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

// userController.getUser = async (req, res) => {
//   try {
//     const { userId } = req;
//     const user = await User.findById(userId);
//     if (user) {
//       return res.status(200).json({ status: 'success', user });
//     }
//     throw new Error('Invalid token');
//   } catch (error) {
//     res.status(400).json({ status: 'error', error: error.message });
//   }
// };

// 어세스토큰 검증 후 사용자 정보를 반환하는 엔드포인트
userController.getUserInfo = async (req, res) => {
  try {
    // req.userId는 auth.authenticate에서 설정된 사용자 ID
    const user = await User.findById(req.userId);
    if (!user)
      return res.status(404).json({ status: 'fail', error: 'User not found' });

    res.status(200).json({ status: 'success', user });
  } catch (error) {
    res.status(500).json({ status: 'fail', error: error.message });
  }
};

module.exports = userController;
