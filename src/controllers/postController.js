const jwt = require("jsonwebtoken");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const Comment = require("../models/commentModel");
const Reaction = require("../models/reactionModel");



module.exports.creerPost = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Seuls les candidats et entreprises peuvent créer des posts." });
    }

    const content = req.body.content;
    if (!content) return res.status(400).json({ message: "Le contenu du post est requis." });

    // mediaUrl pour les fichiers secondaires et photo pour l'image principale
    const mediaUrl = req.body.mediaUrl || undefined;
    const photo = req.file ? `/images/${req.file.filename}` : undefined;

    const post = new Post({
      author: connectedUser._id,
      content,
      mediaUrl,
      photo
    });

    await post.save();
    res.status(201).json({ message: "Post créé avec succès", post });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};



module.exports.updatePost = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Only candidates and companies can update posts." });
    }

    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: "Post not found." });
    if (!post.author.equals(connectedUser._id)) {
      return res.status(403).json({ message: "You can only update your own posts." });
    }

    // Retrieve data to update
    const { content, mediaUrl } = req.body;
    if (content) post.content = content;
    if (mediaUrl) post.mediaUrl = mediaUrl;
    if (req.file) post.photo = `/images/${req.file.filename}`;

    await post.save();
    res.status(200).json({ message: "Post updated successfully", post });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




module.exports.removePost = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (
      !connectedUser ||
      !["candidate", "company", "admin"].includes(connectedUser.role)
    ) {
      return res
        .status(403)
        .json({ message: "Only candidates, companies, or admins can delete posts." });
    }

    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: "Post not found." });

    // ✅ Admin peut supprimer n'importe quel post, sinon l'auteur uniquement
    if (
      connectedUser.role !== "admin" &&
      post.author.toString() !== connectedUser._id.toString()
    ) {
      return res.status(403).json({
        message: "You can only delete your own posts unless you are an admin.",
      });
    }

    // 🔄 Supprimer les commentaires liés
    await Comment.deleteMany({ post: postId });

    // 🔄 Supprimer les réactions liées
    await Reaction.deleteMany({ post: postId });

    // 🔄 Supprimer le post
    await post.deleteOne();

    res.status(200).json({ message: "Post, comments, and reactions deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports.listPosts = async (req, res) => {
  try {
    // 🔑 Vérification token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser) {
      return res.status(403).json({ message: "Invalid user." });
    }

    // 📌 Récupérer tous les posts + infos de l’auteur
    const posts = await Post.find()
      .populate("author", "username role logo")
      .sort({ createdAt: -1 });

    // 🔄 Ajouter nb de réactions et de commentaires pour chaque post
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const reactionsCount = await Reaction.countDocuments({ post: post._id });
        const commentsCount = await Comment.countDocuments({ post: post._id });

        return {
          ...post.toObject(),
          reactionsCount,
          commentsCount,
        };
      })
    );

    return res.status(200).json(postsWithCounts);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur serveur.", error: error.message });
  }
};





module.exports.listPostsByUser = async (req, res) => {
  try {
    // 🔑 Check token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser) {
      return res.status(403).json({ message: "Invalid user." });
    }

    // 📌 Get userId from params
    const { userId } = req.params;

    // 📌 Get all posts by that user
    const posts = await Post.find({ author: userId })
      .populate("author", "username role logo")
      .sort({ createdAt: -1 });

    if (!posts.length) {
      return res.status(404).json({ message: "No posts found for this user." });
    }

    // 🔄 Add reaction + comment counts
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const reactionsCount = await Reaction.countDocuments({ post: post._id });
        const commentsCount = await Comment.countDocuments({ post: post._id });

        return {
          ...post.toObject(),
          reactionsCount,
          commentsCount,
        };
      })
    );

    return res.status(200).json(postsWithCounts);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error.", error: error.message });
  }
};
