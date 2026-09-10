const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn("MONGO_URI is not configured; database features are unavailable");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
  }
}

module.exports = connectDatabase;