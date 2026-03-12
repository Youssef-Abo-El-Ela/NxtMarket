const mongoose = require('../../config/db.mongo');

const productSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    vendorID: {
        type: String,
        required: false
    },
    images: {
        type: [String],
        required: false
    },
    categories: {
        type: [String],
        required: true
    },
    embeddedReviews: {
        type: [
            {
                userID: String,
                rating: Number,
                comment: String,
                date: { type: Date, default: Date.now }
            }
        ],
        required: false
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;