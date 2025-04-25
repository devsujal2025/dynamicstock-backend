const express = require("express");
const router = express.Router();
const Medicine = require("../models/Medicine");

// 🔹 Add new medicine
router.post("/add", async (req, res) => {
    try {
        const { name, price, expiryDate, stock } = req.body;
        
        // Check for missing fields
        if (!name || !price || !expiryDate || !stock) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newMedicine = new Medicine({ name, price, expiryDate, stock });
        await newMedicine.save();
        res.status(201).json({ message: "Medicine added successfully", newMedicine });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 Get all medicines (with optional search by name)
router.get("/", async (req, res) => {
    try {
        const { search } = req.query;
        let medicines;

        if (search) {
            medicines = await Medicine.find({ name: { $regex: search, $options: "i" } }); // Case-insensitive search
        } else {
            medicines = await Medicine.find();
        }

        res.status(200).json(medicines);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 Get a single medicine by ID
router.get("/:id", async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ error: "Medicine not found" });
        }
        res.status(200).json(medicine);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 Update medicine by ID
router.put("/update/:id", async (req, res) => {
    try {
        const updatedMedicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedMedicine) {
            return res.status(404).json({ error: "Medicine not found" });
        }

        res.status(200).json({ message: "Medicine updated", updatedMedicine });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 Delete medicine by ID
router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedMedicine = await Medicine.findByIdAndDelete(req.params.id);

        if (!deletedMedicine) {
            return res.status(404).json({ error: "Medicine not found" });
        }

        res.status(200).json({ message: "Medicine deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

