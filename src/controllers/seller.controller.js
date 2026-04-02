const { SellerProfile, Product, Order, User, Category, getNextId } = require("../data/store");

const REVENUE_STATUSES = new Set(["confirmed", "processing", "shipped", "delivered"]);

const toIsoDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

const toUiOrderStatus = (status) => {
  if (["shipped"].includes(status)) {
    return "Shipped";
  }

  if (["delivered"].includes(status)) {
    return "Completed";
  }

  if (["cancelled"].includes(status)) {
    return "Cancelled";
  }

  return "Pending";
};

const getSellerId = (req) => req.actor.userId;

const getSellerOrders = async (sellerId) => {
  return Order.find({ "items.sellerId": sellerId }).sort({ id: -1 }).lean();
};

const getSellerOrdersView = async (sellerId) => {
  const orders = await getSellerOrders(sellerId);
  const userIds = [...new Set(orders.map((order) => order.userId).filter((id) => Number.isFinite(id)))];
  const users = await User.find({ id: { $in: userIds } })
    .select("id name email")
    .lean();
  const userMap = new Map(users.map((user) => [user.id, user]));

  return orders.map((order) => {
    const sellerItems = (order.items || []).filter((item) => item.sellerId === sellerId);
    const sellerTotal = Number(sellerItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0).toFixed(2));
    const customer = userMap.get(order.userId) || null;
    const guestInfo = order.guestInfo || {};

    return {
      id: order.id,
      userId: order.userId || null,
      status: order.status,
      createdAt: toIsoDate(order.createdAt),
      currency: order.currency || "USD",
      sellerItemCount: sellerItems.length,
      sellerTotal,
      customerName: customer ? customer.name : guestInfo.name || "Guest customer",
      customerEmail: customer ? customer.email : guestInfo.email || "",
    };
  });
};

const buildSalesMetrics = async (sellerId, sellerOrdersView) => {
  const totalRevenue = Number(
    sellerOrdersView
      .filter((order) => REVENUE_STATUSES.has(order.status))
      .reduce((sum, order) => sum + order.sellerTotal, 0)
      .toFixed(2),
  );

  const totalOrders = sellerOrdersView.length;
  const totalProducts = await Product.countDocuments({ sellerId });

  return [
    { label: "Total Revenue", value: totalRevenue, currency: true },
    { label: "Total Orders", value: totalOrders },
    { label: "Total Products", value: totalProducts },
  ];
};

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

const createProfile = register;

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

  const profile = await SellerProfile.findOneAndUpdate({ userId: req.actor.userId }, { $set: update }, { new: true }).lean();

  if (!profile) {
    return res.status(404).json({ message: "Seller profile not found" });
  }

  return res.json({ message: "Seller profile updated", profile });
};

const getProducts = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const products = await Product.find({ sellerId: getSellerId(req) })
    .sort({ id: -1 })
    .lean();
  return res.json({ count: products.length, products });
};

const createProduct = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const { name, description, price, categoryId, stock = 0, images = [], isActive } = req.body;

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
    sellerId: getSellerId(req),
    isActive: isActive === undefined ? true : Boolean(isActive),
    images: Array.isArray(images) ? images : [],
  });

  return res.status(201).json({ message: "Product created", product });
};

const updateProduct = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const product = await Product.findOne({ id: Number(req.params.id), sellerId: getSellerId(req) });

  if (!product) {
    return res.status(404).json({ message: "Product not found for this seller" });
  }

  const { name, description, price, stock, images, categoryId, isActive } = req.body;

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (images !== undefined && Array.isArray(images)) product.images = images;
  if (isActive !== undefined) product.isActive = Boolean(isActive);
  if (categoryId !== undefined) {
    const category = await Category.findOne({ id: Number(categoryId) }).lean();
    if (!category) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    product.categoryId = Number(categoryId);
  }

  await product.save();

  return res.json({ message: "Product updated", product });
};

const deleteProduct = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const product = await Product.findOneAndDelete({
    id: Number(req.params.id),
    sellerId: getSellerId(req),
  }).lean();

  if (!product) {
    return res.status(404).json({ message: "Product not found for this seller" });
  }

  return res.json({ message: "Product deleted", productId: product.id });
};

const updateProductStatus = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const product = await Product.findOne({
    id: Number(req.params.id),
    sellerId: getSellerId(req),
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found for this seller" });
  }

  product.isActive = Boolean(req.body.isActive);
  await product.save();

  return res.json({ message: "Product status updated", product });
};

const getOrders = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const orders = await getSellerOrdersView(getSellerId(req));

  return res.json({ count: orders.length, orders });
};

const getEarnings = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const sellerOrdersView = await getSellerOrdersView(getSellerId(req));
  const gross = Number(
    sellerOrdersView
      .filter((order) => REVENUE_STATUSES.has(order.status))
      .reduce((sum, order) => sum + order.sellerTotal, 0)
      .toFixed(2),
  );

  return res.json({
    orderCount: sellerOrdersView.length,
    gross,
    currency: "USD",
  });
};

const getDashboard = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const sellerId = getSellerId(req);
  const sellerOrdersView = await getSellerOrdersView(sellerId);
  const metrics = await buildSalesMetrics(sellerId, sellerOrdersView);

  const recentOrders = sellerOrdersView.slice(0, 5).map((order) => ({
    id: `ORD-${order.id}`,
    customer: order.customerName,
    date: order.createdAt,
    total: order.sellerTotal,
    status: toUiOrderStatus(order.status),
  }));

  return res.json({
    metrics,
    recentOrders,
  });
};

const getSales = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const sellerId = getSellerId(req);
  const sellerOrdersView = await getSellerOrdersView(sellerId);
  const metrics = await buildSalesMetrics(sellerId, sellerOrdersView);

  const orders = sellerOrdersView.map((order) => ({
    id: `ORD-${order.id}`,
    customerName: order.customerName,
    date: order.createdAt,
    status: toUiOrderStatus(order.status),
    totalAmount: order.sellerTotal,
  }));

  return res.json({ metrics, orders });
};

const getCustomers = async (req, res, next) => {
  if (!requireSeller(req, res)) {
    return;
  }

  const sellerOrdersView = await getSellerOrdersView(getSellerId(req));
  const customersMap = new Map();

  for (const order of sellerOrdersView) {
    const key = order.userId ? `user-${order.userId}` : order.customerEmail ? `guest-${String(order.customerEmail).toLowerCase()}` : `guest-order-${order.id}`;
    const existing = customersMap.get(key);

    if (!existing) {
      customersMap.set(key, {
        id: key,
        name: order.customerName,
        email: order.customerEmail || "guest@guest.local",
        totalOrders: 1,
        totalSpend: order.sellerTotal,
        lastOrderDate: order.createdAt,
      });
      continue;
    }

    existing.totalOrders += 1;
    existing.totalSpend = Number((existing.totalSpend + order.sellerTotal).toFixed(2));
    if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
      existing.lastOrderDate = order.createdAt;
    }
  }

  const customers = [...customersMap.values()].sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());

  return res.json({ count: customers.length, customers });
};

module.exports = {
  register,
  createProfile,
  getProfile,
  updateProfile,
  getDashboard,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getOrders,
  getEarnings,
  getSales,
  getCustomers,
};
