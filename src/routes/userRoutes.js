const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware")
const router = express.Router();

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


module.exports = router;