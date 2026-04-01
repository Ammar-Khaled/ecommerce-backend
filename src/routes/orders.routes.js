const express = require("express");
const ordersController = require("../controllers/orders.controller");
const validateRequest = require("../middlewares/validateRequest");
const { orderSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/", ordersController.listOrders);
router.get("/:id", validateRequest({ params: orderSchemas.idParam }), ordersController.getOrderById);
router.patch(
    "/:id/status",
    validateRequest({ params: orderSchemas.idParam, body: orderSchemas.updateStatusBody }),
    ordersController.updateOrderStatus
);
router.patch("/:id/cancel", validateRequest({ params: orderSchemas.idParam }), ordersController.cancelOrder);

module.exports = router;