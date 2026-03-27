const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, default: "USD" },
        categoryId: { type: Number, required: true, index: true },
        stock: { type: Number, default: 0, min: 0 },
        sellerId: { type: Number, required: true, index: true },
        images: { type: [String], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
