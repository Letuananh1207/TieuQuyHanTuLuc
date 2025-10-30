const express = require("express");
const router = express.Router();

// Import tất cả word routes từ wordRoutes.js
const wordRoutes = require("./wordRoutes");
const messageRoutes = require("./messageRoutes");
const userRoutes = require("./userRoutes");

router.use("/words", wordRoutes);
router.use("/messages", messageRoutes);
router.use("/", userRoutes);

module.exports = router;
