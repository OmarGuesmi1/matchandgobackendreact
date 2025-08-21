const jwt = require("jsonwebtoken");
const Post = require("../models/postModel");
const User = require("../models/userModel");

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

    if (!connectedUser || !["candidate", "company", "admin"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Only candidates, companies, or admins can delete posts." });
    }

    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ message: "Post not found." });

    // ✅ Admin can delete any post
    if (connectedUser.role !== "admin" && post.author.toString() !== connectedUser._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own posts unless you are an admin." });
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

