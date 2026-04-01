const { Product, Category } = require("../data/models");
const { getNextId } = require("../data/store");

const findProductById = async (id) => {
    return Product.findOne({ id: Number(id) }).lean();
};

const listProducts = async (req, res) => {
    const { q, categoryId, minPrice, maxPrice, sort } = req.query;
    const query = {};

    if (q) {
        const term = String(q).trim();
        query.$or = [
            { name: { $regex: term, $options: "i" } },
            { description: { $regex: term, $options: "i" } },
        ];
    }

    if (categoryId) {
        query.categoryId = Number(categoryId);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const sortMap = {
        "price-asc": { price: 1 },
        "price-desc": { price: -1 },
        "name-asc": { name: 1 },
    };

    try {
        const products = await Product.find(query)
            .sort(sortMap[sort] || { id: 1 })
            .lean();

        return res.json({
            count: products.length,
            products: products,
        });
    } catch (error) {
        res.status(500).json({ message: "Error applying filters" });
    }
};

const getProductById = async (req, res) => {
    const product = await findProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
};

const createProduct = async (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
    }
    const { name, price, categoryId, stock = 0, description } = req.body;
    
    const product = await Product.create({
        id: await getNextId(Product),
        name,
        description: description || "",
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