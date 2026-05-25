const swaggerJsDoc = require("swagger-jsdoc");

const localUrl = `http://localhost:${process.env.PORT || 5000}`;
const productionUrl = process.env.API_BASE_URL;

const servers = [
  ...(productionUrl ? [{ url: productionUrl, description: "Production server" }] : []),
  { url: localUrl, description: "Local server" },
];

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Movie Recommendation API",
      version: "1.0.0",
      description: "REST API for user accounts, movie data, recommendations, ratings, reviews, lists, posts, comments, trailers, and admin statistics.",
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
