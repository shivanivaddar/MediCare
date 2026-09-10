const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MediCare API is running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MediCare Server running on port ${PORT}`);
});