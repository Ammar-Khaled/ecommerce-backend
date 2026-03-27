const mongoose = require("mongoose");

const sellerProfileSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        userId: { type: Number, required: true, unique: true, index: true },
        storeName: { type: String, required: true },
        payoutMethod: { type: String, default: "bank-transfer" },
        isApproved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SellerProfile", sellerProfileSchema);
