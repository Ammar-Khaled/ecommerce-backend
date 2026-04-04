const { Review, User, Product } = require("../data/models");

const requireAdmin = (req, res) => {
  if (!req.actor || !req.actor.isAuthenticated) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }

  if (req.actor.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }

  return true;
};

const getAllReviews = async (req, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

  const reviews = await Review.find({}).sort({ createdAt: -1, id: -1 }).lean();

  const userIds = [...new Set(reviews.map((review) => review.userId))];
  const productIds = [...new Set(reviews.map((review) => review.productId))];

  const [users, products] = await Promise.all([
    User.find({ id: { $in: userIds } }).lean(),
    Product.find({ id: { $in: productIds } }).lean(),
  ]);

  const userNameMap = new Map(users.map((user) => [user.id, user.name]));
  const productNameMap = new Map(products.map((product) => [product.id, product.name]));

  const payload = reviews.map((review) => ({
    ...review,
    userName: userNameMap.get(review.userId) || "Unknown",
    productName: productNameMap.get(review.productId) || "Unknown",
  }));

  return res.json({ count: payload.length, reviews: payload });
};

const deleteReview = async (req, res) => {
  if (!requireAdmin(req, res)) {
    return;
  }

  const review = await Review.findOneAndDelete({ id: Number(req.params.id) }).lean();

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  return res.json({ message: "Review deleted", review });
};

module.exports = {
  getAllReviews,
  deleteReview,
};
