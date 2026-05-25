const CustomList = require("../models/CustomList");
const User = require("../models/User");
const Movie = require("../models/Movie");
const getCursorPaginationParams = require("../utils/pagination");
const {
  getApiBaseUrl,
  getTwilioClient,
  sendEmail,
} = require("../utils/shareServices");

// Create a new custom list
const createCustomList = async (req, res) => {
  const { name, description, isPublic, movies } = req.body;
  const userId = req.user.id;

  try {
    const newList = new CustomList({
      name,
      description,
      isPublic,
      creator: userId,
      movies,
    });

    // If the list is public, generate the shareable link
    if (isPublic) {
      newList.shareableLink = `${getApiBaseUrl()}/api/custom-lists/${newList._id}`;
    }

    await newList.save();
    res
      .status(201)
      .json({ message: "Custom list created successfully", data: newList });
  } catch (error) {
    console.error("Error creating custom list:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all custom lists with pagination
const getCustomLists = async (req, res) => {
  const { limit, query } = getCursorPaginationParams(req);

  try {
    const lists = await CustomList.find(query)
      .limit(limit)
      .populate("movies", "title genre")
      .populate("creator", "username")
      .populate("followers", "username");

    res.status(200).json(lists);
  } catch (error) {
    console.error("Error fetching custom lists:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Add a movie to a custom list
const addMovieToList = async (req, res) => {
  const { listId, movieId } = req.body;

  try {
    const list = await CustomList.findById(listId);
    if (!list) return res.status(404).json({ error: "Custom list not found" });

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    if (list.movies.includes(movieId)) {
      return res.status(400).json({ error: "Movie already in the list" });
    }

    list.movies.push(movieId);
    await list.save();
    res.status(200).json({ message: "Movie added to list", data: list });
  } catch (error) {
    console.error("Error adding movie to list:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Remove a movie from a custom list
const removeMovieFromList = async (req, res) => {
  const { listId, movieId } = req.body;

  try {
    const list = await CustomList.findById(listId);
    if (!list) return res.status(404).json({ error: "Custom list not found" });

    if (!list.movies.includes(movieId)) {
      return res.status(400).json({ error: "Movie not found in the list" });
    }

    list.movies = list.movies.filter((id) => id.toString() !== movieId);
    await list.save();
    res.status(200).json({ message: "Movie removed from list", data: list });
  } catch (error) {
    console.error("Error removing movie from list:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Follow a custom list
const followCustomList = async (req, res) => {
  const { listId } = req.body;
  const userId = req.user.id;

  try {
    const list = await CustomList.findById(listId);
    if (!list) return res.status(404).json({ error: "Custom list not found" });

    if (list.followers.includes(userId)) {
      return res
        .status(400)
        .json({ error: "You are already following this list" });
    }

    list.followers.push(userId);
    await list.save();
    res.status(200).json({ message: "Followed custom list", data: list });
  } catch (error) {
    console.error("Error following custom list:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Unfollow a custom list
const unfollowCustomList = async (req, res) => {
  const { listId } = req.body;
  const userId = req.user.id;

  try {
    const list = await CustomList.findById(listId);
    if (!list) return res.status(404).json({ error: "Custom list not found" });

    if (!list.followers.includes(userId)) {
      return res.status(400).json({ error: "You are not following this list" });
    }

    list.followers = list.followers.filter((id) => id.toString() !== userId);
    await list.save();
    res.status(200).json({ message: "Unfollowed custom list", data: list });
  } catch (error) {
    console.error("Error unfollowing custom list:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const shareCustomList = async (req, res) => {
  const { id } = req.params; // Get ID from params
  const { email, message, whatsapp, sms } = req.body; // Added 'sms' to body

  try {
    const customList = await CustomList.findById(id)
      .populate("movies", "title genre")
      .populate("creator", "username");

    if (!customList) {
      return res.status(404).json({ error: "Custom list not found" });
    }

    if (!customList.isPublic) {
      return res
        .status(400)
        .json({ error: "Cannot share a private custom list" });
    }

    const shareMessage = `
      <h3>${message || "Check out this amazing custom list!"}</h3>
      <p><strong>List Name:</strong> ${customList.name}</p>
      <p><strong>Created By:</strong> ${customList.creator.username}</p>
      <p><strong>Description:</strong> ${customList.description}</p>
      <p><strong>Movies:</strong></p>
      <ul>
        ${customList.movies
          .map(
            (movie) =>
              `<li><strong>${movie.title}</strong> - ${movie.genre}</li>`
          )
          .join("")}
      </ul>
      <p><strong>Shareable Link:</strong> <a href="${getApiBaseUrl()}/api/custom-lists/${
        customList._id
      }" target="_blank">View Custom List</a></p>
    `;

    // Send email
    if (email) {
      await sendEmail({
        to: email,
        subject: `Check out ${customList.name}`,
        html: shareMessage,
      });
      console.log(`Email sent to ${email}`);
    }

    // Send WhatsApp message
    if (whatsapp) {
      const whatsappMessage = `
      *${message || "Check out this amazing custom list!"}*\n\n
      *List Name:* ${customList.name}\n
      *Description:* ${customList.description}\n
      *Movies:*\n${customList.movies
        .map(
          (movie, index) => `${index + 1}. *${movie.title}* - _${movie.genre}_`
        )
        .join("\n")}
      \n*Shareable Link:* ${getApiBaseUrl()}/api/custom-lists/${
        customList._id
      }
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
        *${message || "Check out this amazing custom list!"}*\n\n
        *List Name:* ${customList.name}\n
        *Description:* ${customList.description}\n
        *Movies:*\n${customList.movies
          .map(
            (movie, index) =>
              `${index + 1}. *${movie.title}* - _${movie.genre}_`
          )
          .join("\n")}
        \n*Shareable Link:* ${getApiBaseUrl()}/api/custom-lists/${
          customList._id
        }
`;

      await getTwilioClient().messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: sms,
      });
      console.log(`SMS message sent to ${sms}`);
    }

    res.status(200).json({
      message: "Custom list shared via email, WhatsApp, and SMS",
    });
  } catch (error) {
    console.error("Error sharing custom list:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a custom list
const updateCustomList = async (req, res) => {
  const { id } = req.params;
  const { name, description, isPublic } = req.body;

  try {
    const list = await CustomList.findById(id);
    if (!list) return res.status(404).json({ error: "Custom list not found" });

    list.name = name || list.name;
    list.description = description || list.description;
    list.isPublic = isPublic !== undefined ? isPublic : list.isPublic;

    if (list.isPublic && !list.shareableLink) {
      list.shareableLink = `${getApiBaseUrl()}/api/custom-lists/${list._id}`;
    }

    await list.save();
    res.status(200).json({ message: "Custom list updated", data: list });
  } catch (error) {
    console.error("Error updating custom list:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a custom list
const deleteCustomList = async (req, res) => {
  const { id } = req.params;

  try {
    const list = await CustomList.findById(id);
    if (!list) return res.status(404).json({ error: "Custom list not found" });

    await CustomList.findByIdAndDelete(id); // Delete the custom list
    res.status(200).json({ message: "Custom list deleted" });
  } catch (error) {
    console.error("Error deleting custom list:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get custom list for Link
const getCustomListById = async (req, res) => {
  const { id } = req.params;

  try {
    const customList = await CustomList.findById(id)
      .populate("movies", "title genre")
      .populate("creator", "username");

    if (!customList) {
      return res.status(404).json({ error: "Custom list not found" });
    }

    res.status(200).json(customList);
  } catch (error) {
    console.error("Error fetching custom list:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createCustomList,
  getCustomLists,
  addMovieToList,
  getCustomListById,
  removeMovieFromList,
  followCustomList,
  unfollowCustomList,
  shareCustomList,
  updateCustomList,
  deleteCustomList,
};
