const express = require("express");
const usersController = require("../controllers/users.controller");
const validateRequest = require("../middlewares/validateRequest");
const { userSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/me", usersController.getMe);
router.patch("/me", validateRequest({ body: userSchemas.patchMe }), usersController.patchMe);
router.get("/me/wishlist", usersController.getMyWishlist);
router.post(
    "/me/wishlist/:productId",
    validateRequest({ params: userSchemas.productIdParam }),
    usersController.addToWishlist
);
router.delete(
    "/me/wishlist/:productId",
    validateRequest({ params: userSchemas.productIdParam }),
    usersController.removeFromWishlist
);
router.get("/me/favorites", usersController.getMyFavorites);
router.get("/me/orders", usersController.getMyOrders);
router.get("/me/reviews", usersController.getMyReviews);
router.get("/roles", usersController.getRoles);
router.get("/all", usersController.getAllActiveUsers);

module.exports = router;
