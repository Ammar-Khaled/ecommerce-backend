const express = require("express");
const cartController = require("../controllers/cart.controller");
const validateRequest = require("../middlewares/validateRequest");
const { cartSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/", validateRequest({ query: cartSchemas.guestQuery }), cartController.getCart);
router.post("/", validateRequest({ body: cartSchemas.addItemBody }), cartController.addItemHandler);
router.post("/items", validateRequest({ body: cartSchemas.addItemBody }), cartController.addItemHandler);
router.patch(
    "/items/:productId",
    validateRequest({ params: cartSchemas.updateItemParams, body: cartSchemas.updateItemBody }),
    cartController.updateItemQuantity
);
router.delete("/:productId", validateRequest({ params: cartSchemas.removeItemParams }), cartController.removeItem);
router.get("/summary", validateRequest({ query: cartSchemas.guestQuery }), cartController.getCartSummary);
router.post("/checkout", validateRequest({ body: cartSchemas.checkoutBody }), cartController.checkout);

module.exports = router;