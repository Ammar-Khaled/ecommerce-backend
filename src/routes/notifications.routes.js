const express = require("express");
const notificationsController = require("../controllers/notifications.controller");

const router = express.Router();

router.get("/", notificationsController.listNotifications);
router.post("/email", notificationsController.sendEmailNotification);

module.exports = router;
