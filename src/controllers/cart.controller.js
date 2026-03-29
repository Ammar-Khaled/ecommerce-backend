const { Cart, Product, Order, Notification } = require("../data/models");
const { getNextId, getCart: getOrCreateCart } = require("../data/store");

const getOwnerKey = (req) => {
    if (req.actor && req.actor.isAuthenticated) {
        return `user:${req.actor.userId}`;
    }

    const guestId =
        req.header("x-guest-id") ||
        req.query.guestId ||
        (req.body && req.body.guestId) ||
        "default";

    return `guest:${String(guestId)}`;
};

const enrichCart = async (cart) => {
    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ id: { $in: productIds } }).lean();
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
    const subtotal = Number(
        items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    );
    const discount = 0;
    const taxableAmount = Number(Math.max(subtotal - discount, 0).toFixed(2));
    const tax = Number((taxableAmount * 0.14).toFixed(2));
    const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 5;
    const total = Number((taxableAmount + tax + shipping).toFixed(2));

    return { subtotal, discount, tax, shipping, total, currency: "EGP" };
};

const getCart = async (req, res) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const items = await enrichCart(cart);
    const totals = computeTotals(items);

    return res.json({ ownerKey, count: items.length, ...totals, items });
};

const addItemHandler = async (req, res) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const { productId, quantity = 1 } = req.body;
    const pid = Number(productId);
    const qty = Number(quantity);

    if (!Number.isInteger(pid)) {
        return res.status(400).json({ message: "Valid productId is required" });
    }

    if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: "Quantity must be an integer >= 1" });
    }

    const product = await Product.findOne({ id: pid }).lean();
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const existing = cart.items.find((item) => item.productId === pid);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + qty > product.stock) {
        return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }

    if (existing) {
        existing.quantity += qty;
    } else {
        cart.items.push({ productId: pid, quantity: qty });
    }

    await cart.save();

    const items = await enrichCart(cart);
    const totals = computeTotals(items);

    return res.status(201).json({
        message: "Item added to cart",
        ownerKey,
        ...totals,
        items,
    });
};

const updateItemQuantity = async (req, res) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const productId = Number(req.params.productId);
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "quantity must be an integer >= 1" });
    }

    const product = await Product.findOne({ id: productId }).lean();
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    if (quantity > product.stock) {
        return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }

    const existing = cart.items.find((item) => item.productId === productId);
    if (!existing) {
        return res.status(404).json({ message: "Item not found in cart" });
    }

    existing.quantity = quantity;
    await cart.save();

    const items = await enrichCart(cart);
    const totals = computeTotals(items);

    return res.json({ message: "Cart quantity updated", ownerKey, ...totals, items });
};

const removeItem = async (req, res) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const productId = Number(req.params.productId);

    const index = cart.items.findIndex((item) => item.productId === productId);
    if (index === -1) {
        return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items.splice(index, 1);
    await cart.save();

    const items = await enrichCart(cart);
    const totals = computeTotals(items);

    return res.json({ message: "Item removed from cart", ownerKey, ...totals, items });
};

const getCartSummary = async (req, res) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const items = await enrichCart(cart);
    const totals = computeTotals(items);

    return res.json({ ownerKey, itemCount: items.length, ...totals });
};

const checkout = async (req, res) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const items = await enrichCart(cart);

    if (items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
    }

    const outOfStock = items.find((item) => item.quantity > item.availableStock);
    if (outOfStock) {
        return res.status(400).json({
            message: `Item ${outOfStock.name} exceeds available stock`,
        });
    }

    const { paymentMethod = "cod", shippingAddress = null, guestInfo = null } = req.body;
    const allowedPaymentMethods = ["card", "paypal", "cod", "wallet"];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ message: "Unsupported payment method" });
    }

    const totals = computeTotals(items);

    const order = await Order.create({
        id: await getNextId(Order),
        userId: req.actor && req.actor.isAuthenticated ? req.actor.userId : null,
        guestInfo,
        ownerKey,
        status: paymentMethod === "cod" ? "placed" : "pending_payment",
        shippingStatus: "pending",
        paymentMethod,
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

        return res.status(201).json({ message: "Order placed successfully", order });
    }

    cart.items = [];
    await cart.save();

    return res.status(201).json({
        message: "Order created. Proceed to payment.",
        order,
        nextStep: "POST /api/payments/intent with orderId",
    });
};

module.exports = {
    getCart,
    addItemHandler,
    updateItemQuantity,
    removeItem,
    getCartSummary,
    checkout,
};