const orderService = require("../services/order.service");

const requireAuth = (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        res.status(401).json({ message: "Authentication required" });
        return false;
    }
    return true;
};

const listOrders = async (req, res) => {
    if (!requireAuth(req, res)) return;

    const orders = await orderService.getOrdersByRole(req.actor);
    return res.json({ count: orders.length, orders });
};

const getOrderById = async (req, res) => {
    const order = await orderService.findOrderById(req.params.id);

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    if (!orderService.canViewOrder(order, req.actor)) {
        return res.status(403).json({ message: "Not allowed to view this order" });
    }

    return res.json(order);
};

const updateOrderStatus = async (req, res) => {
    if (!requireAuth(req, res)) return;

    const result = await orderService.updateStatus(req.params.id, req.body.status, req.actor);

    if (result.error) {
        return res.status(result.status).json({ message: result.error });
    }

    return res.json({ message: "Order status updated", order: result.order });
};

const cancelOrder = async (req, res) => {
    if (!requireAuth(req, res)) return;

    const result = await orderService.cancelOrderById(req.params.id, req.actor);

    if (result.error) {
        return res.status(result.status).json({ message: result.error });
    }

    return res.json({ message: "Order cancelled", order: result.order });
};

module.exports = {
    listOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
};