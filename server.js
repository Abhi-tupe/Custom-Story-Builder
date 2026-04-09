require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const Story = require("./models/Story");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/storybuilder")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ===========================
   Pexels Image Search
=========================== */

async function generateImage(prompt) {
  try {
    const response = await axios.get(
      "https://api.pexels.com/v1/search",
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY
        },
        params: {
          query: prompt,
          per_page: 1
        }
      }
    );

    if (response.data.photos.length > 0) {
      return response.data.photos[0].src.landscape;
    }

    return null;

  } catch (error) {
    console.error("Pexels Error:", error.message);
    return null;
  }
}

/* ===========================
   Routes
=========================== */

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/api/stories", async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: "Error fetching stories" });
  }
});

app.post("/api/stories", async (req, res) => {
  try {
    const { title, content } = req.body;

    const scenes = content.split("\n").filter(s => s.trim() !== "");
    const images = [];

    for (let scene of scenes) {
      const imageUrl = await generateImage(scene);
      images.push(imageUrl);
    }

    const newStory = new Story({
      title,
      content,
      scenes,
      images
    });

    await newStory.save();

    res.status(201).json({ message: "Story saved with images!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});