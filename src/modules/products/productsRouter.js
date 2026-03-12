const express = require('express');
const { createProduct, getProductById, getProducts, updateProduct, deleteProduct } = require('./productsController');
const catchAsync = require('../../utils/catchAsync');
const productsRouter = express.Router();

productsRouter.post('/', catchAsync(createProduct));
productsRouter.get('/:id', catchAsync(getProductById));
productsRouter.get('/', catchAsync(getProducts));
productsRouter.put('/:id', catchAsync(updateProduct));
productsRouter.delete('/:id', catchAsync(deleteProduct));

module.exports = productsRouter;