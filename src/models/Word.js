const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema(
  {
    character: {
      type: String,
      required: true,
      unique: true,
    },
    pinyin: {
      type: String,
    },
    hanviet: {
      type: String,
    },
    meaning: {
      type: Array,
      required: true,
    },
    cachnho_content: {
      type: String,
    },
    cachnho_img: {
      type: String,
    },
    nguongoc_content: {
      type: String,
    },
    nguongoc_img: {
      type: String,
    },
    mp3: {
      type: String, // sửa chữ s viết hoa
    },
    phonthe: {
      type: String,
    },
    tughep: {
      type: Array,
    },
  },
  {
    timestamps: true, // tự động tạo createdAt và updatedAt
  }
);

const Word = mongoose.model("Word", wordSchema);

module.exports = Word;
