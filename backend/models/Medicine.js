const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    manufacturer: { type: String, trim: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    requiresPrescription: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

medicineSchema.index({ name: "text", description: "text", manufacturer: "text" });
medicineSchema.index({ category: 1 });

module.exports = mongoose.model("Medicine", medicineSchema);