const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const attachActor = require("./middlewares/actor.middleware");
const authRouter = require("./routes/auth.routes");
const usersRouter = require("./routes/users.routes");
const productsRouter = require("./routes/products.routes");
const cartRouter = require("./routes/cart.routes");
const ordersRouter = require("./routes/orders.routes");
const paymentsRouter = require("./routes/payments.routes");
const adminRouter = require("./routes/admin.routes");
//const sellerRouter = require("./routes/seller.routes");
//const notificationsRouter = require("./routes/notifications.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(attachActor);

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "ecommerce-backend",
    });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);
//app.use("/api/seller", sellerRouter);
//app.use("/api/notifications", notificationsRouter);


app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
});

app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
});

module.exports = app;