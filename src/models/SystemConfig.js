// models/SystemConfig.js
const mongoose = require("mongoose");

const systemConfigSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
});

module.exports = mongoose.model("SystemConfig", systemConfigSchema);
