const express = require("express");
const notificationsController = require("../controllers/notifications.controller");
const validateRequest = require("../middlewares/validateRequest");
const { notificationSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/", notificationsController.listNotifications);
router.post(
    "/email",
    validateRequest({ body: notificationSchemas.sendEmailNotification }),
    notificationsController.sendEmailNotification
);

module.exports = router;
