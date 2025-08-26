require("dotenv").config();
const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const dbConnect = require("./config/dbConnect");
const cors = require('cors');
const notificationRoutes = require("./routes/notificationRoutes");


// ✅ Polyfills pour Node 16
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

// Import des routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const geminiRoutes = require("./routes/geminiRoutes");
const offerRoutes = require("./routes/offerRoutes");
const questionRoutes = require("./routes/questionRoutes");
const quizRoutes = require("./routes/quizRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();
const server = require("http").createServer(app);

// 📌 Connexion à la base de données
dbConnect();



// Socket utils
const { initSocket } = require("./utils/socket");

// 📌 Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // Pour servir des fichiers statiques
app.use(cors());

// 📌 Routes API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/gemini", geminiRoutes); 
app.use("/api/offers", offerRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/notify", notificationRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);

// 📌 Middleware de gestion des erreurs global
app.use((err, req, res, next) => {
    console.error("❌ Error:", err.message);
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

// 📌 Lancement du serveur
const PORT = process.env.PORT || 7002;
app.listen(PORT, () => {
    console.log(`✅ Server is running at http://localhost:${PORT}`);
});


initSocket(server);


