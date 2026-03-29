const localtunnel = require("localtunnel");

const PORT = Number(process.env.PORT) || 4000;
const SUBDOMAIN = "ecommerce-iti-team";

const startTunnel = async () => {
    const tunnel = await localtunnel({
        port: PORT,
        subdomain: SUBDOMAIN,
    });

    console.log(`\nTunnel URL: ${tunnel.url}`);
    console.log(`Webhook URL: ${tunnel.url}/api/payments/webhook`);
    console.log(`Redirect URL: ${tunnel.url}/payment/result`);
    console.log(`\nAdd these to your .env:`);
    console.log(`KASHIER_WEBHOOK_URL="${tunnel.url}/api/payments/webhook"`);
    console.log(`KASHIER_REDIRECT_URL="${tunnel.url}/payment/result"\n`);

    tunnel.on("close", () => {
        console.log("Tunnel closed");
        process.exit(0);
    });

    tunnel.on("error", (err) => {
        console.error("Tunnel error:", err);
    });
};

startTunnel().catch((err) => {
    console.error("Failed to start tunnel:", err);
    process.exit(1);
});