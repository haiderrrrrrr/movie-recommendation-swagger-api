const Trailer = require("../models/Trailer");
const getCursorPaginationParams = require("../utils/pagination");
const {
  getApiBaseUrl,
  getTwilioClient,
  sendEmail,
} = require("../utils/shareServices");

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
  next();
};

// Create a new trailer (Admin Only)
const createTrailer = async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const {
    movieId,
    trailerName,
    trailerUrl,
    trailerType,
    releaseDate,
    duration,
    description,
    language,
    regionRestrictions,
    isPublic,
  } = req.body;

  try {
    if (
      !trailerName ||
      !trailerUrl ||
      !trailerType ||
      !releaseDate ||
      !duration ||
      !description
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingTrailer = await Trailer.findOne({ movieId, trailerUrl });
    if (existingTrailer) {
      return res.status(400).json({
        error: "This trailer already exists for the specified movie.",
      });
    }

    const newTrailer = new Trailer({
      movieId,
      trailerName,
      trailerUrl,
      trailerType,
      releaseDate,
      duration,
      description,
      language,
      regionRestrictions,
      isPublic,
    });

    await newTrailer.save();
    res
      .status(201)
      .json({ message: "Trailer created successfully", data: newTrailer });
  } catch (error) {
    console.error("Error creating trailer:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get trailers with pagination (Accessible to all users)
const getTrailers = async (req, res) => {
  const { limit, query } = getCursorPaginationParams(req);

  try {
    const trailers = await Trailer.find(query)
      .limit(limit)
      .populate("movieId", "title genre releaseDate")
      .exec();

    if (!trailers.length) {
      return res.status(404).json({ message: "No trailers found" });
    }

    res.status(200).json({ trailers });
  } catch (error) {
    console.error("Error fetching trailers:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a specific trailer by ID (Accessible to all users)
const getTrailerById = async (req, res) => {
  const { id } = req.params;

  try {
    const trailer = await Trailer.findById(id).populate(
      "movieId",
      "title genre releaseDate"
    );
    if (!trailer) {
      return res.status(404).json({ error: "Trailer not found" });
    }

    res.status(200).json({ trailer });
  } catch (error) {
    console.error("Error fetching trailer:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a trailer (Admin Only)
const updateTrailer = async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const { id } = req.params;
  const {
    trailerName,
    trailerUrl,
    trailerType,
    releaseDate,
    duration,
    description,
    language,
    regionRestrictions,
    isPublic,
  } = req.body;

  try {
    const trailer = await Trailer.findById(id);
    if (!trailer) {
      return res.status(404).json({ error: "Trailer not found" });
    }

    trailer.trailerName = trailerName || trailer.trailerName;
    trailer.trailerUrl = trailerUrl || trailer.trailerUrl;
    trailer.trailerType = trailerType || trailer.trailerType;
    trailer.releaseDate = releaseDate || trailer.releaseDate;
    trailer.duration = duration || trailer.duration;
    trailer.description = description || trailer.description;
    trailer.language = language || trailer.language;
    trailer.regionRestrictions =
      regionRestrictions || trailer.regionRestrictions;
    trailer.isPublic = isPublic !== undefined ? isPublic : trailer.isPublic;

    await trailer.save();
    res
      .status(200)
      .json({ message: "Trailer updated successfully", data: trailer });
  } catch (error) {
    console.error("Error updating trailer:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a trailer (Admin Only)
const deleteTrailer = async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }

  const { id } = req.params;

  try {
    const trailer = await Trailer.findById(id);
    if (!trailer) {
      return res.status(404).json({ error: "Trailer not found" });
    }

    await trailer.deleteOne();
    res.status(200).json({ message: "Trailer deleted successfully" });
  } catch (error) {
    console.error("Error deleting trailer:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Share trailer via email, WhatsApp, and SMS (Accessible to all users)
const shareTrailer = async (req, res) => {
  const { trailerId, email, message, whatsapp, sms } = req.body;

  try {
    const trailer = await Trailer.findById(trailerId).populate(
      "movieId",
      "title"
    );
    if (!trailer) {
      return res.status(404).json({ error: "Trailer not found" });
    }

    const movieTitle = trailer.movieId ? trailer.movieId.title : "a trailer";

    // Construct the detailed trailer message in HTML
    const shareMessage = `
      <h3>${message || "Check out this amazing trailer!"}</h3>
      <p><strong>Trailer Name:</strong> ${trailer.trailerName}</p>
      <p><strong>Movie Title:</strong> ${movieTitle}</p>
      <p><strong>Type:</strong> ${trailer.trailerType}</p>
      <p><strong>Release Date:</strong> ${new Date(
        trailer.releaseDate
      ).toLocaleDateString()}</p>
      <p><strong>Duration:</strong> ${trailer.duration} seconds</p>
      <p><strong>Description:</strong> ${trailer.description}</p>
      <p><strong>Language:</strong> ${trailer.language || "Not specified"}</p>
      <p><strong>Trailer URL:</strong> <a href="${
        trailer.trailerUrl
      }" target="_blank">${trailer.trailerUrl}</a></p>
      <p><strong>More Details:</strong> <a href="${getApiBaseUrl()}/api/trailers/${
        trailer._id
      }" target="_blank">View Trailer Details</a></p>
    `;

    // Send email
    if (email) {
      await sendEmail({
        to: email,
        subject: `Check out ${trailer.trailerName}`,
        html: shareMessage,
      });
      console.log(`Email sent to ${email}`);
    }

    // Send WhatsApp message
    if (whatsapp) {
      const whatsappMessage = `
      *${message || "Check out this amazing trailer!"}*\n\n
      *Trailer Name:* ${trailer.trailerName}\n
      *Movie Title:* ${movieTitle}\n
      *Type:* ${trailer.trailerType}\n
      *Release Date:* ${new Date(trailer.releaseDate).toLocaleDateString()}\n
      *Duration:* ${trailer.duration} seconds\n
      *Description:* ${trailer.description}\n
      *Language:* ${trailer.language || "Not specified"}\n
      *Trailer URL:* ${trailer.trailerUrl}\n
      *More Details:* ${getApiBaseUrl()}/api/trailers/${trailer._id}
      `;

      await getTwilioClient().messages.create({
        body: whatsappMessage,
        from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886",
        to: `whatsapp:${whatsapp}`,
      });
      console.log(`WhatsApp message sent to ${whatsapp}`);
    }

    // Send SMS message
    if (sms) {
      if (!process.env.TWILIO_PHONE_NUMBER) {
        throw new Error("TWILIO_PHONE_NUMBER is not configured");
      }

      const smsMessage = `
      Check out this amazing trailer!\n
      Trailer Name: ${trailer.trailerName}\n
      Movie Title: ${movieTitle}\n
      Type: ${trailer.trailerType}\n
      Release Date: ${new Date(trailer.releaseDate).toLocaleDateString()}\n
      Duration: ${trailer.duration} seconds\n
      Description: ${trailer.description}\n
      Language: ${trailer.language || "Not specified"}\n
      Trailer URL: ${trailer.trailerUrl}\n
      More Details: ${getApiBaseUrl()}/api/trailers/${trailer._id}
      `;

      await getTwilioClient().messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: sms,
      });
      console.log(`SMS message sent to ${sms}`);
    }

    res.status(200).json({
      message: "Trailer shared via email, WhatsApp, and SMS",
    });
  } catch (error) {
    console.error("Error sharing trailer:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createTrailer,
  getTrailers,
  getTrailerById,
  updateTrailer,
  deleteTrailer,
  shareTrailer,
};
