require("dotenv").config(); // Load .env variables
console.log("Appwrite Key:", process.env.APPWRITE_API_KEY);

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { Client, Storage, Databases, ID, InputFile, Query } = require("node-appwrite");
const stream = require("stream");
const crypto = require("crypto");
const FormData = require("form-data");
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Appwrite setup
const client = new Client()
  .setEndpoint(process.env.APPWRITE_API_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);
const databases = new Databases(client);


app.use(express.json());
app.use(cors({ origin: "*" })); // Allow all origins — update in production

// Constants for your DB/Collection IDs
const databaseId = process.env.DATABASE_ID;
const collectionId = process.env.COLLECTION_ID;
const postCollectionId = process.env.POST_COLLECTION;

// ========== ROUTES ==========

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// ✅ Serve image from Appwrite bucket
app.get("/image/:imageFileId", async (req, res) => {
  const { imageFileId } = req.params;

  const imageUrl = `${process.env.APPWRITE_IMAGE_BASE_URL}/${imageFileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

  try {
    const response = await axios.get(imageUrl, {
      responseType: "stream",
      headers: {
        "67bc93bc0004228cf938": process.env.APPWRITE_PROJECT_ID,
        "Deuxieme": process.env.APPWRITE_API_KEY,
      },
    });

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", response.headers["content-type"] || "image/jpeg");

    response.data.pipe(res);
  } catch (error) {
    console.error("❌ Error fetching image:", error.message);
    res.status(500).send("Failed to load image.");
  }
});



// ✅ Redirect to profile picture URL
app.get("/profilePicture/:profilePictureId", (req, res) => {
  const { profilePictureId } = req.params;

  const profilePictureUrl = `${process.env.APPWRITE_PROFILE_PICTURE_URL}/${profilePictureId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
  console.log("🔍 Redirecting to:", profilePictureUrl);
  res.redirect(profilePictureUrl);
});

// ✅ Get user data by userId
app.get("/getUserData/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal("userId", userId)]
    );
    res.json(response.documents);
  } catch (error) {
    console.error("❌ Error fetching user data:", error);
    res.status(500).send("Unable to retrieve data.");
  }
});

// ✅ Get all posts (newest first)
app.get("/getAllPosts", async (req, res) => {
  try {
    const postsResponse = await databases.listDocuments(
      databaseId,
      postCollectionId,
      [Query.orderDesc("createdAt")]
    );

    res.json(postsResponse.documents);
  } catch (error) {
    console.error("❌ Error fetching posts:", error);
    res.status(500).send("Unable to retrieve posts.");
  }
});

// ✅ Get posts with specific imageId (e.g. for "liked" posts)
app.post("/getLikedImages", async (req, res) => {
  const { imageId } = req.body;

  if (!imageId) {
    return res.status(400).send("Missing imageId in request body.");
  }

  try {
    const response = await databases.listDocuments(
      databaseId,
      postCollectionId,
      [Query.equal("imageId", imageId)]
    );

    res.json(response.documents);
  } catch (error) {
    console.error("❌ Error fetching liked images:", error);
    res.status(500).send("Failed to retrieve images.");
  }
});

// ✅ Image URL upload route
// Route


app.post("/uploadImageFromUrl", async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl || typeof imageUrl !== "string") {
    return res.status(400).json({ error: "Invalid image URL." });
  }

  try {
    console.log("📸 Fetching image from URL:", imageUrl);

    // Fetch image content
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(imageResponse.data);

    console.log("✅ Image fetched, preparing upload...");

    // Generate unique fileId
    const fileId = crypto.randomUUID();

    // Create FormData
    const formData = new FormData();
    formData.append("fileId", fileId); // Required by Appwrite REST
    formData.append("file", buffer, {
      filename: "upload.jpg",
      contentType: "image/jpeg",
    });

    // Upload via REST API
    const uploadUrl = `${process.env.APPWRITE_API_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files`;

    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Appwrite-Project": process.env.APPWRITE_PROJECT_ID,
        "X-Appwrite-Key": process.env.APPWRITE_API_KEY,
      },
    });

    const uploadedFileId = uploadResponse.data.$id;
    const uploadedImageUrl = `${process.env.APPWRITE_API_ENDPOINT}/storage/buckets/${process.env.APPWRITE_BUCKET_ID}/files/${uploadedFileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;

    console.log("✅ File uploaded successfully:", uploadedFileId);

    return res.json({
      message: "Image uploaded successfully!",
      imageUrl: uploadedImageUrl,
      fileId: uploadedFileId,
    });

  } catch (error) {
    console.error("❌ Upload error:", error.response?.data || error.message || error);
    return res.status(500).json({ error: "Upload failed." });
  }
});





// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
