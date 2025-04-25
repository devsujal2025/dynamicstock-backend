const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  medicineName: String,
  quantity: { type: Number, default: 1 },
  price: Number
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema]
});

module.exports = mongoose.model("Cart", cartSchema);
