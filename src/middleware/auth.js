const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');


const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        const err = new Error('Access denied. No token provided.');
        err.statusCode = 401;
        throw err;
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        const err = new Error('Invalid token.');
        err.statusCode = 400;
        throw err;
    }
};

module.exports = auth;