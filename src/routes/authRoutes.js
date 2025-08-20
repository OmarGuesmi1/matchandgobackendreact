const express = require("express")
const {register, login} = require("../controllers/authController")
const userController = require("../controllers/userController")
const uploadfile = require('../middlewares/uploadFile')

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

module.exports = router;