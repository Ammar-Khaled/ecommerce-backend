const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, default: null },
        password: { type: String, default: null },
        role: {
            type: String,
            enum: ["customer", "seller", "admin"],
            default: "customer",
        },
        address: { type: String, default: null },
        paymentDetails: { type: [mongoose.Schema.Types.Mixed], default: [] },
        wishlist: { type: [Number], default: [] },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
