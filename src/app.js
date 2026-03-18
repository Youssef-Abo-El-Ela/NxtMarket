const express = require('express');
const path = require('path');
const http = require('http')
const {Server} = require('socket.io')
const app = express();
const ioMiddleware = require('./middleware/ioMiddleware');

// Websocket setup
const server = http.createServer(app);
const io = new Server(server);


const router = require('./modules/router');
const errorHandler = require('./middleware/errorHandler');


// Middleware
app.use(express.json());
app.use(ioMiddleware(io));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api', router);
app.use(errorHandler);

module.exports = { app, io, server };