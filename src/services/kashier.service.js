const axios = require("axios");
const crypto = require("crypto");
const queryString = require("query-string");
const _ = require("underscore");

const httpClient = axios.create({
    baseURL: process.env.KASHIER_URL,
    headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.KASHIER_SECRET_KEY,
        "api-key": process.env.KASHIER_API_KEY,
    },
});

const createPaymentSession = async (order) => {
    const kashierOrderId = `ORDER-${order.id}-${Date.now()}`;

    const response = await httpClient.post("/v3/payment/sessions", {
        paymentType: "credit",
        amount: order.total.toString(),
        currency: "EGP",
        order: kashierOrderId,
        display: "en",
        allowedMethods: "card,wallet",
        merchantRedirect: process.env.KASHIER_REDIRECT_URL || "http://localhost:4200/payment/result",
        redirectMethod: null,
        failureRedirect: false,
        iframeBackgroundColor: "#FFFFFF",
        merchantId: process.env.KASHIER_MERCHANT_ID,
        brandColor: "#5020FF",
        defaultMethod: "card",
        description: `Payment for order #${order.id}`,
        manualCapture: false,
        saveCard: "none",
        interactionSource: "ECOMMERCE",
        enable3DS: true,
        serverWebhook: process.env.KASHIER_WEBHOOK_URL || "http://localhost:4000/api/payments/webhook",
        notes: `Order #${order.id}`,
    });

    return {
        kashierOrderId,
        sessionData: response?.data,
    };
};

const verifyWebhookSignature = (data, signatureHeader) => {
    const sortedKeys = [...data.signatureKeys].sort();
    const objectSignaturePayload = _.pick(data, sortedKeys);
    const signaturePayload = queryString.stringify(objectSignaturePayload);

    const signature = crypto
        .createHmac("sha256", process.env.KASHIER_API_KEY)
        .update(signaturePayload)
        .digest("hex");

    return signatureHeader === signature;
};

module.exports = {
    createPaymentSession,
    verifyWebhookSignature,
};