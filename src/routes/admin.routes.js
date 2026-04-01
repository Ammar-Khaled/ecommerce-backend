const express = require("express");
const adminController = require("../controllers/admin.controller");
const validateRequest = require("../middlewares/validateRequest");
const { adminSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.getUsers);
router.patch(
    "/users/:id/restrict",
    validateRequest({ params: adminSchemas.userIdParam, body: adminSchemas.restrictUserBody }),
    adminController.restrictUser
);
router.delete("/users/:id", validateRequest({ params: adminSchemas.userIdParam }), adminController.deleteUser);
router.post("/categories", validateRequest({ body: adminSchemas.createCategory }), adminController.createCategory);
router.post("/products", validateRequest({ body: adminSchemas.createProduct }), adminController.createProduct);
router.patch(
    "/orders/:id/shipping",
    validateRequest({ params: adminSchemas.userIdParam, body: adminSchemas.orderShipping }),
    adminController.updateOrderShipping
);

module.exports = router;
