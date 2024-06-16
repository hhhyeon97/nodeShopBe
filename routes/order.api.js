const express = require('express');
const authController = require('../controllers/auth.controller');
const orderController = require('../controllers/order.controller');
const router = express.Router();

router.post('/', authController.authenticate, orderController.createOrder);
router.get('/', authController.authenticate, orderController.getOrder);
router.get('/list', authController.authenticate, orderController.getOrderList);
router.put(
  '/:id',
  authController.authenticate,
  authController.checkAdminPermission,
  orderController.updateOrder,
);

router.get('/total', orderController.totalSales);
router.get('/orders-by-date', orderController.getOrdersByDate);
module.exports = router;
