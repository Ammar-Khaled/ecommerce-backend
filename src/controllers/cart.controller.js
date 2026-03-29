const cartService = require("../services/cart.service");

const getCart = async (req, res) => {
    const ownerKey = cartService.getOwnerKey(req);
    const { items, totals } = await cartService.getCartWithDetails(ownerKey);

    return res.json({ ownerKey, count: items.length, ...totals, items });
};

const addItemHandler = async (req, res) => {
    const ownerKey = cartService.getOwnerKey(req);
    const { productId, quantity = 1 } = req.body;

    const result = await cartService.addItem(ownerKey, productId, quantity);

    if (result.error) {
        return res.status(result.status).json({ message: result.error });
    }

    return res.status(201).json({
        message: "Item added to cart",
        ownerKey,
        ...result.totals,
        items: result.items,
    });
};

const updateItemQuantity = async (req, res) => {
    const ownerKey = cartService.getOwnerKey(req);
    const result = await cartService.updateQuantity(ownerKey, req.params.productId, req.body.quantity);

    if (result.error) {
        return res.status(result.status).json({ message: result.error });
    }

    return res.json({
        message: "Cart quantity updated",
        ownerKey,
        ...result.totals,
        items: result.items,
    });
};

const removeItem = async (req, res) => {
    const ownerKey = cartService.getOwnerKey(req);
    const result = await cartService.removeItemFromCart(ownerKey, req.params.productId);

    if (result.error) {
        return res.status(result.status).json({ message: result.error });
    }

    return res.json({
        message: "Item removed from cart",
        ownerKey,
        ...result.totals,
        items: result.items,
    });
};

const getCartSummary = async (req, res) => {
    const ownerKey = cartService.getOwnerKey(req);
    const { itemCount, totals } = await cartService.getSummary(ownerKey);

    return res.json({ ownerKey, itemCount, ...totals });
};

const checkout = async (req, res) => {
    const ownerKey = cartService.getOwnerKey(req);
    const result = await cartService.processCheckout(ownerKey, req.actor, req.body);

    if (result.error) {
        return res.status(result.status).json({ message: result.error });
    }

    if (result.isCod) {
        return res.status(201).json({ message: "Order placed successfully", order: result.order });
    }

    return res.status(201).json({
        message: "Order created. Proceed to payment.",
        order: result.order,
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