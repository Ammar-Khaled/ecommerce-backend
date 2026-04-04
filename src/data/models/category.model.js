const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        imageUrl: { type: String, default: null },
        imageFileId: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
