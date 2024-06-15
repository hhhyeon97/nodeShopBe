const Notice = require('../models/Notice');

const noticeController = {};

noticeController.createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    // 필수 필드인 title과 content가 제대로 들어왔는지 확인
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: '제목과 내용은 필수 입력 사항입니다.' });
    }
    // 새로운 공지사항 객체 생성
    const newNotice = new Notice({
      title,
      content,
    });
    // db에 저장
    await newNotice.save();
    res.status(200).json({ status: 'success', data: newNotice });
  } catch (error) {
    res
      .status(500)
      .json({ message: '서버 오류로 공지사항을 생성할 수 없습니다.' });
  }
};

module.exports = noticeController;
