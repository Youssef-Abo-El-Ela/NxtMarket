const { server, io } = require('./app')
const { port } = require('./config/env');
const { createHealthServer } = require('./core-http/health');
const setupOrdersSocket = require('./sockets/ordersSocket')

// Setup sockets
setupOrdersSocket(io);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

createHealthServer();