const crypto = require("crypto");
const queryString = require("query-string");
const _ = require("underscore");

const buildKashierHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: process.env.KASHIER_SECRET_KEY,
    "api-key": process.env.KASHIER_API_KEY,
});

const createPaymentSession = async (order) => {
    const kashierOrderId = `ORDER-${order.id}-${Date.now()}`;

    const response = await fetch(`${process.env.KASHIER_URL}/v3/payment/sessions`, {
        method: "POST",
        headers: buildKashierHeaders(),
        body: JSON.stringify({
            paymentType: "credit",
            amount: order.total.toString(),
            currency: "EGP",
            order: kashierOrderId,
            display: "en",
            allowedMethods: "card,wallet",
            merchantRedirect: process.env.KASHIER_REDIRECT_URL || "http://localhost:4200/payment/result",
            redirectMethod:  "GET",
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
        }),
    });

    const sessionData = await response.json();

    if (!response.ok) {
        const message = sessionData?.message || sessionData?.error || `Kashier request failed with status ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.details = sessionData;
        throw error;
    }

    return {
        kashierOrderId,
        sessionData,
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