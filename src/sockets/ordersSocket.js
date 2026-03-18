const setupOrdersSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected to orders socket');

        socket.on('join_order_room', (orderId) => {
            if (!orderId) return;
            socket.join(`order:${orderId}`);
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected from orders socket');
        });
    });
};

module.exports = setupOrdersSocket;