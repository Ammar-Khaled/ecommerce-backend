const { Notification, User } = require("../data/models");
const { getNextId } = require("../data/store");

const listNotifications = async (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const notifications = await Notification.find({ userId: req.actor.userId }).lean();
    return res.json({ count: notifications.length, notifications });
};

const sendEmailNotification = async (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated || req.actor.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }

    const { userId, subject, message } = req.body;
    const user = await User.findOne({ id: Number(userId) }).lean();

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const notification = await Notification.create({
        id: await getNextId(Notification),
        userId: user.id,
        type: "email",
        subject: subject || "Ecommerce Notification",
        message: message || "This is a mock email notification.",
        createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
        message: "Notification queued (mock)",
        notification,
    });
};

module.exports = {
    listNotifications,
    sendEmailNotification,
};
