// routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");

// GET user's cart
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json(cart || { userId: req.params.userId, items: [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to get cart" });
  }
});

// POST - add/update item in cart
router.post("/add", async (req, res) => {
  const { userId, medicineId, name, price, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.medicineId.toString() === medicineId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity || 1;
    } else {
      cart.items.push({ medicineId, name, price, quantity: quantity || 1 });
    }

    await cart.save();
    res.json({ message: "Item added to cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// DELETE - remove item
router.delete("/:userId/remove/:medicineId", async (req, res) => {
  const { userId, medicineId } = req.params;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = cart.items.filter(item => item.medicineId.toString() !== medicineId);
    await cart.save();
    res.json({ message: "Item removed", cart });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item" });
  }
});
