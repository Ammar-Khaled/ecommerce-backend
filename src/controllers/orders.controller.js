const { Order, Product, Notification } = require("../data/models");
const { getNextId } = require("../data/store");

const requireAuth = (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        res.status(401).json({ message: "Authentication required" });
        return false;
    }
    return true;
};

const canViewOrder = (order, actor) => {
    if (!actor || !actor.isAuthenticated) return false;
    if (actor.role === "admin") return true;
    if (order.userId === actor.userId) return true;
    return order.items.some((item) => item.sellerId === actor.userId);
};

const listOrders = async (req, res) => {
    if (!requireAuth(req, res)) return;

    const actor = req.actor;

    if (actor.role === "admin") {
        const orders = await Order.find({}).sort({ id: -1 }).lean();
        return res.json({ count: orders.length, orders });
    }

    if (actor.role === "seller") {
        const sellerOrders = await Order.find({ "items.sellerId": actor.userId }).sort({ id: -1 }).lean();
        return res.json({ count: sellerOrders.length, orders: sellerOrders });
    }

    const customerOrders = await Order.find({ userId: actor.userId }).sort({ id: -1 }).lean();
    return res.json({ count: customerOrders.length, orders: customerOrders });
};

const getOrderById = async (req, res) => {
    const orderId = Number(req.params.id);
    const order = await Order.findOne({ id: orderId }).lean();

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    if (!canViewOrder(order, req.actor)) {
        return res.status(403).json({ message: "Not allowed to view this order" });
    }

    return res.json(order);
};

const updateOrderStatus = async (req, res) => {
    if (!requireAuth(req, res)) return;

    const actor = req.actor;
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const isAdmin = actor.role === "admin";
    const isSellerOnOrder = order.items.some((item) => item.sellerId === actor.userId);

    if (!isAdmin && !isSellerOnOrder) {
        return res.status(403).json({ message: "Only admin or order seller can update status" });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    await order.save();

    if (order.userId) {
        await Notification.create({
            id: await getNextId(Notification),
            userId: order.userId,
            type: "order-status",
            message: `Order #${order.id} status updated to ${status}`,
        });
    }

    return res.json({ message: "Order status updated", order });
};

const cancelOrder = async (req, res) => {
    if (!requireAuth(req, res)) return;

    const actor = req.actor;
    const orderId = Number(req.params.id);

    const order = await Order.findOne({ id: orderId });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    const isAdmin = actor.role === "admin";
    const isOwner = order.userId === actor.userId;

    if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Not allowed to cancel this order" });
    }

    const nonCancellable = ["shipped", "delivered", "cancelled"];
    if (nonCancellable.includes(order.status)) {
        return res.status(400).json({ message: `Cannot cancel order with status '${order.status}'` });
    }

    const wasStockDeducted = ["placed", "confirmed", "processing"].includes(order.status);

    order.status = "cancelled";
    order.updatedAt = new Date().toISOString();
    await order.save();

    if (wasStockDeducted) {
        for (const item of order.items) {
            await Product.updateOne({ id: item.productId }, { $inc: { stock: item.quantity } });
        }
    }

    if (order.userId) {
        await Notification.create({
            id: await getNextId(Notification),
            userId: order.userId,
            type: "order-cancelled",
            message: `Order #${order.id} has been cancelled`,
        });
    }

    return res.json({ message: "Order cancelled", order });
};

module.exports = {
    listOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
};