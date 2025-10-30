const User = require("../models/User");
const Message = require("../models/Message");
const { SuccessPaymentMessage } = require("../ultities/messageTemplate"); // hàm vừa tạo

// 📤 Gửi tin nhắn
const sendMessage = async (req, res) => {
  try {
    const {
      sendUser,
      receiveEmail,
      title,
      content,
      public: isPublic,
    } = req.body;

    if (!sendUser || !title || !content) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết." });
    }

    let receiveUser = null;

    // ✅ Nếu là tin riêng tư thì phải có email người nhận
    if (!isPublic) {
      if (!receiveEmail) {
        return res.status(400).json({ message: "Thiếu email người nhận." });
      }

      const receiver = await User.findOne({ email: receiveEmail });
      if (!receiver) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người nhận với email này." });
      }

      receiveUser = receiver._id;
    }

    // ✅ Tạo tin nhắn
    const message = await Message.create({
      sendUser,
      receiveUser,
      title,
      content,
      public: !!isPublic,
    });

    // ✅ Cập nhật latestMessage cho người nhận
    if (isPublic) {
      // Tin nhắn công khai → tất cả user khác đều lưu latestMessage
      await User.updateMany(
        { _id: { $ne: sendUser } },
        { $set: { latestMessage: message._id } }
      );
    } else if (receiveUser) {
      // Tin nhắn riêng → chỉ người nhận lưu latestMessage
      await User.findByIdAndUpdate(receiveUser, {
        $set: { latestMessage: message._id },
      });
    }

    return res.status(201).json({
      message: "Gửi tin nhắn thành công.",
      data: message,
    });
  } catch (error) {
    console.error("❌ Lỗi khi gửi tin nhắn:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

// 📬 Lấy danh sách tin nhắn
const getMessages = async (req, res) => {
  try {
    const { userId } = req.query;

    const query = userId
      ? {
          $or: [
            { receiveUser: userId },
            { sendUser: userId },
            { public: true },
          ],
        }
      : { public: true };

    const messages = await Message.find(query)
      .populate("sendUser", "displayName email")
      .populate("receiveUser", "displayName email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      message: "Lấy tin nhắn thành công.",
      data: messages,
    });
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

// ✏️ Chỉnh sửa tin nhắn
const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, public: isPublic } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Thiếu id tin nhắn cần chỉnh sửa." });
    }

    if (!title && !content && typeof isPublic === "undefined") {
      return res
        .status(400)
        .json({ message: "Không có dữ liệu cần cập nhật." });
    }

    const updated = await Message.findByIdAndUpdate(
      id,
      { title, content, public: isPublic },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tin nhắn để chỉnh sửa." });
    }

    res.status(200).json({
      message: "Cập nhật tin nhắn thành công.",
      data: updated,
    });
  } catch (error) {
    console.error("Lỗi khi chỉnh sửa tin nhắn:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

// 🗑️ Xóa tin nhắn theo ID
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Thiếu id tin nhắn cần xóa." });
    }

    const deleted = await Message.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn." });
    }

    res.status(200).json({
      message: "Xóa tin nhắn thành công.",
      data: deleted,
    });
  } catch (error) {
    console.error("Lỗi khi xóa tin nhắn:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

// 📤 Gửi thông báo thanh toán gói thành công
const sendPaymentNotification = async (req, res) => {
  try {
    const { sendUser, receiveEmail, plan } = req.body || {};

    // Kiểm tra dữ liệu đầu vào
    if (!sendUser) return res.status(400).json({ message: "Thiếu sendUser." });
    if (!receiveEmail)
      return res.status(400).json({ message: "Thiếu receiveEmail." });
    if (!plan || !["6_months", "12_months"].includes(plan)) {
      return res.status(400).json({ message: "Gói thanh toán không hợp lệ." });
    }

    // Tìm người nhận
    const receiver = await User.findOne({ email: receiveEmail });
    if (!receiver)
      return res.status(404).json({ message: "Không tìm thấy người nhận." });

    // Lấy title và content từ hàm tiện ích
    const { title, content } = SuccessPaymentMessage({
      userName: receiver.displayName || receiver.email,
      plan,
      startDate: new Date(), // bạn có thể thay bằng ngày bắt đầu thực tế
      endDate:
        plan === "6_months"
          ? new Date(new Date().setMonth(new Date().getMonth() + 6))
          : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    });

    // Tạo tin nhắn
    const message = await Message.create({
      sendUser,
      receiveUser: receiver._id,
      title,
      content,
      public: false, // luôn riêng tư
    });

    res.status(201).json({
      message: "Đã gửi thông báo thanh toán thành công.",
      data: message,
    });
  } catch (error) {
    console.error("Lỗi khi gửi thông báo thanh toán:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

// 📤 Gửi thông báo thanh toán gói thành công (logic)
const createPaymentNotification = async ({
  sendUser,
  receiveEmail,
  plan,
  startDate,
  endDate,
}) => {
  if (!sendUser || !receiveEmail || !plan) {
    throw new Error("Thiếu thông tin cần thiết.");
  }

  const receiver = await User.findOne({ email: receiveEmail });
  if (!receiver) throw new Error("Không tìm thấy người nhận.");

  // Lấy title và content từ hàm tiện ích
  const { title, content } = SuccessPaymentMessage({
    userName: receiver.displayName || receiver.email,
    plan,
    startDate: startDate || new Date(), // ngày bắt đầu
    endDate:
      endDate ||
      (plan === "6_months"
        ? new Date(new Date().setMonth(new Date().getMonth() + 6))
        : new Date(new Date().setFullYear(new Date().getFullYear() + 1))), // ngày kết thúc
  });

  // ✅ Tạo tin nhắn riêng tư
  const message = await Message.create({
    sendUser,
    receiveUser: receiver._id,
    title,
    content,
    public: false, // luôn là riêng tư
  });

  // ✅ Cập nhật latestMessage cho người nhận
  await User.findByIdAndUpdate(receiver._id, {
    $set: { latestMessage: message._id },
  });

  return message;
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  sendPaymentNotification,
  createPaymentNotification,
};
