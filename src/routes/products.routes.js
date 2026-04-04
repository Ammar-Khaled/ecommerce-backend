const express = require("express");
const productsController = require("../controllers/products.controller");
const validateRequest = require("../middlewares/validateRequest");
const { productSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/categories", productsController.getCategories);
router.get("/top", productsController.getTopProducts);
router.get("/", validateRequest({ query: productSchemas.listQuery }), productsController.listProducts);
router.get("/:id", validateRequest({ params: productSchemas.idParam }), productsController.getProductById);
router.post("/", validateRequest({ body: productSchemas.createProduct }), productsController.createProduct);
router.patch("/:id/stock", validateRequest({ params: productSchemas.idParam, body: productSchemas.updateStock }), productsController.updateProductStock);
router.patch("/:id/activate", validateRequest({ params: productSchemas.idParam }), productsController.activateProduct);
router.patch("/:id/deactivate", validateRequest({ params: productSchemas.idParam }), productsController.deactivateProduct);
router.get("/:id/reviews", validateRequest({ params: productSchemas.idParam }), productsController.getProductReviews);
router.post("/:id/reviews", validateRequest({ params: productSchemas.idParam, body: productSchemas.reviewBody }), productsController.createProductReview);
router.patch("/:id/reviews/:reviewId", validateRequest({ params: productSchemas.reviewIdParam, body: productSchemas.reviewUpdateBody }), productsController.updateProductReview);
router.delete("/:id/reviews/:reviewId", validateRequest({ params: productSchemas.reviewIdParam }), productsController.deleteProductReview);
router.delete("/:id", validateRequest({ params: productSchemas.idParam }), productsController.deleteProduct);

module.exports = router;
