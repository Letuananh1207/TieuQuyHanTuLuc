const express = require("express");
const {
  sendMessage,
  getMessages,
  deleteMessage,
  editMessage,
  sendPaymentNotification, // <-- thêm vào
} = require("../controllers/messageController");

const router = express.Router();

router.post("/", sendMessage); // gửi tin
router.get("/", getMessages); // lấy tin
router.put("/:id", editMessage); // Chỉnh sửa
router.delete("/:id", deleteMessage); // Xóa tin nhắn theo ID

// Route gửi thông báo thanh toán
router.post("/payment-notification", sendPaymentNotification);

module.exports = router;
