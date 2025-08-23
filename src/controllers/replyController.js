const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Comment = require("../models/commentModel");
const Reply = require("../models/replyModel");

module.exports.creerreplycomment = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Seuls les candidats et entreprises peuvent répondre à un commentaire." });
    }

    // Récupérer l'id du commentaire depuis l'URL
    const { commentId } = req.params;
    const { content } = req.body;

    // Vérifier que le commentaire existe
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Commentaire introuvable." });
    }

    // Créer la reply
    const reply = await Reply.create({
      content,
      comment: commentId,
      author: connectedUser._id,
    });

    return res.status(201).json({
      message: "Réponse créée avec succès ✅",
      reply,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
