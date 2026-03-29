const express = require("express");
const cartController = require("../controllers/cart.controller");

const router = express.Router();

router.get("/", cartController.getCart);
router.post("/", cartController.addItemHandler);
router.post("/items", cartController.addItemHandler);
router.patch("/items/:productId", cartController.updateItemQuantity);
router.delete("/:productId", cartController.removeItem);
router.get("/summary", cartController.getCartSummary);
router.post("/checkout", cartController.checkout);

module.exports = router;