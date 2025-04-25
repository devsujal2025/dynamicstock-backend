const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();
const SECRET_KEY = "your_secret_key";

// 🔹 Middleware to Check Admin Role
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header("Authorization");
        if (!token) return res.status(401).json({ msg: "No token, access denied" });

        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.role !== "admin") return res.status(403).json({ msg: "Unauthorized" });

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Invalid token" });
    }
};

// 🔹 Admin Creates Pharmacist
router.post("/create-pharmacist", adminAuth, async (req, res) => {
    const { name, email, password, region } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "Pharmacist already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword, role: "pharmacist", region });

        await user.save();
        res.json({ msg: "Pharmacist created successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
