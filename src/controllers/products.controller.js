const { Product, Category } = require("../data/models");
const { getNextId } = require("../data/store");

const findProductById = async (id) => {
    return Product.findOne({ id: Number(id) }).lean();
};

const listProducts = async (req, res) => {
    try {
        const products = await Product.find({}).lean();
        return res.json({ count: products.length, products });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving products" });
    }
};

const getProductById = async (req, res) => {
    const product = await findProductById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
};

const createProduct = async (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const { name, price, categoryId, stock = 0 } = req.body;
    
    if (!name || price === undefined || !categoryId) {
        return res.status(400).json({ message: "name, price, and categoryId are required" });
    }

    const product = await Product.create({
        id: await getNextId(Product),
        name,
        price: Number(price),
        categoryId: Number(categoryId),
        stock: Number(stock),
        sellerId: req.actor.userId,
    });

    return res.status(201).json({ message: "Product created", product });
};

module.exports = {
    listProducts,
    getProductById,
    createProduct
};