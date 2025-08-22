const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel"); // adapte le chemin !

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
      return res.status(403).json({ message: "Seuls les candidats et entreprises peuvent créer des commentaires." });
    }

    // Récupérer le contenu et l'ID du post depuis req.params
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Le contenu du commentaire est requis." });
    }

    // Vérifier que le post existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post introuvable." });
    }

    // Créer le commentaire
    const newComment = new Comment({
      content,
      post: post._id,
      author: connectedUser._id,
    });

    await newComment.save();

    res.status(201).json({
      message: "Commentaire créé avec succès",
      comment: newComment,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
