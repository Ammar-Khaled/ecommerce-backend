const User = require("./user.model");
const Category = require("./category.model");
const Product = require("./product.model");
const Review = require("./review.model");
const SellerProfile = require("./sellerProfile.model");
const Order = require("./order.model");
const Cart = require("./cart.model");
const Notification = require("./notification.model");
const RevokedToken = require("./revokedToken.model");

module.exports = {
    User,
    Category,
    Product,
    Review,
    SellerProfile,
    Order,
    Cart,
    Notification,
    RevokedToken,
};
