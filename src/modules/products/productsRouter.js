const express = require('express');
const { createProduct, getProductById, getProducts, updateProduct, deleteProduct, getProductBySKU, addProductImage, importProducts, addReview, getCatalogPage, getProductPageBySKU } = require('./productsController');
const catchAsync = require('../../utils/catchAsync');
const { uploadCSV, uploadImages } = require('../../utils/multer');
const productsRouter = express.Router();

productsRouter.post('/', catchAsync(createProduct));
productsRouter.post('/importCSV', uploadCSV.single('csv'), catchAsync(importProducts));
productsRouter.get('/sku/:sku', catchAsync(getProductBySKU));
productsRouter.get('/', catchAsync(getProducts));
productsRouter.get('/catalog', catchAsync(getCatalogPage));
productsRouter.get('/sku/:sku/page', catchAsync(getProductPageBySKU));
productsRouter.get('/:id', catchAsync(getProductById));
productsRouter.patch('/:id/images', uploadImages.array('images', 5), catchAsync(addProductImage));
productsRouter.patch('/:id/review', catchAsync(addReview));
productsRouter.put('/:id', catchAsync(updateProduct));
productsRouter.delete('/:id', catchAsync(deleteProduct));

module.exports = productsRouter;