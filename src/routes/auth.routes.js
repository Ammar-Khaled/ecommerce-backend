const express = require("express");
const authController = require("../controllers/auth.controller");
const validateRequest = require("../middlewares/validateRequest");
const { authSchemas } = require("../validation/schemas");

const router = express.Router();

router.post("/register", validateRequest({ body: authSchemas.register }), authController.register);
router.post("/login", validateRequest({ body: authSchemas.login }), authController.login);
router.post("/logout", authController.logout);
router.post("/verify-email", validateRequest({ body: authSchemas.verifyEmail }), authController.verifyEmail);
router.post("/forgot-password", validateRequest({ body: authSchemas.forgotPassword }), authController.forgotPassword);
router.put(
    "/reset-password/:token",
    validateRequest({ params: authSchemas.resetPasswordParams, body: authSchemas.resetPasswordBody }),
    authController.resetPassword
);
router.get("/check-auth", authController.checkAuth);

module.exports = router;
