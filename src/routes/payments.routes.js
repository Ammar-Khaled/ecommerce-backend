const express = require("express");
const paymentsController = require("../controllers/payments.controller");

const router = express.Router();

router.get("/methods", paymentsController.getMethods);
router.post("/intent", paymentsController.createIntent);

module.exports = router;
