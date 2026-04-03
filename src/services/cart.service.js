const { Cart, Product, Order, Notification } = require("../data/models");
const { getNextId, getCart: getOrCreateCart } = require("../data/store");

const ACTIVE_PRODUCT_QUERY = {
  $or: [
    { status: "active" },
    {
      status: { $exists: false },
      isActive: true,
    },
  ],
};

const findActiveProductById = async (productId) => {
  return Product.findOne({ id: Number(productId), ...ACTIVE_PRODUCT_QUERY }).lean();
};

const getOwnerKey = (req) => {
  if (req.actor && req.actor.isAuthenticated) {
    return `user:${req.actor.userId}`;
  }

  const guestId = req.header("x-guest-id") || req.query.guestId || (req.body && req.body.guestId) || "default";

  return `guest:${String(guestId)}`;
};

const enrichCart = async (cart) => {
  const productIds = cart.items.map((item) => item.productId);
  const products = await Product.find({ id: { $in: productIds }, ...ACTIVE_PRODUCT_QUERY }).lean();
  const productMap = new Map(products.map((p) => [p.id, p]));

  return cart.items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;

      return {
        productId: product.id,
        sellerId: product.sellerId,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal: Number((product.price * item.quantity).toFixed(2)),
        availableStock: product.stock,
      };
    })
    .filter(Boolean);
};

const computeTotals = (items) => {
  const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const discount = 0;
  const taxableAmount = Number(Math.max(subtotal - discount, 0).toFixed(2));
  const tax = Number((taxableAmount * 0.14).toFixed(2));
  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 5;
  const total = Number((taxableAmount + tax + shipping).toFixed(2));

  return { subtotal, discount, tax, shipping, total, currency: "EGP" };
};

const getCartWithDetails = async (ownerKey) => {
  const cart = await getOrCreateCart(ownerKey);
  const items = await enrichCart(cart);
  const totals = computeTotals(items);
  return { cart, items, totals };
};

const addItem = async (ownerKey, productId, quantity) => {
  const cart = await getOrCreateCart(ownerKey);
  const pid = Number(productId);
  const qty = Number(quantity);

  if (!Number.isInteger(pid)) {
    return { error: "Valid productId is required", status: 400 };
  }

  if (!Number.isInteger(qty) || qty < 1) {
    return { error: "Quantity must be an integer >= 1", status: 400 };
  }

  const product = await findActiveProductById(pid);
  if (!product) {
    return { error: "Product is not available", status: 404 };
  }

  const existing = cart.items.find((item) => item.productId === pid);
  const currentQty = existing ? existing.quantity : 0;

  if (currentQty + qty > product.stock) {
    return { error: "Requested quantity exceeds available stock", status: 400 };
  }

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.items.push({ productId: pid, quantity: qty });
  }

  await cart.save();

  const items = await enrichCart(cart);
  const totals = computeTotals(items);

  return { items, totals };
};

const updateQuantity = async (ownerKey, productId, quantity) => {
  const cart = await getOrCreateCart(ownerKey);
  const pid = Number(productId);
  const qty = Number(quantity);

  if (!Number.isInteger(qty) || qty < 1) {
    return { error: "quantity must be an integer >= 1", status: 400 };
  }

  const product = await findActiveProductById(pid);
  if (!product) {
    return { error: "Product is not available", status: 404 };
  }

  if (qty > product.stock) {
    return { error: "Requested quantity exceeds available stock", status: 400 };
  }

  const existing = cart.items.find((item) => item.productId === pid);
  if (!existing) {
    return { error: "Item not found in cart", status: 404 };
  }

  existing.quantity = qty;
  await cart.save();

  const items = await enrichCart(cart);
  const totals = computeTotals(items);

  return { items, totals };
};

const removeItemFromCart = async (ownerKey, productId) => {
  const cart = await getOrCreateCart(ownerKey);
  const pid = Number(productId);

  const index = cart.items.findIndex((item) => item.productId === pid);
  if (index === -1) {
    return { error: "Item not found in cart", status: 404 };
  }

  cart.items.splice(index, 1);
  await cart.save();

  const items = await enrichCart(cart);
  const totals = computeTotals(items);

  return { items, totals };
};

const getSummary = async (ownerKey) => {
  const cart = await getOrCreateCart(ownerKey);
  const items = await enrichCart(cart);
  const totals = computeTotals(items);

  return { itemCount: items.length, totals };
};

const processCheckout = async (ownerKey, actor, body) => {
  const cart = await getOrCreateCart(ownerKey);
  const items = await enrichCart(cart);

  if (items.length === 0) {
    return { error: "Cart is empty", status: 400 };
  }

  const outOfStock = items.find((item) => item.quantity > item.availableStock);
  if (outOfStock) {
    return { error: `Item ${outOfStock.name} exceeds available stock`, status: 400 };
  }

  const { paymentMethod = "cod", shippingAddress = null, guestInfo = null } = body;
  const allowedPaymentMethods = ["card", "paypal", "cod", "wallet"];

  if (!allowedPaymentMethods.includes(paymentMethod)) {
    return { error: "Unsupported payment method", status: 400 };
  }

  const totals = computeTotals(items);

  const order = await Order.create({
    id: await getNextId(Order),
    userId: actor && actor.isAuthenticated ? actor.userId : null,
    guestInfo,
    ownerKey,
    status: paymentMethod === "cod" ? "placed" : "pending_payment",
    shippingStatus: "pending",
    paymentMethod,
    paymentStatus: paymentMethod === "cod" ? "paid" : "pending",
    shippingAddress,
    currency: totals.currency,
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    shipping: totals.shipping,
    total: totals.total,
    items,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (paymentMethod === "cod") {
    for (const item of items) {
      await Product.updateOne({ id: item.productId }, { $inc: { stock: -item.quantity } });
    }

    if (order.userId) {
      await Notification.create({
        id: await getNextId(Notification),
        userId: order.userId,
        type: "order-confirmation",
        message: `Order #${order.id} placed successfully`,
      });
    }

    cart.items = [];
    await cart.save();

    return { order, isCod: true };
  }

  cart.items = [];
  await cart.save();

  return { order, isCod: false };
};

module.exports = {
  getOwnerKey,
  getCartWithDetails,
  addItem,
  updateQuantity,
  removeItemFromCart,
  getSummary,
  processCheckout,
};
