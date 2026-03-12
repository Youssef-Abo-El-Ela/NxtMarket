const express = require('express');
const productsRouter = require('./products/productsRouter');
const usersRouter = require('./users/usersRoutes');
const router = express.Router();


router.use('/products', productsRouter)
router.use('/auth', usersRouter);

module.exports = router;