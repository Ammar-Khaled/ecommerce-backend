const { User, Product, Order, Review } = require("../data/models");

const requireAuth = (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        res.status(401).json({ message: "Authentication required. Provide Bearer token." });
        return false;
    }

    return true;
};

const getMe = (req, res) => {
    if (!requireAuth(req, res)) {
        return;
    }

    return res.json(req.actor.user);
};

const patchMe = async (req, res) => {
    if (!requireAuth(req, res)) {
        return;
    }

    const { name, address, paymentDetails, phone } = req.body;
    const update = {};

    if (name !== undefined) update.name = name;
    if (address !== undefined) update.address = address;
    if (phone !== undefined) update.phone = phone;
    if (paymentDetails !== undefined && Array.isArray(paymentDetails)) update.paymentDetails = paymentDetails;

    const user = await User.findOneAndUpdate({ id: req.actor.userId }, { $set: update }, { new: true }).lean();

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Profile updated", user });
};

const getMyWishlist = async (req, res) => {
    if (!requireAuth(req, res)) {
        return;
    }

    const user = await User.findOne({ id: req.actor.userId }).lean();
    const wishlistProducts = await Product.find({ id: { $in: user ? user.wishlist : [] } }).lean();
    return res.json({ count: wishlistProducts.length, items: wishlistProducts });
};

const addToWishlist = async (req, res) => {
    if (!requireAuth(req, res)) {
        return;
    }

    const productId = Number(req.params.productId);
    const product = await Product.findOne({ id: productId }).lean();

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findOneAndUpdate(
        { id: req.actor.userId },
        { $addToSet: { wishlist: productId } },
        { new: true }
    ).lean();

    return res.status(201).json({ message: "Added to wishlist", wishlist: user ? user.wishlist : [] });
};

const removeFromWishlist = async (req, res) => {
    if (!requireAuth(req, res)) {
        return;
    }

    const productId = Number(req.params.productId);
    const user = await User.findOneAndUpdate(
        { id: req.actor.userId },
        { $pull: { wishlist: productId } },
        { new: true }
    ).lean();

    return res.json({ message: "Removed from wishlist", wishlist: user ? user.wishlist : [] });
};

const getMyFavorites = async (req, res) => {
    if (!requireAuth(req, res)) {
        return;
    }

    const user = await User.findOne({ id: req.actor.userId }).lean();
    const favorites = await Product.find({ id: { $in: user ? user.wishlist : [] } }).lean();
    return res.json({ count: favorites.length, items: favorites });
};

const getMyOrders = async (req, res) => {
    if (!requireAuth(req, res)) {
        return;
    }

    const myOrders = await Order.find({ userId: req.actor.userId }).lean();
    return res.json({ count: myOrders.length, orders: myOrders });
};

const getMyReviews = async (req, res) => {
    if (!requireAuth(req, res)) {
        return;
    }

    const myReviews = await Review.find({ userId: req.actor.userId }).lean();
    return res.json({ count: myReviews.length, reviews: myReviews });
};

const getRoles = (_req, res) => {
    return res.json({ roles: ["customer", "seller", "admin"] });
};

const getAllActiveUsers = async (_req, res) => {
    const activeUsers = await User.find({ isDeleted: false }).lean();
    return res.json({ count: activeUsers.length, users: activeUsers });
};

module.exports = {
    getMe,
    patchMe,
    getMyWishlist,
    addToWishlist,
    removeFromWishlist,
    getMyFavorites,
    getMyOrders,
    getMyReviews,
    getRoles,
    getAllActiveUsers,
};
