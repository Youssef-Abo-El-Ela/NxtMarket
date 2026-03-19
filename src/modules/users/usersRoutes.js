const express = require('express');
const { register, login, resetPasswordRequest, resetPassword } = require('./usersController');
const auth = require('../../middleware/auth');
const catchAsync = require('../../utils/catchAsync');
const usersRouter = express.Router();

// Define user routes here
usersRouter.post('/register', catchAsync(register));
usersRouter.post('/login', catchAsync(login));
usersRouter.post('/reset-password-request', auth ,catchAsync(resetPasswordRequest));
usersRouter.patch('/reset-password', auth ,catchAsync(resetPassword));

module.exports = usersRouter;