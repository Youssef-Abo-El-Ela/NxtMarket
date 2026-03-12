const express = require('express');
const path = require('path');
const router = require('./modules/router');
const errorHandler = require('./middleware/errorHandler');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api', router);
app.use(errorHandler);

module.exports = { app };