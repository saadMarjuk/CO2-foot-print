// server.js
const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve frontend

// Formula constants
const ENERGY_PER_GB = 1.8; // kWh
const CO2_PER_KWH = 442; // grams

app.post("/analyze", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const response = await axios.get(url);
    const sizeMB = Buffer.byteLength(response.data, "utf8") / 1024 / 1024; // MB
    const energy = (sizeMB / 1024) * ENERGY_PER_GB; // convert MB→GB
    const carbon = energy * CO2_PER_KWH; // grams CO2

    const result = {
      url,
      pageSize: sizeMB.toFixed(2) + " MB",
      estimatedCO2: carbon.toFixed(2) + " g per visit",
      date: new Date().toLocaleString(),
    };

    // Append result to data.txt
    fs.appendFileSync("data.txt", JSON.stringify(result) + "\n", "utf8");

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to analyze website" });
  }
});

app.get("/history", (req, res) => {
  try {
    if (!fs.existsSync("data.txt")) return res.json([]);
    const lines = fs.readFileSync("data.txt", "utf8").trim().split("\n");
    const results = lines.map((line) => JSON.parse(line));
    res.json(results.reverse());
  } catch (err) {
    res.status(500).json({ error: "Failed to read history" });
  }
});

app.listen(5000, () => console.log("🌱 Server running at http://localhost:5000"));
