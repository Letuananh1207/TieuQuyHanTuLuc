const Word = require("../models/Word");

// Lấy 1 word theo character (tuỳ chọn)
exports.getWordByCharacter = async (req, res) => {
  try {
    const word = await Word.findOne({ character: req.params.character });
    if (!word) return res.status(404).json({ message: "Word không tồn tại" });
    res.json(word);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy các character hợp lệ từ 1 word
exports.getCharacterByWord = async (req, res) => {
  try {
    const { word } = req.query; // ví dụ: ?word=你好

    if (!word) return res.status(400).json({ message: "Thiếu tham số word" });

    const characters = Array.from(word); // tách từng character trong string

    // Query tất cả character có trong DB cùng lúc
    const foundWords = await Word.find({ character: { $in: characters } });

    // Lấy danh sách character hợp lệ
    const validCharacters = foundWords.map((w) => w.character);

    res.json({ valid: validCharacters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
