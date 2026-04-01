const { Product } = require("../data/models");

const listProducts = async (req, res) => {
    try {
        const products = await Product.find({}).lean();
        res.json({ products });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

const getProductById = async (req, res) => {
    res.json({ message: "Get product by ID placeholder" });
};

const createProduct = async (req, res) => {
    res.json({ message: "Create product placeholder" });
};

module.exports = {
    listProducts,
    getProductById,
    createProduct
};