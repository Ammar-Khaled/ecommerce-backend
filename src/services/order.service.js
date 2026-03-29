const { Order, Product, Notification } = require("../data/models");
const { getNextId } = require("../data/store");

const canViewOrder = (order, actor) => {
    if (!actor || !actor.isAuthenticated) return false;
    if (actor.role === "admin") return true;
    if (order.userId === actor.userId) return true;
    return order.items.some((item) => item.sellerId === actor.userId);
};

const getOrdersByRole = async (actor) => {
    if (actor.role === "admin") {
        return Order.find({}).sort({ id: -1 }).lean();
    }

    if (actor.role === "seller") {
        return Order.find({ "items.sellerId": actor.userId }).sort({ id: -1 }).lean();
    }

    return Order.find({ userId: actor.userId }).sort({ id: -1 }).lean();
};

const findOrderById = async (orderId) => {
    return Order.findOne({ id: Number(orderId) }).lean();
};

const findOrderByIdRaw = async (orderId) => {
    return Order.findOne({ id: Number(orderId) });
};

const updateStatus = async (orderId, status, actor) => {
    const allowedStatuses = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

    if (!status || !allowedStatuses.includes(status)) {
        return { error: "Invalid status", status: 400 };
    }

    const order = await findOrderByIdRaw(orderId);
    if (!order) {
        return { error: "Order not found", status: 404 };
    }

    const isAdmin = actor.role === "admin";
    const isSellerOnOrder = order.items.some((item) => item.sellerId === actor.userId);

    if (!isAdmin && !isSellerOnOrder) {
        return { error: "Only admin or order seller can update status", status: 403 };
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

    return { order };
};

const cancelOrderById = async (orderId, actor) => {
    const order = await findOrderByIdRaw(orderId);
    if (!order) {
        return { error: "Order not found", status: 404 };
    }

    const isAdmin = actor.role === "admin";
    const isOwner = order.userId === actor.userId;

    if (!isAdmin && !isOwner) {
        return { error: "Not allowed to cancel this order", status: 403 };
    }

    const nonCancellable = ["shipped", "delivered", "cancelled"];
    if (nonCancellable.includes(order.status)) {
        return { error: `Cannot cancel order with status '${order.status}'`, status: 400 };
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

    return { order };
};

module.exports = {
    canViewOrder,
    getOrdersByRole,
    findOrderById,
    updateStatus,
    cancelOrderById,
};