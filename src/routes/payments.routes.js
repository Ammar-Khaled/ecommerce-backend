const express = require("express");
const paymentsController = require("../controllers/payments.controller");
const validateRequest = require("../middlewares/validateRequest");
const { paymentSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/methods", paymentsController.getMethods);
router.post("/intent", validateRequest({ body: paymentSchemas.createIntent }), paymentsController.createIntent);
router.post("/webhook", validateRequest({ body: paymentSchemas.webhookBody }), paymentsController.webhook);
router.get("/status/:orderId", validateRequest({ params: paymentSchemas.orderIdParam }), paymentsController.getPaymentStatus);

module.exports = router;