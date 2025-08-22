const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Post = require("../models/postModel");
const Share = require("../models/shareModel");


//////////// sharePost ///////////////

module.exports.sharePost = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Only candidates and companies can share posts." });
    }

    // 🔥 récupérer l'id du post depuis l'URL
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const alreadyShared = await Share.findOne({ post: postId, sharedBy: connectedUser._id });
    if (alreadyShared) {
      return res.status(400).json({ message: "You have already shared this post." });
    }

    const newShare = new Share({
      post: postId,
      sharedBy: connectedUser._id
    });

    await newShare.save();

    return res.status(201).json({
      message: "Post shared successfully.",
      share: newShare
    });
  } catch (error) {
    console.error("Error while sharing post:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

