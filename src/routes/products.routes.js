const express = require("express");
const productsController = require("../controllers/products.controller");

const router = express.Router();

router.get("/categories", productsController.getCategories);
router.get("/", productsController.listProducts);
router.get("/:id", productsController.getProductById);
router.post("/", productsController.createProduct);
router.patch("/:id/stock", productsController.updateProductStock);
router.get("/:id/reviews", productsController.getProductReviews);
router.post("/:id/reviews", productsController.createProductReview);

module.exports = router;
