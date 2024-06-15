const express = require('express');
const noticeController = require('../controllers/notice.controller');
const authController = require('../controllers/auth.controller');
const router = express.Router();

// 공지글 생성
router.post(
  '/',
  authController.authenticate,
  authController.checkAdminPermission,
  noticeController.createNotice,
);

module.exports = router;
