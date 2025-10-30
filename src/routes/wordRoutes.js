const express = require("express");
const router = express.Router();
const wordController = require("../controllers/wordController");

// Lấy 1 word theo character
router.get("/char/:character", wordController.getWordByCharacter);

router.get("/", wordController.getCharacterByWord);
module.exports = router;
