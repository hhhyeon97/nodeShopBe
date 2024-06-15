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

// 공지사항 보여주기
router.get('/', noticeController.getNotices);

module.exports = router;
