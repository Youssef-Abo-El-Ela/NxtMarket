const { sequelize } = require('../../config/db.sql');

const Order = sequelize.define('Order', {
    id: {
        type: sequelize.Sequelize.UUID,
        defaultValue: sequelize.Sequelize.UUIDV4,
        primaryKey: true
    },
    userID: {
        type: sequelize.Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: sequelize.Sequelize.ENUM('PENDING', 'PAID', 'SHIPPED', 'CANCELLED'),
        defaultValue: 'PENDING'
    },
    total: {
        type: sequelize.Sequelize.FLOAT,
        defaultValue: 0.0
    }
});

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: sequelize.Sequelize.UUID,
        defaultValue: sequelize.Sequelize.UUIDV4,
        primaryKey: true
    },
    orderID: {
        type: sequelize.Sequelize.UUID,
        allowNull: false
    },
    productSKU: {
        type: sequelize.Sequelize.STRING,
        allowNull: false
    },
    qty: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false
    },
    price: {
        type: sequelize.Sequelize.FLOAT,
        allowNull: false
    },
    title: {
        type: sequelize.Sequelize.STRING,
        allowNull: false
    }
});

Order.hasMany(OrderItem, { foreignKey: 'orderID', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderID' });

module.exports = { Order, OrderItem };