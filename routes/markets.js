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


// GET /api/markets --> get markets based on status --> checkAuth option for now
router.get('/', async (req, res) => {
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


// GET /api/markets/:id -> checkAuth option for now
router.get('/:id', async (req, res) => {
    try {
        // get market by id
        res.json({ message: "Market details" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error with getting market by id" });
    }
});

// admin-only, create a new market with options -> request body should include all necessary info (e.g. question, options, closing time, etc)
// add checkAuth and requireAdmin back in later
router.post('/', async (req, res) => {
    try {
        const { market_name, description, category, closes_at, options } = req.body;

        // NEED TO ADD VALIDATION LTR (e.g. check that options is an array of strings, check that closes_at is a valid date in the future, etc)

        const db = await getDb();

        const result = await db.run(
            `INSERT INTO markets (market_name, description, category, closes_at, created_by, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [market_name, description, category || null, closes_at, 1, 'open'] // created_by hardcoded to 1 for now -> FIX LTR (also add stuff as constants?)
        );

        const marketId = result.lastID;

        const insertedOptions = [];
        for (const optionLabel of options) {
            const optionResult = await db.run(
                `INSERT INTO market_options (market_id, label) VALUES (?, ?)`,
                [marketId, optionLabel]
            );
            insertedOptions.push({
                id: optionResult.lastID,
                label: optionLabel
            });
        }

        res.status(201).json({
            success: true,
            market: { id: marketId, market_name, description, category, closes_at, status: 'open', options: insertedOptions }
        });
    } catch (err) {
        console.error("Market creation error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
