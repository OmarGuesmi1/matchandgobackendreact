const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel"); // adapte le chemin !
const Reply = require("../models/replyModel");      // 👈 add this
const Reaction = require("../models/reactionModel"); // 👈 add this

// ✅ Créer un commentaire
module.exports.creercommentaire = async (req, res) => {
  try {
    // Vérifier le token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    // Vérifier rôle
    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Only candidates and companies can create comments." });
    }

    // Récupérer le contenu et l'ID du post depuis req.params
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "The content of the comment is required." });
    }

    // Vérifier que le post existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Créer le commentaire
    const newComment = new Comment({
      content,
      post: post._id,
      author: connectedUser._id,
    });

    await newComment.save();

    res.status(201).json({
      message: "Comment created successfully",
      comment: newComment,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error", error: error.message });
  }
};


// ✅ update  commentaire

module.exports.updateCommentaire = async (req, res) => {
  try {
    // Vérifier le token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    // Vérifier rôle
    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Only candidates and companies can edit comments." });
    }

    // Récupérer l'ID du commentaire et le nouveau contenu
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "The content of the comment is required." });
    }

    // Vérifier que le commentaire existe
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Vérifier que l'auteur du commentaire correspond à l'utilisateur connecté
    if (comment.author.toString() !== connectedUser._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own comments." });
    }

    // Mettre à jour le commentaire
    comment.content = content;
    await comment.save();

    res.status(200).json({
      message: "Comment updated successfully",
      comment,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error", error: error.message });
  }
};




// ✅ Delete a comment
module.exports.deleteCommentaire = async (req, res) => {
  try {
    // 🔑 Check token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    // 🔑 Check role
    if (!connectedUser || !["candidate", "company", "admin"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Only candidates, companies, or admins can delete comments." });
    }

    // 📌 Get comment ID
    const { commentId } = req.params;

    // 📌 Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // ✅ Author can delete only their own comment (unless admin)
    if (
      connectedUser.role !== "admin" &&
      comment.author.toString() !== connectedUser._id.toString()
    ) {
      return res.status(403).json({ message: "You can only delete your own comments unless you are an admin." });
    }

    // 🔄 Delete replies linked to this comment
    await Reply.deleteMany({ comment: commentId });

    // 🔄 Delete reactions linked to this comment
    await Reaction.deleteMany({ comment: commentId });

    // 🔄 Finally, delete the comment
    await comment.deleteOne();

    res.status(200).json({
      message: "Comment, related replies, and reactions deleted successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// ✅ Get all comments for a post
module.exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Vérifier que le post existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Récupérer les commentaires liés à ce post
    const comments = await Comment.find({ post: postId })
      .populate("author", "username email role") // ramène juste quelques infos de l'auteur
      .sort({ createdAt: -1 }); // les plus récents en premier

    res.status(200).json({
      message: "Comments fetched successfully",
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

///////////////// comment count post ////////////////////

module.exports.countComment = async (req, res) => {
  try {
    // Vérifier le token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Only candidates and companies can view comments." });
    }

    // Récupérer le postId depuis l'URL
    const postId = req.params.id;

    // Vérifier que le post existe
    const postExists = await Post.exists({ _id: postId });
    if (!postExists) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Compter les commentaires
    const commentCount = await Comment.countDocuments({ post: postId });

    return res.status(200).json({ commentCount });
  } catch (error) {
    console.error("Error while counting comments:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};