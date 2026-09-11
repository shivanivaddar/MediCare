const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const connectDatabase = require("./config/db");
const authRoutes = require("./routes/auth");
const medicineRoutes = require("./routes/medicines");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MediCare API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

connectDatabase();

app.listen(port, () => {
  console.log(`MediCare Server running on port ${port}`);
});
