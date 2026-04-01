const express = require("express");
const sellerController = require("../controllers/seller.controller");
const validateRequest = require("../middlewares/validateRequest");
const { sellerSchemas } = require("../validation/schemas");

const router = express.Router();

router.post("/register", validateRequest({ body: sellerSchemas.register }), sellerController.register);
router.get("/me/profile", sellerController.getProfile);
router.patch("/me/profile", validateRequest({ body: sellerSchemas.profileUpdate }), sellerController.updateProfile);
router.get("/me/products", sellerController.getProducts);
router.post("/me/products", validateRequest({ body: sellerSchemas.createProduct }), sellerController.createProduct);
router.patch(
    "/me/products/:id",
    validateRequest({ params: sellerSchemas.productIdParam, body: sellerSchemas.updateProduct }),
    sellerController.updateProduct
);
router.get("/me/orders", sellerController.getOrders);
router.get("/me/earnings", sellerController.getEarnings);

module.exports = router;
