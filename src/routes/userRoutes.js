const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware")
const router = express.Router();
const uploadfile = require('../middlewares/uploadFile')
const { updatePhoto } = require("../controllers/userController")
const userController = require("../controllers/userController")

//only admin can access this route
router.get("/admin", verifyToken, authorizeRoles("admin"), (req, res) => {
    res.json({ message: "welcome admin" });

});
//only admin and recruter  can access this route
router.get("/company", verifyToken,authorizeRoles("admin","company"), (req, res) => {
    res.json({ message: "welcom company" });
});

//all can access this route
router.get("/candidate", verifyToken,authorizeRoles("admin","candidate","company"), (req, res) => {
    res.json({ message: "welcom candidate" });
});

router.put("/update-photo",verifyToken,uploadfile.single("image_User"),updatePhoto);

router.get("/getAllCandidates", userController.getAllCandidates);
router.get("/getAllCompany", userController.getAllCompany);
module.exports = router;