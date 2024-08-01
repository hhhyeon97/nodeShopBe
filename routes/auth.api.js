const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.loginWithEmail);
router.post('/google', authController.loginWithGoogle);
// sdk
router.post('/kakao', authController.loginWithKakao);
// rest api
router.get('/kakao/callback', authController.kakaoCallback);
router.get('/naver/callback', authController.naverCallback);

router.post('/refresh-token', authController.refreshToken);

module.exports = router;
