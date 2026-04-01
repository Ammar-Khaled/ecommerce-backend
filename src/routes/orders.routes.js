const express = require("express");
const ordersController = require("../controllers/orders.controller");

const router = express.Router();

router.get("/", ordersController.listOrders);
router.get("/:id", ordersController.getOrderById);
router.patch("/:id/status", ordersController.updateOrderStatus);

module.exports = router;
