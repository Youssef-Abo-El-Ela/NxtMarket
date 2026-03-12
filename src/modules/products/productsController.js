const Product = require('./productsModel');


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

module.exports = {
    createProduct,
    getProductById,
    getProductBySKU,
    getProducts,
    updateProduct,
    deleteProduct,
    addProductImage
}