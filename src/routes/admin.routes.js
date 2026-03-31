const express = require("express");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.getUsers);
router.patch("/users/:id/restrict", adminController.restrictUser);
router.delete("/users/:id", adminController.deleteUser);
router.post("/categories", adminController.createCategory);
router.post("/products", adminController.createProduct);
router.patch("/orders/:id/shipping", adminController.updateOrderShipping);

module.exports = router;
