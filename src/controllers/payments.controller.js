const paymentService = require("../services/payment.service");

const getMethods = (_req, res) => {
    return res.json({ methods: paymentService.getPaymentMethods() });
};
const confirmWallet = async (req, res, next) => {
    try {
        const { orderId, walletPhone } = req.body;
        const result = await paymentService.confirmWalletPayment(orderId, walletPhone, req.actor);

        if (result.error) {
            return res.status(result.status).json({ message: result.error });
        }

        return res.json(result);
    } catch (err) {
        next(err);
    }
};
const createIntent = async (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ message: "orderId is required" });
    }

    const result = await paymentService.createPaymentIntent(orderId, req.actor);

    if (result.error) {
        return res.status(result.status).json({ message: result.error });
    }

    return res.status(201).json({
        message: "Payment session created",
        kashierOrderId: result.kashierOrderId,
        sessionUrl: result.sessionUrl,
        sessionData: result.sessionData,
        order: result.order,
    });
};

const webhook = async (req, res) => {
    const signatureHeader = req.headers["x-kashier-signature"] || req.headers["signature"];
    const result = await paymentService.processWebhook(req.body, signatureHeader);

    if (result.error) {
        return res.status(result.status).json({ message: result.error });
    }

    return res.json({
        message: "Webhook processed",
        orderId: result.orderId,
        paymentStatus: result.paymentStatus,
    });
};

const getPaymentStatus = async (req, res) => {
    if (!req.actor || !req.actor.isAuthenticated) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const result = await paymentService.getStatus(req.params.orderId, req.actor);

    if (result.error) {
        return res.status(result.status).json({ message: result.error });
    }

    return res.json(result);
};

module.exports = {
    getMethods,
    createIntent,
    webhook,
    getPaymentStatus,
    confirmWallet,
};