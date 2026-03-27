const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: Number, required: true },
        sellerId: { type: Number, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        lineTotal: { type: Number, required: true, min: 0 },
        availableStock: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        userId: { type: Number, default: null, index: true },
        guestInfo: { type: mongoose.Schema.Types.Mixed, default: null },
        ownerKey: { type: String, required: true, index: true },
        status: {
            type: String,
            enum: ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"],
            default: "placed",
        },
        shippingStatus: { type: String, default: "pending" },
        paymentMethod: {
            type: String,
            enum: ["card", "paypal", "cod", "wallet"],
            default: "cod",
        },
        shippingAddress: { type: mongoose.Schema.Types.Mixed, default: null },
        currency: { type: String, default: "USD" },
        subtotal: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        shipping: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 },
        items: { type: [orderItemSchema], default: [] },
        createdAt: { type: String, default: () => new Date().toISOString() },
        updatedAt: { type: String, default: () => new Date().toISOString() },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
