const express = require("express");
const usersController = require("../controllers/users.controller");

const router = express.Router();

router.get("/me", usersController.getMe);
router.patch("/me", usersController.patchMe);
router.get("/me/wishlist", usersController.getMyWishlist);
router.post("/me/wishlist/:productId", usersController.addToWishlist);
router.delete("/me/wishlist/:productId", usersController.removeFromWishlist);
router.get("/me/favorites", usersController.getMyFavorites);
router.get("/me/orders", usersController.getMyOrders);
router.get("/me/reviews", usersController.getMyReviews);
router.get("/roles", usersController.getRoles);
router.get("/all", usersController.getAllActiveUsers);

module.exports = router;
