const { Order, Product, Notification } = require("../data/models");
const { getNextId } = require("../data/store");
const kashierService = require("../services/kashier.service");

const methods = [
    { code: "card", label: "Credit Card" },
    { code: "wallet", label: "Wallet" },
    { code: "cod", label: "Cash on Delivery" },
];

const getMethods = (_req, res) => {
    return res.json({ methods });
};

const createIntent = async (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ message: "orderId is required" });
    }

    const order = await Order.findOne({ id: Number(orderId) });

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.actor.userId && req.actor.role !== "admin") {
        return res.status(403).json({ message: "Not allowed" });
    }

    if (order.paymentStatus === "paid") {
        return res.status(400).json({ message: "Order is already paid" });
    }

    if (order.status === "cancelled") {
        return res.status(400).json({ message: "Cannot pay for a cancelled order" });
    }

    if (order.paymentMethod === "cod") {
        return res.status(400).json({ message: "COD orders do not require online payment" });
    }

    const { kashierOrderId, sessionData } = await kashierService.createPaymentSession(order);

    order.kashierOrderId = kashierOrderId;

    const sessionUrl = sessionData?.response?.sessionUrl || sessionData?.response?.url || null;
    if (sessionUrl) {
        order.kashierSessionUrl = sessionUrl;
    }

    order.updatedAt = new Date().toISOString();
    await order.save();

    return res.status(201).json({
        message: "Payment session created",
        kashierOrderId,
        sessionUrl,
        sessionData,
        order,
    });
};

const webhook = async (req, res) => {
    const data = req.body?.data || req.body;
    const signatureHeader = req.headers["x-kashier-signature"] || req.headers["signature"];

    if (data.signatureKeys) {
        const isValid = kashierService.verifyWebhookSignature(data, signatureHeader);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid signature" });
        }
    }

    const merchantOrderId = data.merchantOrderId || data.order;

    if (!merchantOrderId) {
        return res.status(400).json({ message: "Missing merchantOrderId" });
    }

    const order = await Order.findOne({ kashierOrderId: merchantOrderId });

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const paymentSuccess = data.status === "SUCCESS" || data.paymentStatus === "SUCCESS";

    order.webhookData = req.body;
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

    return res.json({ message: "Webhook processed", orderId: order.id, paymentStatus: order.paymentStatus });
};

const getPaymentStatus = async (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const orderId = Number(req.params.orderId);
    const order = await Order.findOne({ id: orderId }).lean();

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.actor.userId && req.actor.role !== "admin") {
        return res.status(403).json({ message: "Not allowed" });
    }

    return res.json({
        orderId: order.id,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        kashierOrderId: order.kashierOrderId,
        status: order.status,
    });
};

module.exports = {
    getMethods,
    createIntent,
    webhook,
    getPaymentStatus,
};