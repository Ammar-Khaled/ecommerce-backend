const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const connectDatabase = require("./config/db");

const PORT = Number(process.env.PORT) || 4000;

const startServer = async () => {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Backend API running on http://localhost:${PORT}`);
    });
};

startServer().catch((error) => {
    console.error("Failed to start backend", error);
    process.exit(1);
});
