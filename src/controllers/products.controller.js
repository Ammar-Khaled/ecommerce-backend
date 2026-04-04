const { Product, Category, Review, User, SellerProfile, Order } = require("../data/models");
const { getNextId } = require("../data/store");

const REVIEW_ELIGIBLE_ORDER_STATUSES = ["placed", "confirmed", "processing", "shipped", "delivered"];

const ACTIVE_PRODUCT_QUERY = {
  $or: [
    { status: "active" },
    {
      status: { $exists: false },
      isActive: true,
    },
  ],
};

const normalizeProductStatus = (product) => {
  if (product && typeof product.status === "string") {
    return product.status;
  }

  return product && product.isActive === false ? "rejected" : "active";
};

const toProductView = (product) => {
  const productReviews = product.reviews || [];
  const rating = productReviews.length > 0 ? Number((productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length).toFixed(2)) : null;

  const category = product.category || null;
  const status = normalizeProductStatus(product);

  return {
    ...product,
    status,
    isActive: status === "active",
    categoryName: category ? category.name : product.categoryName || null,
    rating,
    reviewCount: productReviews.length,
  };
};

const isProductActive = (product) => normalizeProductStatus(product) === "active";

const isAdmin = (req) => Boolean(req.actor && req.actor.isAuthenticated && req.actor.role === "admin");

const enrichReviewsWithUserNames = async (reviews) => {
  if (!reviews.length) {
    return [];
  }

  const reviewUserIds = [...new Set(reviews.map((review) => review.userId))];
  const reviewUsers = await User.find({ id: { $in: reviewUserIds } })
    .select("id name")
    .lean();
  const userNameMap = new Map(reviewUsers.map((user) => [user.id, user.name]));

  return reviews.map((review) => ({
    ...review,
    userName: userNameMap.get(review.userId) || "Unknown",
  }));
};

const hasPurchasedProduct = async (userId, productId) => {
  const matchedOrder = await Order.findOne({
    userId: Number(userId),
    paymentStatus: "paid",
    status: { $in: REVIEW_ELIGIBLE_ORDER_STATUSES },
    "items.productId": Number(productId),
  }).lean();

  return Boolean(matchedOrder);
};

const canViewInactiveProduct = (req, product) => {
  if (isAdmin(req)) {
    return true;
  }

  if (req.actor && req.actor.isAuthenticated && req.actor.role === "seller") {
    return Number(product.sellerId) === Number(req.actor.userId);
  }

  return false;
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
  const [categories, categoryCounts] = await Promise.all([
    Category.find({}).sort({ name: 1 }).lean(),
    Product.aggregate([
      {
        $match: ACTIVE_PRODUCT_QUERY,
      },
      {
        $group: {
          _id: "$categoryId",
          itemCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const countByCategoryId = new Map(categoryCounts.map((entry) => [entry._id, entry.itemCount]));
  const payload = categories.map((category) => ({
    ...category,
    itemCount: countByCategoryId.get(category.id) || 0,
  }));

  return res.json({ count: payload.length, categories: payload });
};

const listProducts = async (req, res) => {
  const { q, categoryId, minPrice, maxPrice, inStock, sellerId, sort, limit, includeInactive } = req.query;
  const andFilters = [];

  if (q) {
    const term = String(q).trim();
    andFilters.push({
      $or: [{ name: { $regex: term, $options: "i" } }, { description: { $regex: term, $options: "i" } }],
    });
  }

  if (categoryId) {
    andFilters.push({ categoryId: Number(categoryId) });
  }

  if (sellerId) {
    andFilters.push({ sellerId: Number(sellerId) });
  }

  const shouldIncludeInactive = String(includeInactive).toLowerCase() === "true" && isAdmin(req);
  if (!shouldIncludeInactive) {
    andFilters.push(ACTIVE_PRODUCT_QUERY);
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter = {};
    if (minPrice !== undefined) priceFilter.$gte = Number(minPrice);
    if (maxPrice !== undefined) priceFilter.$lte = Number(maxPrice);
    andFilters.push({ price: priceFilter });
  }

  if (String(inStock).toLowerCase() === "true") {
    andFilters.push({ stock: { $gt: 0 } });
  }

  const query = andFilters.length > 0 ? { $and: andFilters } : {};

  const sortMap = {
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    "name-asc": { name: 1 },
  };

  const parsedLimit = Number(limit);
  const shouldLimit = Number.isInteger(parsedLimit) && parsedLimit > 0;

  let productsQuery = Product.find(query).sort(sortMap[sort] || { id: 1 });
  if (shouldLimit) {
    productsQuery = productsQuery.limit(parsedLimit);
  }

  const products = await productsQuery.lean();

  const [categories, reviews] = await Promise.all([Category.find({}).lean(), Review.find({ productId: { $in: products.map((product) => product.id) } }).lean()]);

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

const getTopProducts = async (req, res) => {
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 20) : 4;

  const orderStats = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
        status: { $in: REVIEW_ELIGIBLE_ORDER_STATUSES },
      },
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.productId",
        orderCount: { $sum: 1 },
        quantitySold: { $sum: "$items.quantity" },
        lastOrderedAt: { $max: "$createdAt" },
      },
    },
    {
      $sort: {
        orderCount: -1,
        quantitySold: -1,
        lastOrderedAt: -1,
        _id: 1,
      },
    },
    {
      $limit: Math.max(limit * 5, limit),
    },
  ]);

  const orderCountByProductId = new Map(orderStats.map((entry) => [Number(entry._id), Number(entry.orderCount) || 0]));
  const topOrderedProductIds = orderStats.map((entry) => Number(entry._id));

  const topOrderedProducts =
    topOrderedProductIds.length > 0
      ? await Product.find({
          id: { $in: topOrderedProductIds },
          ...ACTIVE_PRODUCT_QUERY,
        }).lean()
      : [];

  const productById = new Map(topOrderedProducts.map((product) => [product.id, product]));
  const selectedProducts = [];
  const selectedProductIds = new Set();

  for (const productId of topOrderedProductIds) {
    if (selectedProducts.length >= limit) {
      break;
    }

    const product = productById.get(productId);
    if (!product) {
      continue;
    }

    selectedProducts.push(product);
    selectedProductIds.add(product.id);
  }

  if (selectedProducts.length < limit) {
    const fallbackProducts = await Product.find({
      ...ACTIVE_PRODUCT_QUERY,
      id: { $nin: Array.from(selectedProductIds) },
    })
      .sort({ createdAt: -1, id: -1 })
      .limit(limit - selectedProducts.length)
      .lean();

    for (const fallbackProduct of fallbackProducts) {
      selectedProducts.push(fallbackProduct);
      selectedProductIds.add(fallbackProduct.id);
    }
  }

  const products = selectedProducts.slice(0, limit);
  const [categories, reviews] = await Promise.all([Category.find({ id: { $in: products.map((product) => product.categoryId) } }).lean(), Review.find({ productId: { $in: products.map((product) => product.id) } }).lean()]);

  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const reviewsByProductId = reviews.reduce((acc, review) => {
    if (!acc[review.productId]) {
      acc[review.productId] = [];
    }

    acc[review.productId].push(review);
    return acc;
  }, {});

  const payload = products.map((product) =>
    toProductView({
      ...product,
      category: categoryMap.get(product.categoryId) || null,
      reviews: reviewsByProductId[product.id] || [],
      orderCount: orderCountByProductId.get(product.id) || 0,
    }),
  );

  return res.json({
    count: payload.length,
    products: payload,
  });
};

const activateProduct = async (req, res, next) => {
  if (!requireSellerOrAdmin(req, res)) {
    return;
  }
  if (req.actor.role !== "admin") {
    return res.status(403).json({ message: "Only admins can activate products" });
  }
  const product = await Product.findOneAndUpdate(
    { id: Number(req.params.id) },
    {
      isActive: true,
      status: "active",
    },
    { new: true },
  ).lean();
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.json({ message: "Product approved", product: toProductView({ ...product, reviews: [] }) });
};

const deactivateProduct = async (req, res, next) => {
  if (!requireSellerOrAdmin(req, res)) {
    return;
  }
  if (req.actor.role !== "admin") {
    return res.status(403).json({ message: "Only admins can deactivate products" });
  }
  const product = await Product.findOneAndUpdate(
    { id: Number(req.params.id) },
    {
      isActive: false,
      status: "rejected",
    },
    { new: true },
  ).lean();
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.json({ message: "Product rejected", product: toProductView({ ...product, reviews: [] }) });
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

  const createdByAdmin = req.actor.role === "admin";
  const product = await Product.create({
    id: await getNextId(Product),
    name,
    description: description || "",
    price: Number(price),
    currency: "USD",
    categoryId: Number(categoryId),
    stock: Number(stock),
    sellerId: req.actor.userId,
    status: createdByAdmin ? "active" : "pending",
    isActive: createdByAdmin,
    images: Array.isArray(images) ? images : [],
  });

  return res.status(201).json({
    message: createdByAdmin ? "Product created" : "Product created and submitted for approval",
    product: toProductView({ ...product.toObject(), category, reviews: [] }),
  });
};

const getProductById = async (req, res) => {
  const product = await findProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (!isProductActive(product) && !canViewInactiveProduct(req, product)) {
    return res.status(404).json({ message: "Product not found" });
  }

  const [category, productReviews, sellerUser, sellerProfile] = await Promise.all([
    Category.findOne({ id: product.categoryId }).lean(),
    Review.find({ productId: product.id }).sort({ createdAt: -1, id: -1 }).lean(),
    User.findOne({ id: product.sellerId }).select("id name email phone").lean(),
    SellerProfile.findOne({ userId: product.sellerId }).select("storeName isApproved").lean(),
  ]);

  const productReviewsWithUsers = await enrichReviewsWithUserNames(productReviews);

  return res.json({
    ...toProductView({ ...product, category, reviews: productReviews }),
    seller: sellerUser
      ? {
          id: sellerUser.id,
          name: sellerUser.name,
          email: sellerUser.email,
          phone: sellerUser.phone,
          storeName: sellerProfile ? sellerProfile.storeName : null,
          isApproved: sellerProfile ? Boolean(sellerProfile.isApproved) : null,
        }
      : null,
    reviews: productReviewsWithUsers,
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

  if (!isProductActive(product) && !canViewInactiveProduct(req, product)) {
    return res.status(404).json({ message: "Product not found" });
  }

  const productReviews = await Review.find({ productId: product.id }).sort({ createdAt: -1, id: -1 }).lean();
  const enrichedReviews = await enrichReviewsWithUserNames(productReviews);

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

  if (!isProductActive(product)) {
    return res.status(400).json({ message: "Cannot review a non-active product" });
  }

  const purchased = await hasPurchasedProduct(req.actor.userId, product.id);
  if (!purchased) {
    return res.status(403).json({ message: "You can only review products you have purchased" });
  }

  const existingReview = await Review.findOne({ productId: product.id, userId: req.actor.userId }).lean();
  if (existingReview) {
    return res.status(409).json({ message: "You have already reviewed this product" });
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
    comment: typeof comment === "string" ? comment.trim() : "",
    createdAt: new Date().toISOString(),
  });

  const [enrichedReview] = await enrichReviewsWithUserNames([review.toObject()]);

  return res.status(201).json({ message: "Review submitted", review: enrichedReview });
};

const updateProductReview = async (req, res) => {
  if (!req.actor || !req.actor.isAuthenticated) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const product = await findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const review = await Review.findOne({
    id: Number(req.params.reviewId),
    productId: product.id,
  });

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  const isReviewOwner = Number(review.userId) === Number(req.actor.userId);
  if (!isReviewOwner) {
    return res.status(403).json({ message: "You can only update your own review" });
  }

  const { rating, comment } = req.body;
  if (rating === undefined && comment === undefined) {
    return res.status(400).json({ message: "Provide rating or comment to update" });
  }

  if (rating !== undefined) {
    const normalizedRating = Number(rating);
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ message: "rating must be an integer from 1 to 5" });
    }

    review.rating = normalizedRating;
  }

  if (comment !== undefined) {
    review.comment = typeof comment === "string" ? comment.trim() : "";
  }

  await review.save();

  const [enrichedReview] = await enrichReviewsWithUserNames([review.toObject()]);
  return res.json({ message: "Review updated", review: enrichedReview });
};

const deleteProductReview = async (req, res) => {
  if (!req.actor || !req.actor.isAuthenticated) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const product = await findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const review = await Review.findOne({
    id: Number(req.params.reviewId),
    productId: product.id,
  }).lean();

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  const isReviewOwner = Number(review.userId) === Number(req.actor.userId);
  if (!isReviewOwner) {
    return res.status(403).json({ message: "You can only delete your own review" });
  }

  await Review.deleteOne({ id: review.id, productId: product.id });

  return res.json({ message: "Review deleted", reviewId: review.id });
};

const deleteProduct = async (req, res) => {
  if (!requireSellerOrAdmin(req, res)) {
    return;
  }
  if (req.actor.role !== "admin") {
    return res.status(403).json({ message: "Only admins can delete products" });
  }

  const product = await Product.findOneAndDelete({ id: Number(req.params.id) }).lean();
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({ message: "Product deleted", product });
};

module.exports = {
  getCategories,
  listProducts,
  getProductById,
  createProduct,
  updateProductStock,
  getProductReviews,
  createProductReview,
  updateProductReview,
  deleteProductReview,
  activateProduct,
  deleteProduct,
  deactivateProduct,
  getTopProducts,
};
