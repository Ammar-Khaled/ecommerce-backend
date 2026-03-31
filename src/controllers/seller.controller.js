const { SellerProfile, Product, Order, User, getNextId } = require("../data/store");

const requireSeller = (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        res.status(401).json({ message: "Authentication required" });
        return false;
    }

    if (!["seller", "admin"].includes(req.actor.role)) {
        res.status(403).json({ message: "Seller access required" });
        return false;
    }

    return true;
};

const register = async (req, res, next) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const { storeName, payoutMethod = "bank-transfer" } = req.body;

    if (!storeName) {
        return res.status(400).json({ message: "storeName is required" });
    }

    const existing = await SellerProfile.findOne({ userId: req.actor.userId }).lean();
    if (existing) {
        return res.status(409).json({ message: "Seller profile already exists", profile: existing });
    }

    await User.updateOne({ id: req.actor.userId }, { $set: { role: "seller" } });

    const profile = await SellerProfile.create({
        id: await getNextId(SellerProfile),
        userId: req.actor.userId,
        storeName,
        payoutMethod,
        isApproved: false,
    });

    return res.status(201).json({ message: "Seller registration submitted", profile });
};

const getProfile = async (req, res, next) => {
    if (!requireSeller(req, res)) {
        return;
    }

    const profile = await SellerProfile.findOne({ userId: req.actor.userId }).lean();
    if (!profile) {
        return res.status(404).json({ message: "Seller profile not found" });
    }

    return res.json(profile);
};

const updateProfile = async (req, res, next) => {
    if (!requireSeller(req, res)) {
        return;
    }

    const update = {};
    const { storeName, payoutMethod, isApproved } = req.body;

    if (storeName !== undefined) update.storeName = storeName;
    if (payoutMethod !== undefined) update.payoutMethod = payoutMethod;
    if (req.actor.role === "admin" && isApproved !== undefined) {
        update.isApproved = Boolean(isApproved);
    }

    const profile = await SellerProfile.findOneAndUpdate(
        { userId: req.actor.userId },
        { $set: update },
        { new: true }
    ).lean();

    if (!profile) {
        return res.status(404).json({ message: "Seller profile not found" });
    }

    return res.json({ message: "Seller profile updated", profile });
};

const getProducts = async (req, res, next) => {
    if (!requireSeller(req, res)) {
        return;
    }

    const products = await Product.find({ sellerId: req.actor.userId }).lean();
    return res.json({ count: products.length, products });
};

const createProduct = async (req, res, next) => {
    if (!requireSeller(req, res)) {
        return;
    }

    const { name, description, price, categoryId, stock = 0, images = [] } = req.body;

    if (!name || price === undefined || !categoryId) {
        return res.status(400).json({ message: "name, price, and categoryId are required" });
    }

    const product = await Product.create({
        id: await getNextId(Product),
        name,
        description: description || "",
        price: Number(price),
        currency: "USD",
        categoryId: Number(categoryId),
        stock: Number(stock),
        sellerId: req.actor.userId,
        images: Array.isArray(images) ? images : [],
    });

    return res.status(201).json({ message: "Product created", product });
};

const updateProduct = async (req, res, next) => {
    if (!requireSeller(req, res)) {
        return;
    }

    const product = await Product.findOne({ id: Number(req.params.id), sellerId: req.actor.userId });

    if (!product) {
        return res.status(404).json({ message: "Product not found for this seller" });
    }

    const { name, description, price, stock, images } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (images !== undefined && Array.isArray(images)) product.images = images;

    await product.save();

    return res.json({ message: "Product updated", product });
};

const getOrders = async (req, res, next) => {
    if (!requireSeller(req, res)) {
        return;
    }

    const orders = await Order.find({ "items.sellerId": req.actor.userId }).lean();

    return res.json({ count: orders.length, orders });
};

const getEarnings = async (req, res, next) => {
    if (!requireSeller(req, res)) {
        return;
    }

    const orders = await Order.find({
        status: { $in: ["confirmed", "processing", "shipped", "delivered"] },
        "items.sellerId": req.actor.userId,
    }).lean();

    const sellerOrderItems = orders.flatMap((order) =>
        order.items.filter((item) => item.sellerId === req.actor.userId)
    );

    const gross = Number(
        sellerOrderItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    );

    return res.json({
        itemCount: sellerOrderItems.length,
        gross,
        currency: "USD",
    });
};

module.exports = {
    register,
    getProfile,
    updateProfile,
    getProducts,
    createProduct,
    updateProduct,
    getOrders,
    getEarnings,
};
