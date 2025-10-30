const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendPaymentNotification } = require("./messageController"); // hàm vừa tạo
const {
  createPaymentNotification,
} = require("../controllers/messageController");

// Lấy thông tin user hiện tại
exports.getCurrentUser = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-__v");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Tính remainingDays nếu có premium
    if (user.premium?.expiresAt) {
      const remaining =
        Math.ceil(
          (new Date(user.premium.expiresAt) - new Date()) /
            (1000 * 60 * 60 * 24)
        ) || 0;
      user.premium.remainingDays = remaining;
      user.premium.active = remaining > 0;
    }

    res.json(user);
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Add / gia hạn premium cho user
exports.addPremium = async (req, res) => {
  const { id, plan, sendUser } = req.body;

  if (!id) return res.status(400).json({ error: "Missing user ID" });
  if (!["3_days", "6_months", "12_months"].includes(plan))
    return res.status(400).json({ error: "Invalid plan" });

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const now = new Date();
    const currentExpire = user.premium?.expiresAt
      ? new Date(user.premium.expiresAt)
      : null;

    // Base time: nếu còn hạn thì cộng dồn, hết hạn thì tính lại từ hiện tại
    const baseDate =
      currentExpire && currentExpire.getTime() > now.getTime()
        ? currentExpire
        : now;

    // Cộng thêm thời gian tương ứng
    let newExpires = new Date(baseDate);
    switch (plan) {
      case "3_days":
        newExpires.setDate(newExpires.getDate() + 3);
        break;
      case "6_months":
        newExpires.setMonth(newExpires.getMonth() + 6);
        break;
      case "12_months":
        newExpires.setFullYear(newExpires.getFullYear() + 1);
        break;
    }

    // Cập nhật thông tin premium
    user.premium = {
      plan,
      expiresAt: newExpires,
      active: true,
    };

    await user.save();

    // Gửi thông báo (nếu có)
    try {
      await createPaymentNotification({
        sendUser,
        receiveEmail: user.email,
        plan,
      });
    } catch (msgErr) {
      console.error("Lỗi khi gửi tin nhắn thông báo thanh toán:", msgErr);
    }

    res.json({
      success: true,
      message: `User ${user.email} đã được nâng cấp ${plan}`,
      premium: user.premium,
    });
  } catch (err) {
    console.error("Error in addPremium:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.cancelPremium = async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "Missing user ID" });

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Nếu chưa có hoặc đã hết hạn / không active
    if (!user.premium || !user.premium.active) {
      return res
        .status(400)
        .json({ error: "User không có gói premium đang hoạt động" });
    }

    // Hủy gói premium
    user.premium.active = false;
    user.premium.expiresAt = new Date(); // đánh dấu hết hạn ngay
    await user.save();

    console.log("Ok");
    res.json({
      success: true,
      message: `Đã hủy gói premium của ${user.email}.`,
      premium: user.premium,
    });
  } catch (err) {
    console.error("Error in cancelPremium:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Lấy thông tin user theo email
exports.getUserByEmail = async (req, res) => {
  const { email } = req.params; // hoặc req.body nếu bạn gửi qua body

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ email }).select("-__v"); // ẩn password và __v
    if (!user) return res.status(404).json({ error: "User not found" });

    // Nếu user có premium, tính remainingDays
    if (user.premium?.expiresAt) {
      const remaining =
        Math.ceil(
          (new Date(user.premium.expiresAt) - new Date()) /
            (1000 * 60 * 60 * 24)
        ) || 0;
      user.premium.remainingDays = remaining;
      user.premium.active = remaining > 0;
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user by email:", err);
    res.status(500).json({ error: "Server error" });
  }
};
