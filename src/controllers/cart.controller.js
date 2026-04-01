const {
    Cart,
    Product,
    Order,
    Notification,
    getNextId,
} = require("../data/store");

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

const getOrCreateCart = async (ownerKey) => {
    let cart = await Cart.findOne({ ownerKey });
    if (!cart) {
        cart = await Cart.create({ ownerKey, items: [] });
    }

    return cart;
};

const enrichCart = async (cart) => {
    const productIds = cart.items.map((item) => item.productId);
    const products = await Product.find({ id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((product) => [product.id, product]));

    return cart.items
        .map((item) => {
            const product = productMap.get(item.productId);
            if (!product) {
                return null;
            }

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

const computeTotals = async (items) => {
    const subtotal = Number(
        items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    );

    const discount = 0;

    const taxableAmount = Number(Math.max(subtotal - discount, 0).toFixed(2));
    const tax = Number((taxableAmount * 0.14).toFixed(2));
    const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 5;
    const total = Number((taxableAmount + tax + shipping).toFixed(2));

    return {
        subtotal,
        discount,
        tax,
        shipping,
        total,
        currency: "USD",
    };
};

const getCart = async (req, res, next) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const items = await enrichCart(cart);
    const totals = await computeTotals(items);

    return res.json({
        ownerKey,
        count: items.length,
        ...totals,
        items,
    });
};

const addItemHandler = async (req, res, next) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const { productId, quantity = 1 } = req.body;
    const normalizedProductId = Number(productId);
    const normalizedQuantity = Number(quantity);

    if (!Number.isInteger(normalizedProductId)) {
        return res.status(400).json({ message: "Valid productId is required" });
    }

    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
        return res.status(400).json({ message: "Quantity must be an integer >= 1" });
    }

    const product = await Product.findOne({ id: normalizedProductId }).lean();
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const existing = cart.items.find((item) => item.productId === normalizedProductId);
    const currentQuantity = existing ? existing.quantity : 0;

    if (currentQuantity + normalizedQuantity > product.stock) {
        return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }

    if (existing) {
        existing.quantity += normalizedQuantity;
    } else {
        cart.items.push({ productId: normalizedProductId, quantity: normalizedQuantity });
    }

    await cart.save();

    const items = await enrichCart(cart);
    const totals = await computeTotals(items);

    return res.status(201).json({
        message: "Item added to cart",
        ownerKey,
        ...totals,
        items,
    });
};

const updateItemQuantity = async (req, res, next) => {
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
    const totals = await computeTotals(items);

    return res.json({
        message: "Cart quantity updated",
        ownerKey,
        ...totals,
        items,
    });
};

const removeItem = async (req, res, next) => {
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
    const totals = await computeTotals(items);

    return res.json({
        message: "Item removed from cart",
        ownerKey,
        ...totals,
        items,
    });
};

const getCartSummary = async (req, res, next) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const items = await enrichCart(cart);
    const totals = await computeTotals(items);

    return res.json({
        ownerKey,
        itemCount: items.length,
        ...totals,
    });
};

const checkout = async (req, res, next) => {
    const ownerKey = getOwnerKey(req);
    const cart = await getOrCreateCart(ownerKey);
    const items = await enrichCart(cart);

    if (items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
    }

    const outOfStockItem = items.find((item) => item.quantity > item.availableStock);
    if (outOfStockItem) {
        return res.status(400).json({
            message: `Item ${outOfStockItem.name} exceeds available stock`,
        });
    }

    const { paymentMethod = "cod", shippingAddress = null, guestInfo = null } = req.body;
    const allowedPaymentMethods = ["card", "paypal", "cod", "wallet"];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ message: "Unsupported payment method" });
    }

    const totals = await computeTotals(items);

    const order = await Order.create({
        id: await getNextId(Order),
        userId: req.actor && req.actor.isAuthenticated ? req.actor.userId : null,
        guestInfo,
        ownerKey,
        status: "placed",
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

    for (const item of items) {
        await Product.updateOne({ id: item.productId }, { $inc: { stock: -item.quantity } });
    }

    if (order.userId) {
        await Notification.create({
            id: await getNextId(Notification),
            userId: order.userId,
            type: "order-confirmation",
            message: `Order #${order.id} placed successfully`,
            createdAt: new Date().toISOString(),
        });
    }

    cart.items = [];
    await cart.save();

    return res.status(201).json({
        message: "Order placed successfully",
        order,
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
