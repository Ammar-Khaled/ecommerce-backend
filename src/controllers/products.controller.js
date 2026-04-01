const { Product, Category, Review, User } = require("../data/models");
const { getNextId } = require("../data/store");

const toProductView = (product) => {
    const productReviews = product.reviews || [];
    const rating =
        productReviews.length > 0
            ? Number(
                (
                    productReviews.reduce((sum, review) => sum + review.rating, 0) /
                    productReviews.length
                ).toFixed(2)
            )
            : null;

    const category = product.category || null;

    return {
        ...product,
        categoryName: category ? category.name : product.categoryName || null,
        rating,
        reviewCount: productReviews.length,
    };
};

const requireSellerOrAdmin = (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        res.status(401).json({ message: "Authentication required" });
        return false;
    }

    if (!["seller", "admin"].includes(req.actor.role)) {
        res.status(403).json({ message: "Seller or admin access required" });
        return false;
    }

    return true;
};

const findProductById = async (id) => {
    return Product.findOne({ id: Number(id) }).lean();
};

const getCategories = async (_req, res) => {
    const categories = await Category.find({}).lean();
    return res.json({ count: categories.length, categories });
};

const listProducts = async (req, res) => {
    const { q, categoryId, minPrice, maxPrice, inStock, sellerId, sort } = req.query;
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

    if (sellerId) {
        query.sellerId = Number(sellerId);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};
        if (minPrice !== undefined) query.price.$gte = Number(minPrice);
        if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    if (String(inStock).toLowerCase() === "true") {
        query.stock = { $gt: 0 };
    }

    const sortMap = {
        "price-asc": { price: 1 },
        "price-desc": { price: -1 },
        "name-asc": { name: 1 },
    };

    const products = await Product.find(query)
        .sort(sortMap[sort] || { id: 1 })
        .lean();

    const [categories, reviews] = await Promise.all([
        Category.find({}).lean(),
        Review.find({ productId: { $in: products.map((product) => product.id) } }).lean(),
    ]);

    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const reviewsByProductId = reviews.reduce((acc, review) => {
        if (!acc[review.productId]) {
            acc[review.productId] = [];
        }

        acc[review.productId].push(review);
        return acc;
    }, {});

    const result = products.map((product) => {
        return toProductView({
            ...product,
            category: categoryMap.get(product.categoryId) || null,
            reviews: reviewsByProductId[product.id] || [],
        });
    });

    return res.json({
        count: result.length,
        products: result,
    });
};

const getProductById = async (req, res) => {
    const product = await findProductById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const [category, productReviews] = await Promise.all([
        Category.findOne({ id: product.categoryId }).lean(),
        Review.find({ productId: product.id }).lean(),
    ]);

    const reviewUserIds = [...new Set(productReviews.map((review) => review.userId))];
    const reviewUsers = await User.find({ id: { $in: reviewUserIds } }).lean();
    const userNameMap = new Map(reviewUsers.map((user) => [user.id, user.name]));

    const productReviewsWithUsers = productReviews.map((review) => ({
        ...review,
        userName: userNameMap.get(review.userId) || "Unknown",
    }));

    return res.json({
        ...toProductView({ ...product, category, reviews: productReviews }),
        reviews: productReviewsWithUsers,
    });
};

const createProduct = async (req, res) => {
    if (!requireSellerOrAdmin(req, res)) {
        return;
    }

    const { name, description, price, categoryId, stock = 0, images = [] } = req.body;
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
        sellerId: req.actor.userId,
        images: Array.isArray(images) ? images : [],
    });

    return res.status(201).json({
        message: "Product created",
        product: toProductView({ ...product.toObject(), category, reviews: [] }),
    });
};

const updateProductStock = async (req, res) => {
    if (!requireSellerOrAdmin(req, res)) {
        return;
    }

    const product = await Product.findOne({ id: Number(req.params.id) });
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    if (req.actor.role === "seller" && product.sellerId !== req.actor.userId) {
        return res.status(403).json({ message: "Cannot update stock for another seller product" });
    }

    const { stock } = req.body;
    if (!Number.isFinite(Number(stock)) || Number(stock) < 0) {
        return res.status(400).json({ message: "stock must be a number >= 0" });
    }

    product.stock = Number(stock);
    await product.save();

    const category = await Category.findOne({ id: product.categoryId }).lean();
    return res.json({
        message: "Stock updated",
        product: toProductView({ ...product.toObject(), category, reviews: [] }),
    });
};

const getProductReviews = async (req, res) => {
    const product = await findProductById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const productReviews = await Review.find({ productId: product.id }).lean();
    const reviewUserIds = [...new Set(productReviews.map((review) => review.userId))];
    const reviewUsers = await User.find({ id: { $in: reviewUserIds } }).lean();
    const userNameMap = new Map(reviewUsers.map((user) => [user.id, user.name]));

    const enrichedReviews = productReviews.map((review) => ({
        ...review,
        userName: userNameMap.get(review.userId) || "Unknown",
    }));

    return res.json({ count: enrichedReviews.length, reviews: enrichedReviews });
};

const createProductReview = async (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const product = await findProductById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const { rating, comment = "" } = req.body;
    const normalizedRating = Number(rating);

    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
        return res.status(400).json({ message: "rating must be an integer from 1 to 5" });
    }

    const review = await Review.create({
        id: await getNextId(Review),
        productId: product.id,
        userId: req.actor.userId,
        rating: normalizedRating,
        comment,
        createdAt: new Date().toISOString(),
    });

    return res.status(201).json({ message: "Review submitted", review });
};

module.exports = {
    getCategories,
    listProducts,
    getProductById,
    createProduct,
    updateProductStock,
    getProductReviews,
    createProductReview,
};
