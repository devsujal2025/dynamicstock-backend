const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String },
    role: { type: String, enum: ["admin", "pharmacist", "customer"], required: true },
    region: { type: String }, // Only for pharmacists
});

module.exports = mongoose.model("User", UserSchema);
