const mongoose = require("mongoose");
const seedDatabase = require("../data/seed");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce";

const connectDatabase = async () => {
    await mongoose.connect(MONGO_URI);
    await seedDatabase();
    console.log(`MongoDB connected`);
};

module.exports = connectDatabase;
