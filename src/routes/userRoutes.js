const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware")
const router = express.Router();
const uploadfile = require('../middlewares/uploadFile')
const { updatePhoto } = require("../controllers/userController")
const userController = require("../controllers/userController")
const postController = require("../controllers/postController")
const commentController = require("../controllers/commentController")
const shareController = require("../controllers/shareController")

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

router.put("/update-photo",verifyToken,uploadfile.single("logo"),updatePhoto);

router.get("/getAllCandidates", userController.getAllCandidates);
router.get("/getAllCompany", userController.getAllCompany);

router.delete("/delete/:id", verifyToken, authorizeRoles("admin"), userController.DeleteUserById);


router.put("/updateUser",verifyToken,uploadfile.fields([{ name: "logo", maxCount: 1 },{ name: "cover", maxCount: 1 } ]),
  userController.updateUserInfo
);

/////////////////  nbrcompany ////////////////////

router.get("/nbrcompany", userController.nbrcompany);

/////////////////  candidates_count ////////////////////

router.get("/candidates/count", verifyToken, authorizeRoles("admin"), userController.nbrCandidate);


/////////////////  companycondidate_counts ////////////////////


router.get("/companycondidate/counts",verifyToken,authorizeRoles("admin"),userController.getAllUserCounts);


/////////////////  candidates_last-week ////////////////////

router.get("/candidates/last-week",verifyToken,authorizeRoles("admin"),userController.nbrCandidateLastWeek
);

/////////////////  companies-category ////////////////////

router.get("/companies/category/:category", userController.getCompaniesByCategory);


/////////////////  posts-create ////////////////////

router.post("/posts/create",verifyToken,authorizeRoles("candidate", "company"),uploadfile.single("photo"), 
  postController.creerPost
);


/////////////////  posts-update ////////////////////

router.put("/post/update/:id",verifyToken,authorizeRoles("candidate", "company"),uploadfile.single("photo"),postController.updatePost
);

/////////////////  posts-delete ////////////////////

router.delete("/post/delete/:id",verifyToken,authorizeRoles("candidate", "company","admin"),postController.removePost
);

/////////////////  comments-create ////////////////////

router.post("/posts/:postId/comments",verifyToken,authorizeRoles("candidate", "company"),commentController.creercommentaire
);

/////////////////  comments-update ////////////////////

router.put("/comments/:commentId",verifyToken,authorizeRoles("candidate", "company"),commentController.updateCommentaire
);

/////////////////  comments-delete ////////////////////

router.delete("/comments/:commentId",verifyToken,authorizeRoles("candidate", "company"),commentController.deleteCommentaire
);

/////////////////  comments-list ////////////////////

router.get("/posts/:postId/comments",verifyToken,authorizeRoles("candidate", "company", "admin"),commentController.getCommentsByPost
);

/////////////////  share post ////////////////////

router.post("/posts/:id/share",verifyToken,authorizeRoles("candidate", "company"),shareController.sharePost);


module.exports = router;