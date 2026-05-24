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

function normalizeOptionLabels(options) {
    if (!Array.isArray(options)) {
        return [];
    }

    return options
        .map(option => {
            if (typeof option === "string") {
                return option.trim();
            }

            if (option && typeof option.label === "string") {
                return option.label.trim();
            }

            return "";
        })
        .filter(Boolean);
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

        // trying to get options for each market to display those too (need to do this bc market options live in different table than markets)
        const marketIds = markets.map(m => m.id);
        const questonMarks = marketIds.map(() => '?').join(',');

        const optionRows = await db.all(
            `SELECT
                market_options.id,
                market_options.market_id,
                market_options.label,
                COALESCE(SUM(bets.amount), 0) AS total_liquidity,
                COUNT(bets.id) AS bet_count
            FROM market_options
            LEFT JOIN bets ON bets.option_id = market_options.id
            WHERE market_options.market_id IN (${questonMarks})
            GROUP BY market_options.id
            ORDER BY market_options.id ASC`,
            marketIds
        );

        const optionsForEachMarket = optionRows.reduce((acc, row) => {
            acc[row.market_id] = acc[row.market_id] || [];
            acc[row.market_id].push(row);
            return acc;
        }, {});

        for (const market of markets) {
            const options = optionsForEachMarket[market.id] || [];
            const totalMoneyBet = options.reduce((sum, option) => sum + Number(option.total_liquidity || 0), 0);
            market.options = options.map((option) => ({
                ...option,
                total_liquidity: Number(option.total_liquidity || 0),
                percent: totalMoneyBet > 0 ? Number(((Number(option.total_liquidity || 0) / totalMoneyBet) * 100).toFixed(1)) : 0,
            }));
        }

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

        const totalMoneyBet = options.reduce((sum, option) => sum + Number(option.total_liquidity || 0), 0);
        const optionsWithPct = options.map((option) => ({
            ...option,
            total_liquidity: Number(option.total_liquidity || 0),
            percent: totalMoneyBet > 0 ? Number(((Number(option.total_liquidity || 0) / totalMoneyBet) * 100).toFixed(1)) : 0,
        }));

        res.json({
            market: {
                ...market,
                status: getMarketStatus(market),
                options: optionsWithPct,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error with getting market by id" });
    }
});

// admin-only, create a new market with options -> request body should include all necessary info (e.g. question, options, closing time, etc)
router.post('/', checkAuth, requireAdmin, async (req, res) => {
    let transactionStarted = false;

    try {
        const marketName = (req.body.market_name || req.body.title || "").trim();
        const description = (req.body.description || "").trim();
        const category = (req.body.category || "").trim() || null;
        const closesAtRaw = req.body.closes_at;
        const optionLabels = normalizeOptionLabels(req.body.options);

        if (!marketName) {
            return res.status(400).json({ error: "Market name is required" });
        }

        if (!description) {
            return res.status(400).json({ error: "Description is required" });
        }

        const closesAtMs = Date.parse(closesAtRaw);
        if (!closesAtRaw || Number.isNaN(closesAtMs)) {
            return res.status(400).json({ error: "A valid closes_at date is required" });
        }

        if (closesAtMs <= Date.now()) {
            return res.status(400).json({ error: "closes_at must be in the future" });
        }

        const uniqueOptionLabels = [...new Set(optionLabels)];
        if (uniqueOptionLabels.length < 2) {
            return res.status(400).json({ error: "At least two unique options are required" });
        }

        const db = await getDb();
        await db.run("BEGIN");
        transactionStarted = true;

        const marketResult = await db.run(
            `
                INSERT INTO markets (market_name, description, category, closes_at, created_by)
                VALUES (?, ?, ?, ?, ?)
            `,
            [marketName, description, category, new Date(closesAtMs).toISOString(), req.userId]
        );

        const marketId = marketResult.lastID;
        const createdOptions = [];

        for (const label of uniqueOptionLabels) {
            const optionResult = await db.run(
                "INSERT INTO market_options (market_id, label) VALUES (?, ?)",
                [marketId, label]
            );

            createdOptions.push({
                id: optionResult.lastID,
                market_id: marketId,
                label,
            });
        }

        await db.run("COMMIT");
        transactionStarted = false;

        res.status(201).json({
            market: {
                id: marketId,
                market_name: marketName,
                description,
                category,
                status: "open",
                closes_at: new Date(closesAtMs).toISOString(),
                created_by: req.userId,
                options: createdOptions,
            },
        });
    } catch (err) {
        if (transactionStarted) {
            const db = await getDb();
            await db.run("ROLLBACK");
        }

        console.error(err);
        res.status(500).json({ error: "Internal Server Error with creating market" });
    }
});

module.exports = router;
