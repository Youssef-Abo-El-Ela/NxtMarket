const { server, io } = require('./app')
const { port } = require('./config/env')
const setupOrdersSocket = require('./sockets/ordersSocket')

// Setup sockets
setupOrdersSocket(io);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})