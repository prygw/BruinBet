const express = require('express');
const { checkAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { getDb } = require('../server/db');

const router = express.Router();

function getMarketStatus(row, now = Date.now()) {
    // if DB says it's closed, it's closed
    // if current time is past closing time, it's expired
    // else, it's open
    if (row.status === 'closed' || row.winning_option_id) {
        return "closed";
    }
    if (Date.parse(row.closes_at) <= now) {
        return "expired";
    };

    return "open";
}


// GET /api/markets --> get markets based on status
router.get('/', checkAuth, async (req, res) => {
    try {
        const statusFilter = req.query.status || "open";
        const db = await getDb();

        // need to get and filter markets by status
        const rows = await db.all('SELECT * FROM markets ORDER BY created_at DESC');
        const now = Date.now();

        const markets = rows
            .map(row => ({ ...row, status: getMarketStatus(row, now) }))
            .filter(row => row.status === statusFilter);

        res.json({ markets });
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
