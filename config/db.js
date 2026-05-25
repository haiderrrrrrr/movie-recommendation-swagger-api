const mongoose = require("mongoose");

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MOVIE_DB_URI) {
    throw new Error("MOVIE_DB_URI is not configured");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MOVIE_DB_URI)
      .then(() => console.log("MongoDB connected"))
      .catch(error => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
};

module.exports = connectDB;
