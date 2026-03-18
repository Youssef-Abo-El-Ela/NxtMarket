const Product = require("../products/productsModel");
const { OrderItem, Order } = require("./ordersModel");
const fs = require('fs');
const path = require('path');

const createOrder = async (req, res) => {
    const { requiredOrders } = req.body;
    const userId = req.user.id;
    let totalPrice = 0;
    let skuList = [];

    requiredOrders.forEach(reqOrder => {
        skuList.push(reqOrder.sku);
    })

    const newOrder = await Order.create({ userID: userId });

    let products = await Product.find({ sku: { $in: skuList } });

    const orderItems = await Promise.all(products.map(async (product) => {
        const qty = requiredOrders.find(reqOrder => reqOrder.sku === product.sku).qty;
        const orderItem = await OrderItem.create({
            orderID: newOrder.id,
            productSKU: product.sku,
            qty,
            price: product.price,
            title: product.title
        });
        totalPrice += product.price * qty;
        return orderItem;
    }));

    await Promise.all(products.map(async (product) => {
        await Product.findOneAndUpdate({ sku: product.sku }, { $inc: { stock: -requiredOrders.find(reqOrder => reqOrder.sku === product.sku).qty } });
    }));

    newOrder.total = totalPrice;
    await newOrder.save();

    res.status(201).json({ order: newOrder, items: orderItems, total: totalPrice, message: "Order created successfully" });
}

const getOrdersUser = async (req, res) => {
    const userId = req.user.id;
    const orders = await Order.findAll({ where: { userID: userId }, include: [{ model: OrderItem, as: 'items' }] });
    res.status(200).json({ orders, message: "Orders fetched successfully" });
}

const getOrdersAdmin = async (req, res) => {
    const orders = await Order.findAll({ include: [{ model: OrderItem, as: 'items' }] });
    res.status(200).json({ orders, message: "Orders fetched successfully" });
}

const getOrderById = async (req, res) => {
    const orderId = req.params.id;
    const order = await Order.findOne({ where: { id: orderId }, include: [{ model: OrderItem, as: 'items' }] });
    res.status(200).json({ order, message: "Order fetched successfully" });
}

const updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    order.status = status;
    req.io.to(`order:${orderId}`).emit('order_status_changed', {
        orderId,
        status,
        message: 'Order status updated successfully'
    });

    await order.save();

    res.status(200).json({ order, message: "Order status updated successfully" });
}

const getOrderPageById = async (req, res) => {
    const orderId = req.params.id;
    const order = await Order.findOne({ where: { id: orderId }, include: [{ model: OrderItem, as: 'items' }] });
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    let orderPageHtml = await fs.promises.readFile(path.join(__dirname, '..', '..', '..', 'public', 'templates', 'order.html'), 'utf-8');
    orderPageHtml = orderPageHtml.replace('{{ORDER_ID}}', String(order.id));
    orderPageHtml = orderPageHtml.replace('{{ORDER_STATUS}}', String(order.status || 'pending'));

    res.send(orderPageHtml);
}


module.exports = {
    createOrder,
    getOrdersUser,
    getOrdersAdmin,
    getOrderById,
    updateOrderStatus,
    getOrderPageById
}