const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.loginWithEmail);
router.post('/google', authController.loginWithGoogle);
// sdk
router.post('/kakao', authController.loginWithKakao);
// rest api
router.get('/kakao/callback', authController.kakaoCallback);

module.exports = router;
