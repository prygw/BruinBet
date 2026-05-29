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

function allocatePayouts(winningBets, totalPool, winningPool) {
    if (!winningBets.length || totalPool <= 0 || winningPool <= 0) {
        return [];
    }

    const payouts = winningBets.map((bet) => {
        const exactPayout = (Number(bet.amount) / winningPool) * totalPool;
        const payout = Math.floor(exactPayout);

        return {
            user_id: bet.user_id,
            winning_stake: Number(bet.amount),
            payout,
            remainder: exactPayout - payout,
        };
    });

    let remainder = totalPool - payouts.reduce((sum, payout) => sum + payout.payout, 0);
    payouts
        .sort((a, b) => b.remainder - a.remainder || b.winning_stake - a.winning_stake || a.user_id - b.user_id)
        .forEach((payout) => {
            if (remainder > 0) {
                payout.payout += 1;
                remainder -= 1;
            }
        });

    return payouts
        .sort((a, b) => a.user_id - b.user_id)
        .map(({ remainder: _remainder, ...payout }) => payout);
}

async function getMarketWithOptions(db, marketId) {
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
    `, [marketId]);

    if (!market) {
        return null;
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

    return {
        ...market,
        status: getMarketStatus(market),
        options: optionsWithPct,
    };
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
        if (marketIds.length === 0) {
            return res.json({ markets: [] });
        }

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
        const market = await getMarketWithOptions(db, req.params.id);

        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        res.json({ market });
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

        if (marketName.length > 200) {
            return res.status(400).json({ error: "Market name cannot exceed 200 characters" });
        }

        if (!description) {
            return res.status(400).json({ error: "Description is required" });
        }

        if (description.length > 1000) {
            return res.status(400).json({ error: "Description cannot exceed 1000 characters" });
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

// admin-only, edit an unresolved market created by the current admin
router.patch('/:id', checkAuth, requireAdmin, async (req, res) => {
    let transactionStarted = false;

    try {
        const marketId = Number(req.params.id);
        if (!Number.isInteger(marketId)) {
            return res.status(400).json({ error: "A valid market id is required" });
        }

        const marketName = (req.body.market_name || req.body.title || "").trim();
        const description = (req.body.description || "").trim();
        const category = (req.body.category || "").trim() || null;
        const closesAtRaw = req.body.closes_at;
        const optionLabels = normalizeOptionLabels(req.body.options);

        if (!marketName) {
            return res.status(400).json({ error: "Market name is required" });
        }

        if (marketName.length > 200) {
            return res.status(400).json({ error: "Market name cannot exceed 200 characters" });
        }

        if (!description) {
            return res.status(400).json({ error: "Description is required" });
        }

        if (description.length > 1000) {
            return res.status(400).json({ error: "Description cannot exceed 1000 characters" });
        }

        const closesAtMs = Date.parse(closesAtRaw);
        if (!closesAtRaw || Number.isNaN(closesAtMs)) {
            return res.status(400).json({ error: "A valid closes_at date is required" });
        }

        const uniqueOptionLabels = [...new Set(optionLabels)];
        if (uniqueOptionLabels.length < 2) {
            return res.status(400).json({ error: "At least two unique options are required" });
        }

        const db = await getDb();
        const market = await db.get("SELECT * FROM markets WHERE id = ?", [marketId]);

        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        if (market.created_by !== req.userId) {
            return res.status(403).json({ error: "You can only edit markets you created" });
        }

        if (market.status === "closed" || market.winning_option_id) {
            return res.status(400).json({ error: "Resolved markets cannot be edited" });
        }

        const betCountRow = await db.get("SELECT COUNT(*) AS bet_count FROM bets WHERE market_id = ?", [marketId]);
        const betCount = Number(betCountRow.bet_count || 0);
        const existingOptions = await db.all(
            "SELECT id, label FROM market_options WHERE market_id = ? ORDER BY id ASC",
            [marketId]
        );

        if (betCount > 0 && uniqueOptionLabels.length !== existingOptions.length) {
            return res.status(400).json({ error: "Cannot add or remove options after bets have been placed" });
        }

        await db.run("BEGIN");
        transactionStarted = true;

        await db.run(
            `UPDATE markets
             SET market_name = ?, description = ?, category = ?, closes_at = ?
             WHERE id = ?`,
            [marketName, description, category, new Date(closesAtMs).toISOString(), marketId]
        );

        if (betCount > 0) {
            for (let index = 0; index < existingOptions.length; index += 1) {
                await db.run(
                    "UPDATE market_options SET label = ? WHERE id = ? AND market_id = ?",
                    [uniqueOptionLabels[index], existingOptions[index].id, marketId]
                );
            }
        } else {
            await db.run("DELETE FROM market_options WHERE market_id = ?", [marketId]);
            for (const label of uniqueOptionLabels) {
                await db.run(
                    "INSERT INTO market_options (market_id, label) VALUES (?, ?)",
                    [marketId, label]
                );
            }
        }

        await db.run("COMMIT");
        transactionStarted = false;

        const updatedMarket = await getMarketWithOptions(db, marketId);
        res.json({ market: updatedMarket });
    } catch (err) {
        if (transactionStarted) {
            const db = await getDb();
            await db.run("ROLLBACK");
        }

        console.error(err);
        res.status(500).json({ error: "Internal Server Error with editing market" });
    }
});

// admin-only, remove an unresolved market and refund all placed bets
router.delete('/:id', checkAuth, requireAdmin, async (req, res) => {
    let transactionStarted = false;

    try {
        const marketId = Number(req.params.id);
        if (!Number.isInteger(marketId)) {
            return res.status(400).json({ error: "A valid market id is required" });
        }

        const db = await getDb();
        const market = await db.get("SELECT * FROM markets WHERE id = ?", [marketId]);

        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        if (market.created_by !== req.userId) {
            return res.status(403).json({ error: "You can only remove markets you created" });
        }

        if (market.status === "closed" || market.winning_option_id) {
            return res.status(400).json({ error: "Resolved markets cannot be removed as no-outcome markets" });
        }

        const refunds = await db.all(
            `SELECT user_id, SUM(amount) AS amount
             FROM bets
             WHERE market_id = ?
             GROUP BY user_id
             ORDER BY user_id ASC`,
            [marketId]
        );

        await db.run("BEGIN");
        transactionStarted = true;

        for (const refund of refunds) {
            await db.run(
                "UPDATE users SET balance = balance + ? WHERE id = ?",
                [Number(refund.amount || 0), refund.user_id]
            );
        }

        await db.run("DELETE FROM bets WHERE market_id = ?", [marketId]);
        await db.run("UPDATE markets SET winning_option_id = NULL WHERE id = ?", [marketId]);
        await db.run("DELETE FROM market_options WHERE market_id = ?", [marketId]);
        await db.run("DELETE FROM markets WHERE id = ?", [marketId]);

        await db.run("COMMIT");
        transactionStarted = false;

        res.json({
            removed_market_id: marketId,
            refunds: refunds.map((refund) => ({
                user_id: refund.user_id,
                amount: Number(refund.amount || 0),
            })),
            refund_total: refunds.reduce((sum, refund) => sum + Number(refund.amount || 0), 0),
        });
    } catch (err) {
        if (transactionStarted) {
            const db = await getDb();
            await db.run("ROLLBACK");
        }

        console.error(err);
        res.status(500).json({ error: "Internal Server Error with removing market" });
    }
});

// admin-only, resolve a market and distribute the market pool to winning bettors
router.post('/:id/resolve', checkAuth, requireAdmin, async (req, res) => {
    let transactionStarted = false;

    try {
        const marketId = Number(req.params.id);
        const rawWinningOptionId = req.body.winning_option_id ?? req.body.option_id;
        const winningOptionId = Number(rawWinningOptionId);

        if (!Number.isInteger(marketId)) {
            return res.status(400).json({ error: "A valid market id is required" });
        }

        if (!Number.isInteger(winningOptionId)) {
            return res.status(400).json({ error: "winning_option_id is required" });
        }

        const db = await getDb();
        const market = await db.get("SELECT * FROM markets WHERE id = ?", [marketId]);

        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        if (market.status === "closed" || market.winning_option_id) {
            return res.status(400).json({ error: "Market has already been resolved" });
        }

        const winningOption = await db.get(
            "SELECT id, label FROM market_options WHERE id = ? AND market_id = ?",
            [winningOptionId, marketId]
        );

        if (!winningOption) {
            return res.status(400).json({ error: "Winning option does not belong to this market" });
        }

        const poolRow = await db.get(
            `SELECT COALESCE(SUM(amount), 0) AS total_pool
             FROM bets
             WHERE market_id = ?`,
            [marketId]
        );
        const totalPool = Number(poolRow.total_pool || 0);

        const winningBets = await db.all(
            `SELECT user_id, SUM(amount) AS amount
             FROM bets
             WHERE market_id = ? AND option_id = ?
             GROUP BY user_id
             ORDER BY user_id ASC`,
            [marketId, winningOptionId]
        );

        const winningPool = winningBets.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
        const payouts = allocatePayouts(winningBets, totalPool, winningPool);

        await db.run("BEGIN");
        transactionStarted = true;

        await db.run(
            "UPDATE markets SET status = 'closed', winning_option_id = ? WHERE id = ?",
            [winningOptionId, marketId]
        );

        for (const payout of payouts) {
            await db.run(
                "UPDATE users SET balance = balance + ? WHERE id = ?",
                [payout.payout, payout.user_id]
            );
        }

        await db.run("COMMIT");
        transactionStarted = false;

        const resolvedMarket = await getMarketWithOptions(db, marketId);

        res.json({
            market: {
                ...resolvedMarket,
                winning_option: winningOption,
            },
            resolution: {
                total_pool: totalPool,
                winning_pool: winningPool,
                winner_count: payouts.length,
                payouts,
            },
        });
    } catch (err) {
        if (transactionStarted) {
            const db = await getDb();
            await db.run("ROLLBACK");
        }

        console.error(err);
        res.status(500).json({ error: "Internal Server Error with resolving market" });
    }
});

module.exports = router;
