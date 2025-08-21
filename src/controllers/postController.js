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
