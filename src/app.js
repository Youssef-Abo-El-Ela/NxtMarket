const express = require('express');
const router = require('./modules/router');
const errorHandler = require('./middleware/errorHandler');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api', router);
app.use(errorHandler);

module.exports = { app };