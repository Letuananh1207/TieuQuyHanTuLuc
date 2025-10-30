const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sendUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiveUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // ✅ không bắt buộc nếu là public
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    public: {
      type: Boolean,
      default: false, // ✅ nếu true → ai cũng có thể xem
    },
  },
  {
    timestamps: true, // ✅ tự tạo createdAt, updatedAt
  }
);

// ✅ Xuất model đúng chuẩn CommonJS
const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
