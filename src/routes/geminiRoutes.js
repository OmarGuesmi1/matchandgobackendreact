const express = require("express");
const multer = require("multer");
const { handleGeminiRequest } = require("../controllers/geminiController");

const router = express.Router();
const uploads = multer({ dest: "uploads/" });

// Route POST
router.post("/get", uploads.single("file"), handleGeminiRequest);

module.exports = router;
