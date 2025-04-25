const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Add item to cart
router.post("/add", async (req, res) => {
  const { userId, medicineName, quantity, price } = req.body;

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.medicineName === medicineName);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ medicineName, quantity, price });
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart", error: err.message });
  }
});

// Get cart for user
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.status(200).json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart", error: err.message });
  }
});

module.exports = router;
