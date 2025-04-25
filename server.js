const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Medicine = require("./models/Medicine");
const User = require("./models/User");
const OrderRoutes = require("./routes/orders");
const app = express();
app.use(express.json());
app.use(cors());
app.use(OrderRoutes);
const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

const MONGO_URI = "mongodb+srv://myadmin1:kgce123@kgce.hf4pb.mongodb.net/?retryWrites=true&w=majority&appName=kgce";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((error) => {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  });

const SECRET_KEY = "21272dc90be5be7d43354397137672336d5b4283aedabc919116e3dd1a3a8d08";
const TOKEN_EXPIRY = "1h";

// Middleware: Authentication
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized: Token Missing" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden: Invalid Token" });
        req.user = user;
        next();
    });
};

// Middleware: Role-Based Access Control
const authorizeRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Access Denied: Insufficient Permissions" });
    }
    next();
};

// CUSTOMER & ADMIN: Get All Medicines
app.get("/api/medicines", authenticateToken, async (req, res) => {
    try {
        const medicines = await Medicine.find();
        res.json(medicines);
    } catch (error) {
        console.error("❌ Error Fetching Medicines:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// PHARMACIST: Get Own Medicines Only
app.get("/api/pharmacist/medicines", authenticateToken, authorizeRole(["pharmacist"]), async (req, res) => {
    try {
        const pharmacistId = req.user.id;
        const medicines = await Medicine.find({ pharmacistId });
        res.json(medicines);
    } catch (error) {
        console.error("❌ Error Fetching Pharmacist Medicines:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// ADD Medicine (Pharmacist only their own)
app.post("/api/medicines", authenticateToken, authorizeRole(["admin", "pharmacist"]), async (req, res) => {
    try {
        const { name, price, expiryDate, stock } = req.body;
        const pharmacistId = req.user.id;
        const medicine = new Medicine({ name, price, expiryDate, stock, pharmacistId });
        await medicine.save();
        res.json(medicine);
    } catch (error) {
        console.error("❌ Error Adding Medicine:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// UPDATE Medicine - Secure with ownership check
app.put("/api/medicines/:id", authenticateToken, authorizeRole(["admin", "pharmacist"]), async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }

        if (userRole === "pharmacist" && medicine.pharmacistId.toString() !== userId) {
            return res.status(403).json({ message: "Access denied: Not your medicine" });
        }

        const updatedMedicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedMedicine);
    } catch (error) {
        console.error("❌ Error Updating Medicine:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// DELETE Medicine - Secure with ownership check
app.delete("/api/medicines/:id", authenticateToken, authorizeRole(["admin", "pharmacist"]), async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }

        if (userRole === "pharmacist" && medicine.pharmacistId.toString() !== userId) {
            return res.status(403).json({ message: "Access denied: Not your medicine" });
        }

        await Medicine.findByIdAndDelete(req.params.id);
        res.json({ message: "✅ Medicine deleted successfully" });
    } catch (error) {
        console.error("❌ Error Deleting Medicine:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();
        res.json({ message: "✅ User registered successfully" });
    } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, name: user.name, role: user.role },
            SECRET_KEY,
            { expiresIn: TOKEN_EXPIRY }
        );

        res.json({ token, role: user.role });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// CREATE ADMIN
app.post("/api/auth/create-admin", async (req, res) => {
    const { name, email, password } = req.body;
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
        return res.status(400).json({ error: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({ name, email, password: hashedPassword, role: "admin" });
    await admin.save();

    res.json({ message: "Admin user created successfully!" });
});

// ADMIN: Get Users
app.get("/api/users", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
    try {
        const users = await User.find({}, "-password");
        res.json(users);
    } catch (error) {
        console.error("❌ Error Fetching Users:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// ADMIN: Delete User
app.delete("/api/users/:id", authenticateToken, authorizeRole(["admin"]), async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("❌ Error Deleting User:", error);
        res.status(500).json({ message: "Server Error" });
    }
});
// Fetch orders for a specific user

// MEDICINE SEARCH (Customer + All)
app.get("/api/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const medicines = await Medicine.find({
            name: { $regex: query, $options: "i" },
        }).limit(5);

        res.json(medicines);
    } catch (err) {
        console.error("❌ Error Searching Medicines:", err);
        res.status(500).json({ error: "Server error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
