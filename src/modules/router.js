const express = require('express');
const productsRouter = require('./products/productsRouter');
const usersRouter = require('./users/usersRoutes');
const ordersRouter = require('./orders/ordersRoutes');
const { getTodayLogs } = require('./users/usersController');
const catchAsync = require('../utils/catchAsync');
const router = express.Router();


router.use('/products', productsRouter)
router.use('/auth', usersRouter);
router.use('/orders', ordersRouter)
router.get('/logs/today', catchAsync(getTodayLogs));

module.exports = router;