const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1); // Dừng server nếu kết nối thất bại
  }
};

module.exports = connectDB;
