const express = require("express");
const paymentsController = require("../controllers/payments.controller");

const router = express.Router();

router.get("/methods", paymentsController.getMethods);
router.post("/intent", paymentsController.createIntent);
router.post("/webhook", paymentsController.webhook);
router.get("/status/:orderId", paymentsController.getPaymentStatus);

module.exports = router;