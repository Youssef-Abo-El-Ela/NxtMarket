const path = require('path');
const { importProductsCSV } = require('../../utils/csvParser');
const Product = require('./productsModel');
const fs = require('fs')

const createProduct = async (req, res) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
}

const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json(product);
}

const getProductBySKU = async (req, res) => {
    const product = await Product.findOne({ sku: req.params.sku });
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json(product);
}

const getProducts = async (req, res) => {
    const products = await Product.find();
    let filteredProducts = products;
    const { title, category, limit = 10, page = 1 } = req.query;

    if (title) {
        filteredProducts = filteredProducts.filter(product => product.title.toLowerCase().includes(title.toLowerCase()));
    }
    if (category) {
        filteredProducts = filteredProducts.filter(product => product.categories.some(cat => cat.toLowerCase().includes(category.toLowerCase())));
    }
    filteredProducts = [...new Set(filteredProducts)];
    filteredProducts = filteredProducts.slice((page - 1) * limit, page * limit);
    res.status(200).json(filteredProducts);
}

const updateProduct = async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json(product);
}

const deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }
    res.status(200).json({ message: 'Product deleted successfully' });
}

const addProductImage = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }
    product.images = req.files.map((img) => img.filename);
    await product.save();
    res.status(200).json(product);
}

const importProducts = async (req, res) => {
    if (!req.file) {
        const err = new Error('CSV file is required');
        err.statusCode = 400;
        throw err;
    }
    const filePath = req.file.path;
    const result = await importProductsCSV(filePath, Product);
    res.status(200).json(result);
};

const addReview = async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }
    product.reviews.push({ userID: req.user.id, rating, comment });
    await product.save();
    res.status(200).json(product);
}

const getCatalogPage = async (req, res) => {
    let catalogHtml = await fs.promises.readFile(path.join(__dirname, '..', '..', '..', 'public', 'templates', 'catalog.html'), 'utf-8');
    catalogHtml = catalogHtml.replace('{{SEARCH_VALUE}}', req.query.search || '');
    const products = await Product.find();
    const productListHtml =
        products.map(product => `<li style="border:1px solid #eee;border-radius:12px;padding:12px;">
        <a href="/api/products/sku/${product.sku}/page" style="text-decoration:none;color:inherit;">
            <img src="/images/${product.images[0]}" alt="${product.title}" style="width:100%;height:160px;object-fit:cover;border-radius:8px"/>
            <h3 style="margin:0.5rem 0 0.25rem 0;">${product.title}</h3>
            <p style="margin:0;color:#444;">$${product.price.toFixed(2)} · Stock: ${product.stock}</p>
        </a>
        </li>`).join('');

    catalogHtml = catalogHtml.replace('{{PRODUCT_LIST}}', productListHtml);
    res.send(catalogHtml);
}

const getProductPageBySKU = async (req, res) => {
    const product = await Product.findOne({ sku: req.params.sku });
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }
    const productPageHtml = await fs.promises.readFile(path.join(__dirname, '..', '..', '..', 'public', 'templates', 'product.html'), 'utf-8');
    const renderedHtml = productPageHtml
        .replaceAll('{{TITLE}}', product.title)
        .replaceAll('{{DESCRIPTION}}', product.description)
        .replaceAll('{{PRICE}}', product.price.toFixed(2))
        .replaceAll('{{STOCK}}', product.stock)
        .replaceAll('{{IMAGE_URL}}', `/images/${product.images[0]}`)
        .replaceAll('{{SKU}}', product.sku)
        .replaceAll('{{REVIEWS}}', product.reviews ? product.reviews.map(review => ` <li style="padding:8px 0;border-bottom:1px solid #eee;">
        <span>${review.rating}★</span> — <span>${review.comment}</span>
        </li>`).join('') : '<p>No reviews yet.</p>');

    res.send(renderedHtml);
};


module.exports = {
    createProduct,
    getProductById,
    getProductBySKU,
    getProducts,
    updateProduct,
    deleteProduct,
    addProductImage,
    importProducts,
    addReview,
    getCatalogPage,
    getProductPageBySKU
}