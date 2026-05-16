const express = require('express');
const { checkAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { getDb } = require('../db');

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
        const searchTerm = (req.query.search || "").trim().toLowerCase();
        const db = await getDb();

        // need to get and filter markets by status
        const rows = await db.all(`
            SELECT
                markets.*,
                (
                    SELECT COUNT(*)
                    FROM market_options
                    WHERE market_options.market_id = markets.id
                ) AS option_count,
                (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM bets
                    WHERE bets.market_id = markets.id
                ) AS total_liquidity,
                (
                    SELECT COUNT(*)
                    FROM bets
                    WHERE bets.market_id = markets.id
                ) AS bet_count
            FROM markets
            ORDER BY created_at DESC
        `);
        const now = Date.now();

        const markets = rows
            .map(row => ({ ...row, status: getMarketStatus(row, now) }))
            .filter(row => row.status === statusFilter)
            .filter(row => {
                if (!searchTerm) {
                    return true;
                }

                return [row.market_name, row.description, row.category]
                    .filter(Boolean)
                    .some(value => value.toLowerCase().includes(searchTerm));
            });

        res.json({ markets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error with getting markets" });
    }
});


// GET /api/markets/:id -> checkAuth option for now
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const market = await db.get(`
            SELECT
                markets.*,
                (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM bets
                    WHERE bets.market_id = markets.id
                ) AS total_liquidity,
                (
                    SELECT COUNT(*)
                    FROM bets
                    WHERE bets.market_id = markets.id
                ) AS bet_count
            FROM markets
            WHERE markets.id = ?
        `, [req.params.id]);

        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        const options = await db.all(`
            SELECT
                market_options.*,
                COALESCE(SUM(bets.amount), 0) AS total_liquidity,
                COUNT(bets.id) AS bet_count
            FROM market_options
            LEFT JOIN bets ON bets.option_id = market_options.id
            WHERE market_options.market_id = ?
            GROUP BY market_options.id
            ORDER BY market_options.id ASC
        `, [market.id]);

        res.json({
            market: {
                ...market,
                status: getMarketStatus(market),
                options,
            },
        });
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
