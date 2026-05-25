require("dotenv").config();

const dns = require("dns");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const swaggerDocs = require("./config/swagger");

if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(",").map(server => server.trim()).filter(Boolean));
}

const userRoutes = require("./routes/userRoutes");
const movieRoutes = require("./routes/movieRoutes");
const ratingReviewRoutes = require("./routes/ratingReviewRoutes");
const likeRoutes = require("./routes/likeRoutes");
const commentRoutes = require("./routes/commentRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const searchRoutes = require("./routes/searchRoutes");
const boxOfficeRoutes = require("./routes/boxOfficeRoutes");
const newsAndArticlesRoutes = require("./routes/newsAndArticlesRoutes");
const customListRoutes = require("./routes/customListRoutes");
const trailerRoutes = require("./routes/trailerRoutes");
const discussionBoardRoutes = require("./routes/discussionBoardRoutes");
const postRoutes = require("./routes/postRoutes");
const adminStatsRoutes = require("./routes/adminStatsRoutes");

const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN;
const corsOptions = allowedOrigin ? { origin: allowedOrigin } : {};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api-docs/swagger.json", (req, res) => {
  res.json(swaggerDocs);
});

app.get(["/api-docs", "/api-docs/"], (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Movie Recommendation Swagger API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <style>body { margin: 0; background: #fafafa; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: "/api-docs/swagger.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`);
});

app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/rating-reviews", ratingReviewRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/box-office-awards", boxOfficeRoutes);
app.use("/api/news-and-updates", newsAndArticlesRoutes);
app.use("/api/custom-lists", customListRoutes);
app.use("/api/trailers", trailerRoutes);
app.use("/api/discussion-boards", discussionBoardRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin-stats", adminStatsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

const startServer = async () => {
  const port = process.env.PORT || 5000;

  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log(`Swagger available at http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
