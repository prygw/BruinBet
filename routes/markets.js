const express = require('express');
const { checkAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();

// getter function to check if Market is open/closed/settled based on current time and DB fields
function getMarketStatus(row, now = Date.now()) {
    // logic here
}


// GET /api/markets
router.get('/', checkAuth, async (req, res) => {
    try {
        // need to get and filter markets by status
        res.json({ markets: [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error with getting markets" });
    }
});


// GET /api/markets/:id
router.get('/:id', checkAuth, async (req, res) => {
    try {
        // get market by id
        res.json({ message: "Market details" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error with getting market by id" });
    }
});

// admin-only, create a new market with options -> request body should include all necessary info (e.g. question, options, closing time, etc)
router.post('/', checkAuth, requireAdmin, async (req, res) => {
    try {
        // should have some validation logic here
        // insert market and options into database via transaction
        res.status(201).json({ message: "Market creation" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error with creating market" });
    }
});

module.exports = router;
