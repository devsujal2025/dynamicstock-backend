const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
    name: String,
    price: Number,
    expiryDate: Date,
    stock: Number,
    pharmacistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
});

module.exports = mongoose.model("Medicine", medicineSchema);
