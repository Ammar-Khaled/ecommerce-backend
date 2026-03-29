const {
    User,
    Product,
    Category,
    Order,
    getNextId,
} = require("../data/store");

const requireAdmin = (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated || req.actor.role !== "admin") {
        res.status(403).json({ message: "Admin access required" });
        return false;
    }

    return true;
};

const getDashboard = async (req, res, next) => {
    if (!requireAdmin(req, res)) {
        return;
    }

    const [users, products, orders, categories] = await Promise.all([
        User.countDocuments({ isDeleted: false }),
        Product.countDocuments(),
        Order.countDocuments(),
        Category.countDocuments(),
    ]);

    return res.json({ users, products, orders, categories });
};

const getUsers = async (req, res, next) => {
    if (!requireAdmin(req, res)) {
        return;
    }

    const users = await User.find({}).lean();
    return res.json({ count: users.length, users });
};

const restrictUser = async (req, res, next) => {
    if (!requireAdmin(req, res)) {
        return;
    }

    const user = await User.findOneAndUpdate(
        { id: Number(req.params.id) },
        { $set: { isActive: Boolean(req.body.isActive) } },
        { new: true }
    ).lean();

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User status updated", user });
};

const deleteUser = async (req, res, next) => {
    if (!requireAdmin(req, res)) {
        return;
    }

    const user = await User.findOneAndUpdate(
        { id: Number(req.params.id) },
        { $set: { isDeleted: true, isActive: false } },
        { new: true }
    ).lean();

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User soft deleted", user });
};

const createCategory = async (req, res, next) => {
    if (!requireAdmin(req, res)) {
        return;
    }

    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: "name is required" });
    }

    const category = await Category.create({ id: await getNextId(Category), name });
    return res.status(201).json({ message: "Category created", category });
};

const createProduct = async (req, res, next) => {
    if (!requireAdmin(req, res)) {
        return;
    }

    const { name, description, price, categoryId, stock = 0, sellerId = req.actor.userId } = req.body;

    if (!name || price === undefined || !categoryId) {
        return res.status(400).json({ message: "name, price, and categoryId are required" });
    }

    const category = await Category.findOne({ id: Number(categoryId) }).lean();
    if (!category) {
        return res.status(400).json({ message: "Invalid categoryId" });
    }

    const product = await Product.create({
        id: await getNextId(Product),
        name,
        description: description || "",
        price: Number(price),
        currency: "USD",
        categoryId: Number(categoryId),
        stock: Number(stock),
        sellerId: Number(sellerId),
        images: [],
    });

    return res.status(201).json({ message: "Product created", product });
};

const updateOrderShipping = async (req, res, next) => {
    if (!requireAdmin(req, res)) {
        return;
    }

    const order = await Order.findOneAndUpdate(
        { id: Number(req.params.id) },
        { $set: { shippingStatus: req.body.shippingStatus || "processing" } },
        { new: true }
    ).lean();

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ message: "Shipping status updated", order });
};

module.exports = {
    getDashboard,
    getUsers,
    restrictUser,
    deleteUser,
    createCategory,
    createProduct,
    updateOrderShipping,
};
