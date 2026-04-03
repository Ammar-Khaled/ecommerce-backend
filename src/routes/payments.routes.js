const express = require("express");
const paymentsController = require("../controllers/payments.controller");
const validateRequest = require("../middlewares/validateRequest");
const { paymentSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/methods", paymentsController.getMethods);
router.post("/intent", validateRequest({ body: paymentSchemas.createIntent }), paymentsController.createIntent);
router.post("/webhook", paymentsController.webhook);
router.get("/status/:orderId", validateRequest({ params: paymentSchemas.orderIdParam }), paymentsController.getPaymentStatus);
router.post(
    "/wallet/confirm",
    validateRequest({ body: paymentSchemas.confirmWallet }),
    paymentsController.confirmWallet
);
module.exports = router;