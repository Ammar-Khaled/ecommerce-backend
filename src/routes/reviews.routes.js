const express = require("express");
const reviewsController = require("../controllers/reviews.controller");
const validateRequest = require("../middlewares/validateRequest");
const { productSchemas } = require("../validation/schemas");

const router = express.Router();

router.get("/", reviewsController.getAllReviews);
router.delete("/:id", validateRequest({ params: productSchemas.idParam }), reviewsController.deleteReview);

module.exports = router;
