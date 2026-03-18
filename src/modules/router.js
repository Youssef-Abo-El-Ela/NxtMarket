const express = require('express');
const productsRouter = require('./products/productsRouter');
const usersRouter = require('./users/usersRoutes');
const ordersRouter = require('./orders/ordersRoutes');
const router = express.Router();


router.use('/products', productsRouter)
router.use('/auth', usersRouter);
router.use('/orders', ordersRouter)

module.exports = router;