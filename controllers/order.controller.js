const orderController = {};
const Order = require('../models/Order');
const productController = require('./product.controller');
// const { randomStringGenerator } = require('../utils/randomStringGenerator');
const { generateOrderNumber } = require('../utils/randomStringGenerator');

orderController.createOrder = async (req, res) => {
  try {
    // 프론트엔드에서 데이터 보낸거 받아온다.
    // userId, totalPrice, shipTo, contact, orderList
    const { userId } = req;
    const { shipTo, contact, totalPrice, orderList } = req.body;
    // 재고 확인 & 재고 업데이트
    const insufficientStockItems = await productController.checkItemListStock(
      orderList,
    );

    // 재고가 충분하지 않은 아이템이 있었다 - > 에러
    if (insufficientStockItems.length > 0) {
      const errorMessage = insufficientStockItems.reduce(
        (total, item) => (total += item.message),
        '',
      );
      throw new Error(errorMessage);
    }
    // 통과했을 때는 order를 만들자 !
    const newOrder = new Order({
      userId,
      totalPrice,
      shipTo,
      contact,
      items: orderList,
      orderNum: generateOrderNumber(),
    });
    await newOrder.save();
    // save 후에 카트를 비워주자 !

    res.status(200).json({ status: 'success', orderNum: newOrder.orderNum });
  } catch (error) {
    res.status(400).json({ status: 'fail', error: error.message });
  }
};

orderController.getOrder = async (req, res) => {
  try {
    const { userId } = req;

    // 인증되지 않은 요청 처리
    if (!userId) {
      return res
        .status(401)
        .json({ status: 'fail', message: '로그인 후 이용 가능합니다.' });
    }

    // 페이지 번호와 페이지 크기 추출 (기본값: 1페이지 당 5개 항목)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // db에서 유저 주문 목록 가져오기
    const orders = await Order.find({ userId })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'items',
        populate: {
          path: 'productId',
          model: 'Product',
        },
      });

    // 전체 주문 수
    const totalOrders = await Order.countDocuments({ userId });

    // 응답 데이터 구성
    const response = {
      status: 'success',
      data: orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    };
    res.status(200).json({ status: 'success', response });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: '주문 내역을 가져오는 도중 오류가 발생했습니다.',
      error: error.message,
    });
  }
};

module.exports = orderController;
