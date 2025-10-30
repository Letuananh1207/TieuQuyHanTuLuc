const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Lấy thông tin user hiện tại
router.get("/current_user", userController.getCurrentUser);

// Add / gia hạn premium
router.post("/upgrade_plan", userController.addPremium);

// Hủy premium
router.post("/cancel_premium", userController.cancelPremium);

// Lấy user theo email
router.get("/email/:email", userController.getUserByEmail);

module.exports = router;
