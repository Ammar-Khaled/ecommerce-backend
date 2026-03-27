const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        userId: { type: Number, required: true, index: true },
        type: { type: String, required: true },
        subject: { type: String, default: null },
        message: { type: String, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
