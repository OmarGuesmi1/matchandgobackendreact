const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Reaction = require("../models/reactionModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel");
const Reply = require("../models/replyModel");  // 👈 ajoute ça

/////////////// creatreact ///////////////////

module.exports.creatreact = async (req, res) => {
  try {
    // 🔑 Vérif token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Seuls les candidats et entreprises peuvent réagir." });
    }

    // 📥 Récup params & body
    const { type } = req.body;
    const { postId, commentId, replyId } = req.params;

    if (!type) {
      return res.status(400).json({ message: "Le type de réaction est obligatoire." });
    }

    if (!postId && !commentId && !replyId) {
      return res.status(400).json({ message: "Une réaction doit cibler un post, un commentaire OU une réponse." });
    }

    // ✅ Vérifier l'existence de la cible
    if (postId) {
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: "Post non trouvé." });
    }
    if (commentId) {
      const comment = await Comment.findById(commentId);
      if (!comment) return res.status(404).json({ message: "Commentaire non trouvé." });
    }
    if (replyId) {
      const reply = await Reply.findById(replyId);
      if (!reply) return res.status(404).json({ message: "Réponse non trouvée." });
    }

    // ⚡ Vérifier si l’utilisateur a déjà fait la même réaction
    let existingReaction = await Reaction.findOne({
      user: connectedUser._id,
      type,
      ...(postId ? { post: postId } : {}),
      ...(commentId ? { comment: commentId } : {}),
      ...(replyId ? { reply: replyId } : {}),
    });

    if (existingReaction) {
      return res.status(400).json({ message: "Vous avez déjà ajouté cette réaction." });
    }

    // ✅ Créer la réaction
    const reaction = await Reaction.create({
      type,
      user: connectedUser._id,
      ...(postId ? { post: postId } : {}),
      ...(commentId ? { comment: commentId } : {}),
      ...(replyId ? { reply: replyId } : {}),
    });

    return res.status(201).json({ message: "Réaction ajoutée avec succès.", reaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};
/////////////// getreacetcount ///////////////////


module.exports.getreacetcount = async (req, res) => {
  try {
    // 🔑 Vérif token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Seuls les candidats et entreprises peuvent consulter les réactions." });
    }

    const { postId, commentId } = req.params;
    const { type } = req.query; // 👉 on utilise query pour filtrer optionnellement

    if (!postId && !commentId) {
      return res.status(400).json({ message: "Il faut fournir un postId ou un commentId." });
    }

    // 🔎 Construire le filtre
    let filter = {};
    if (postId) filter.post = postId;
    if (commentId) filter.comment = commentId;
    if (type) filter.type = type; // facultatif : filtrer par type

    // ⚡ Compter
    const count = await Reaction.countDocuments(filter);

    // ✅ Renvoyer le résultat
    return res.status(200).json({
      
      count,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

/////////////// getcountcoment ///////////////////

module.exports.getcountcoment = async (req, res) => {
  try {
    // 🔑 Vérif token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Seuls les candidats et entreprises peuvent consulter les réactions." });
    }

    const { postId, commentId } = req.params;
    const { type } = req.query; // 👉 ex: ?type=like

    if (!postId && !commentId) {
      return res.status(400).json({ message: "Il faut fournir un postId ou un commentId." });
    }

    // 📌 Construire le filtre
    const filter = {
      ...(postId ? { post: postId } : {}),
      ...(commentId ? { comment: commentId } : {}),
      ...(type ? { type } : {}),
    };

    // 📊 Compter les réactions
    const totalReactions = await Reaction.countDocuments(filter);

    // 📊 Si tu veux aussi le détail par type :
    const breakdown = await Reaction.aggregate([
      { $match: filter },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({
      message: "Compteur récupéré avec succès.",
      total: totalReactions,
      breakdown, // ex: [ { _id: "like", count: 5 }, { _id: "support", count: 2 } ]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};



module.exports.postreactreply = async (req, res) => {
  try {
    // 🔑 Vérif token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Seuls les candidats et entreprises peuvent ajouter une réaction." });
    }

    const { replyId } = req.params;
    const { type } = req.body; // 👉 en POST, le type vient du body

    if (!type) {
      return res.status(400).json({ message: "Le type de réaction est obligatoire." });
    }

    // ✅ Vérifier l'existence de la reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply non trouvée." });
    }

    // 🔎 Vérifier si l’utilisateur a déjà réagi avec le même type
    const existingReaction = await Reaction.findOne({
      user: connectedUser._id,
      reply: replyId,
      type,
    });

    if (existingReaction) {
      return res.status(400).json({ message: "Vous avez déjà ajouté cette réaction." });
    }

    // ✅ Créer la réaction
    const reaction = await Reaction.create({
      type,
      user: connectedUser._id,
      reply: replyId,
    });

    return res.status(201).json({
      message: "Réaction ajoutée avec succès sur la reply.",
      reaction,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};




module.exports.countreactreply = async (req, res) => {
  try {
    // 🔑 Vérif token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Seuls les candidats et entreprises peuvent consulter les réactions." });
    }

    const { replyId } = req.params;
    const { type } = req.query; // facultatif

    if (!replyId) {
      return res.status(400).json({ error: "Il faut fournir un replyId." });
    }

    // ✅ Vérifier si la reply existe
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ error: "Reply non trouvée." });
    }

    // 🔎 Construire le filtre
    const filter = { reply: replyId, ...(type ? { type } : {}) };

    // 📊 Compter
    const count = await Reaction.countDocuments(filter);

    // ✅ Renvoyer toujours le même format
    return res.status(200).json({ count });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur.", details: error.message });
  }
};



module.exports.listReactionsPost = async (req, res) => {
  try {
    // 🔑 Vérif token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connectedUser = await User.findById(decoded.id);

    if (!connectedUser || !["candidate", "company"].includes(connectedUser.role)) {
      return res.status(403).json({ message: "Seuls les candidats et entreprises peuvent consulter les réactions." });
    }

    const { postId } = req.params;
    if (!postId) {
      return res.status(400).json({ message: "postId requis." });
    }

    // 🔎 Récup toutes les réactions + username de l'utilisateur
    const reactions = await Reaction.find({ post: postId })
      .populate("user", "username role logo"); // 👉 on ne prend que ce qu’on veut

    // 🔄 Regrouper par type
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.type]) {
        acc[reaction.type] = { count: 0, users: [] };
      }
      acc[reaction.type].count++;
      acc[reaction.type].users.push({
        _id: reaction.user._id,
        username: reaction.user.username,
        role: reaction.user.role,
        logo: reaction.user.logo
      });
      return acc;
    }, {});

    return res.status(200).json(grouped);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};





