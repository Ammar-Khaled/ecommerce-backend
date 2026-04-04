const { Order, Product, Notification } = require("../data/models");
const { getNextId } = require("../data/store");
const kashierService = require("./kashier.service");

const METHODS = [
    { code: "card", label: "Credit Card" },
    { code: "wallet", label: "Wallet" },
    { code: "cod", label: "Cash on Delivery" },
];

const getPaymentMethods = () => {
    return METHODS;
};
const confirmWalletPayment = async (orderId, walletPhone, actor) => {
    const order = await Order.findOne({ id: Number(orderId) });

    if (!order) {
        return { error: "Order not found", status: 404 };
    }

    // 🔧 FIX: Allow guests who own the order (match by ownerKey or no userId)
    if (actor && actor.isAuthenticated) {
        // Authenticated user — must be owner or admin
        if (order.userId !== actor.userId && actor.role !== "admin") {
            return { error: "Not allowed", status: 403 };
        }
    } else {
        // Guest — only allow if order has no userId (guest order)
        if (order.userId !== null) {
            return { error: "Authentication required", status: 401 };
        }
    }

    if (order.paymentMethod !== "wallet") {
        return { error: "This order is not a wallet payment", status: 400 };
    }

    if (order.paymentStatus === "paid") {
        return { error: "Order is already paid", status: 400 };
    }

    if (order.status === "cancelled") {
        return { error: "Cannot pay for a cancelled order", status: 400 };
    }

    // ── Everything below is UNCHANGED ──
    order.paymentStatus = "paid";
    order.status = "placed";
    order.walletPhone = walletPhone || null;
    order.updatedAt = new Date().toISOString();

    for (const item of order.items) {
        await Product.updateOne(
            { id: item.productId },
            { $inc: { stock: -item.quantity } }
        );
    }

    await order.save();

    if (order.userId) {
        await Notification.create({
            id: await getNextId(Notification),
            userId: order.userId,
            type: "payment-success",
            message: `Wallet payment for Order #${order.id} was successful`,
        });

        await Notification.create({
            id: await getNextId(Notification),
            userId: order.userId,
            type: "order-confirmation",
            message: `Order #${order.id} placed successfully`,
        });
    }

    return {
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        status: order.status,
    };
};
const createPaymentIntent = async (orderId, actor) => {
    const order = await Order.findOne({ id: Number(orderId) });

    if (!order) {
        return { error: "Order not found", status: 404 };
    }

    if (order.userId !== actor.userId && actor.role !== "admin") {
        return { error: "Not allowed", status: 403 };
    }

    if (order.paymentStatus === "paid") {
        return { error: "Order is already paid", status: 400 };
    }

    if (order.status === "cancelled") {
        return { error: "Cannot pay for a cancelled order", status: 400 };
    }

    if (order.paymentMethod === "cod") {
        return { error: "COD orders do not require online payment", status: 400 };
    }

    const { kashierOrderId, sessionData } = await kashierService.createPaymentSession(order);

    const sessionUrl = sessionData?.response?.sessionUrl
        || sessionData?.response?.url
        || sessionData?.sessionUrl
        || sessionData?.paymentUrl
        || null;

    order.kashierOrderId = kashierOrderId;
    order.kashierSessionUrl = sessionUrl;
    order.updatedAt = new Date().toISOString();
    await order.save();

    return { kashierOrderId, sessionUrl, sessionData, order };
};

const processWebhook = async (body, signatureHeader) => {
    const data = body?.data || body;

    if (data.signatureKeys) {
        const isValid = kashierService.verifyWebhookSignature(data, signatureHeader);
        if (!isValid) {
            return { error: "Invalid signature", status: 400 };
        }
    }

    const merchantOrderId = data.merchantOrderId || data.order;

    if (!merchantOrderId) {
        return { error: "Missing merchantOrderId", status: 400 };
    }

    const order = await Order.findOne({ kashierOrderId: merchantOrderId });

    if (!order) {
        return { error: "Order not found", status: 404 };
    }

    const paymentSuccess = data.status === "SUCCESS" || data.paymentStatus === "SUCCESS";

    order.webhookData = body;
    order.updatedAt = new Date().toISOString();

    if (paymentSuccess) {
        order.paymentStatus = "paid";
        order.status = "placed";

        for (const item of order.items) {
            await Product.updateOne({ id: item.productId }, { $inc: { stock: -item.quantity } });
        }

        if (order.userId) {
            await Notification.create({
                id: await getNextId(Notification),
                userId: order.userId,
                type: "payment-success",
                message: `Payment for Order #${order.id} was successful`,
            });

            await Notification.create({
                id: await getNextId(Notification),
                userId: order.userId,
                type: "order-confirmation",
                message: `Order #${order.id} placed successfully`,
            });
        }
    } else {
        order.paymentStatus = "failed";
        order.status = "cancelled";

        if (order.userId) {
            await Notification.create({
                id: await getNextId(Notification),
                userId: order.userId,
                type: "payment-failed",
                message: `Payment for Order #${order.id} failed`,
            });
        }
    }

    await order.save();

    return { orderId: order.id, paymentStatus: order.paymentStatus };
};

const getStatus = async (orderId, actor) => {
    const order = await Order.findOne({ id: Number(orderId) }).lean();

    if (!order) {
        return { error: "Order not found", status: 404 };
    }

    if (order.userId !== actor.userId && actor.role !== "admin") {
        return { error: "Not allowed", status: 403 };
    }

    return {
        orderId: order.id,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        kashierOrderId: order.kashierOrderId,
        status: order.status,
    };
};

module.exports = {
    getPaymentMethods,
    createPaymentIntent,
    processWebhook,
    getStatus,
    confirmWalletPayment,
};