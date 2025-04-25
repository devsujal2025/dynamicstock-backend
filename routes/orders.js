const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User'); // Assuming you have a User model
const router = express.Router();

// Route to place an order
router.post('/place-order', async (req, res) => {
    const { userId, items, totalAmount } = req.body;

    try {
        // Create the new order
        const newOrder = new Order({
            user: userId, // Link the order with the logged-in user's ID
            items: items,
            totalAmount: totalAmount,
            status: 'pending'
        });

        // Save the order to the database
        await newOrder.save();

        // Respond with success message
        res.status(201).json({ success: true, message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error placing order', error: error.message });
    }
});

// Route to get orders by user
router.get('/user-orders/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find orders by user ID
        const orders = await Order.find({ user: userId }).populate('items.product'); // Populate product details

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
});

module.exports = router;
