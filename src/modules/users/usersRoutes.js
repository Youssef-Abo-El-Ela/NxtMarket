const express = require('express');
const { register, login } = require('./usersController');
const usersRouter = express.Router();

// Define user routes here
usersRouter.post('/register', register);
usersRouter.post('/login', login);

module.exports = usersRouter;