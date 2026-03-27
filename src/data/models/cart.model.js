const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
    {
        productId: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        ownerKey: { type: String, required: true, unique: true, index: true },
        items: { type: [cartItemSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
