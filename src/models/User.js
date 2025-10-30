const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  displayName: String,
  email: String,
  photo: String,
  role: { type: String, enum: ["user", "admin"], default: "user" }, // <-- thêm role
  premium: {
    plan: {
      type: String,
      enum: ["3_days", "6_months", "12_months"],
      default: "3_days",
    },
    expiresAt: {
      type: Date,
      default: function () {
        const base = this.createdAt || new Date();
        return new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 ngày
      },
    },
    active: { type: Boolean, default: true },
  },
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },

  createdAt: { type: Date, default: Date.now },
});

// Pre-save hook để gán premium mặc định nếu cần
userSchema.pre("save", function (next) {
  if (this.isNew && !this.premium?.expiresAt) {
    const base = this.createdAt || new Date();
    this.premium = {
      plan: "3_days",
      expiresAt: new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000),
      active: true,
    };
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
