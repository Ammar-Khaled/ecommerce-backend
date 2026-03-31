const express = require("express");
const sellerController = require("../controllers/seller.controller");

const router = express.Router();

router.post("/register", sellerController.register);
router.get("/me/profile", sellerController.getProfile);
router.patch("/me/profile", sellerController.updateProfile);
router.get("/me/products", sellerController.getProducts);
router.post("/me/products", sellerController.createProduct);
router.patch("/me/products/:id", sellerController.updateProduct);
router.get("/me/orders", sellerController.getOrders);
router.get("/me/earnings", sellerController.getEarnings);

module.exports = router;
