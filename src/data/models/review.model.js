const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        productId: { type: Number, required: true, index: true },
        userId: { type: Number, required: true, index: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
