const express = require("express");
const Medicine = require("../models/Medicine");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
const staffOnly = [authenticate, authorize("pharmacist", "admin")];

function medicineInput(body) {
  return {
    name: body.name,
    category: body.category,
    description: body.description,
    manufacturer: body.manufacturer,
    price: body.price,
    stock: body.stock,
    requiresPrescription: body.requiresPrescription
  };
}

function validateMedicine(body) {
  if (!body.name || !body.category || body.price === undefined) {
    return "Name, category, and price are required";
  }
  if (Number.isNaN(Number(body.price)) || Number(body.price) < 0) {
    return "Price must be a non-negative number";
  }
  if (body.stock !== undefined && (Number.isNaN(Number(body.stock)) || Number(body.stock) < 0)) {
    return "Stock must be a non-negative number";
  }
  return null;
}

router.get("/", async (req, res) => {
  try {
    const filter = { isActive: true };
    const search = req.query.search?.trim();
    const category = req.query.category?.trim();

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }

    const medicines = await Medicine.find(filter).sort({ name: 1 });
    return res.json({ success: true, count: medicines.length, medicines });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch medicines" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, isActive: true });
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }
    return res.json({ success: true, medicine });
  } catch {
    return res.status(400).json({ success: false, message: "Invalid medicine id" });
  }
});

router.post("/", ...staffOnly, async (req, res) => {
  const validationError = validateMedicine(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const medicine = await Medicine.create(medicineInput(req.body));
    return res.status(201).json({ success: true, medicine });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to add medicine" });
  }
});

router.put("/:id", ...staffOnly, async (req, res) => {
  const validationError = validateMedicine(req.body);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      medicineInput(req.body),
      { new: true, runValidators: true }
    );
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }
    return res.json({ success: true, medicine });
  } catch {
    return res.status(400).json({ success: false, message: "Failed to update medicine" });
  }
});

router.delete("/:id", ...staffOnly, async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found" });
    }
    return res.json({ success: true, message: "Medicine deleted" });
  } catch {
    return res.status(400).json({ success: false, message: "Failed to delete medicine" });
  }
});

module.exports = router;