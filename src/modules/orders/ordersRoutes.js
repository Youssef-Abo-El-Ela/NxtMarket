const express = require('express');
const { default: roleChecker } = require('../../middleware/roleChecker');
const { ROLE } = require('../../utils/enums');
const catchAsync = require('../../utils/catchAsync');
const { createOrder, getOrdersUser, getOrdersAdmin, getOrderById } = require('./ordersController');
const auth = require('../../middleware/auth');
const ordersRouter = express.Router()

ordersRouter.post("/", auth ,roleChecker([ROLE.USER]), catchAsync(createOrder));
ordersRouter.get("/user", auth , roleChecker([ROLE.USER]), catchAsync(getOrdersUser));
ordersRouter.get("/admin", auth , roleChecker([ROLE.ADMIN]), catchAsync(getOrdersAdmin));
ordersRouter.get("/:id", auth , roleChecker([ROLE.USER, ROLE.ADMIN]), catchAsync(getOrderById));


module.exports = ordersRouter