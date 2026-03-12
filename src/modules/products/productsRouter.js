const express = require('express');
const { createProduct, getProductById, getProducts, updateProduct, deleteProduct, getProductBySKU, addProductImage, importProducts, addReview, getCatalogPage, getProductPageBySKU } = require('./productsController');
const catchAsync = require('../../utils/catchAsync');
const { uploadCSV, uploadImages } = require('../../utils/multer');
const auth = require('../../middleware/auth');
const { ROLE } = require('../../utils/enums');
const { default: roleChecker } = require('../../middleware/roleChecker');
const productsRouter = express.Router();

productsRouter.post('/', auth, roleChecker([ROLE.ADMIN, ROLE.VENDOR]), catchAsync(createProduct));
productsRouter.post('/importCSV', auth, roleChecker([ROLE.ADMIN, ROLE.VENDOR]), uploadCSV.single('csv'), catchAsync(importProducts));
productsRouter.get('/sku/:sku', catchAsync(getProductBySKU));
productsRouter.get('/', catchAsync(getProducts));
productsRouter.get('/catalog', catchAsync(getCatalogPage));
productsRouter.get('/sku/:sku/page', catchAsync(getProductPageBySKU));
productsRouter.get('/:id', catchAsync(getProductById));
productsRouter.patch('/:id/images', auth, roleChecker([ROLE.ADMIN, ROLE.VENDOR]), uploadImages.array('images', 5), catchAsync(addProductImage));
productsRouter.patch('/:id/review', auth, roleChecker([ROLE.USER]), catchAsync(addReview));
productsRouter.put('/:id', auth, roleChecker([ROLE.ADMIN, ROLE.VENDOR]), catchAsync(updateProduct));
productsRouter.delete('/:id', auth, roleChecker([ROLE.ADMIN, ROLE.VENDOR]), catchAsync(deleteProduct));

module.exports = productsRouter;