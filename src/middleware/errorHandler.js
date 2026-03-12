const { logger } = require("../config/logger");

const errorHandler = (err, req, res, next) => {
    if(!err.message) {
        err.message = 'An unexpected error occurred!';
    }
    if(!err.statusCode) {
        err.statusCode = 500;
    }
    console.error(err.stack);
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`);
    res.status(err.statusCode).json({ message: err.message });
};

module.exports = errorHandler;