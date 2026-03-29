const mongoose = require("mongoose");

const revokedTokenSchema = new mongoose.Schema(
    {
        token: { type: String, required: true, index: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("RevokedToken", revokedTokenSchema);
