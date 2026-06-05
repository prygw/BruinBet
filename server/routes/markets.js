const express = require('express');
const { checkAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
    getMarketSummary,
    getMarketOptionsWithLiquidity,
    getMarketCreatedAt,
    getMarketOptions,
    getMarketBets,
    getAllMarketsSummary,
    getOptionsWithLiquidityForMarkets,
    getMarketById,
    getBetCount,
    getRefundsByUser,
    getMarketOptionById,
    getMarketPool,
    getWinningBets,
    beginTransaction,
    commit,
    rollback,
    insertMarket,
    insertMarketOption,
    updateMarket,
    updateMarketOptionLabel,
    deleteMarketOptions,
    addToUserBalance,
    deleteBetsByMarket,
    clearWinningOption,
    deleteMarket,
    resolveMarket,
} = require('../controllers/marketsController');

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

async function getMarketWithOptions(marketId) {
    const market = await getMarketSummary(marketId);

    if (!market) {
        return null;
    }

    const options = await getMarketOptionsWithLiquidity(market.id);

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

function toIsoTimestamp(value) {
    if (!value) {
        return new Date().toISOString();
    }

    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
        return new Date(parsed).toISOString();
    }

    return new Date().toISOString();
}

async function getProbabilityHistory(marketId) {
    const market = await getMarketCreatedAt(marketId);

    if (!market) {
        return null;
    }

    const options = await getMarketOptions(marketId);

    const bets = await getMarketBets(marketId);

    const marketCreatedAt = Date.parse(market.created_at);
    const betTimes = bets
        .map((bet) => Date.parse(bet.created_at))
        .filter((timestamp) => Number.isFinite(timestamp));
    const firstEventTime = Math.min(
        Number.isFinite(marketCreatedAt) ? marketCreatedAt : Date.now(),
        ...betTimes
    );
    const initialTime = new Date(firstEventTime - (betTimes.length ? 1000 : 0)).toISOString();
    const totalsByOption = new Map(options.map((option) => [option.id, 0]));
    let totalPool = 0;

    const pointsByOption = new Map(
        options.map((option) => [
            option.id,
            [{ timestamp: initialTime, probability: 0 }],
        ])
    );

    for (const bet of bets) {
        const amount = Number(bet.amount || 0);
        const optionId = bet.option_id;

        if (!totalsByOption.has(optionId) || amount <= 0) {
            continue;
        }

        totalsByOption.set(optionId, totalsByOption.get(optionId) + amount);
        totalPool += amount;

        const timestamp = toIsoTimestamp(bet.created_at);
        for (const option of options) {
            const optionTotal = totalsByOption.get(option.id) || 0;
            const probability = totalPool > 0
                ? Number(((optionTotal / totalPool) * 100).toFixed(1))
                : 0;

            pointsByOption.get(option.id).push({ timestamp, probability });
        }
    }

    const now = new Date().toISOString();
    for (const option of options) {
        const points = pointsByOption.get(option.id);
        const lastPoint = points[points.length - 1];
        if (lastPoint.timestamp !== now) {
            points.push({ timestamp: now, probability: lastPoint.probability });
        }
    }

    return options.map((option) => ({
        option_id: option.id,
        label: option.label,
        points: pointsByOption.get(option.id),
    }));
}


// GET /api/markets --> get markets based on status --> checkAuth option for now
router.get('/', async (req, res) => {
    try {
        const statusFilter = req.query.status || "open";
        const searchTerm = (req.query.search || "").trim().toLowerCase();

        // need to get and filter markets by status
        const rows = await getAllMarketsSummary();
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

        const optionRows = await getOptionsWithLiquidityForMarkets(marketIds);

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

// GET /api/markets/:id/history -> step-function probability history by outcome
router.get('/:id/history', async (req, res) => {
    try {
        const marketId = Number(req.params.id);
        if (!Number.isInteger(marketId)) {
            return res.status(400).json({ error: "A valid market id is required" });
        }

        const series = await getProbabilityHistory(marketId);

        if (!series) {
            return res.status(404).json({ error: "Market not found" });
        }

        res.json({ series });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error with getting market probability history" });
    }
});


// GET /api/markets/:id -> checkAuth option for now
router.get('/:id', async (req, res) => {
    try {
        const market = await getMarketWithOptions(req.params.id);

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

        await beginTransaction();
        transactionStarted = true;

        const marketResult = await insertMarket(marketName, description, category, new Date(closesAtMs).toISOString(), req.userId);

        const marketId = marketResult.lastID;
        const createdOptions = [];

        for (const label of uniqueOptionLabels) {
            const optionResult = await insertMarketOption(marketId, label);

            createdOptions.push({
                id: optionResult.lastID,
                market_id: marketId,
                label,
            });
        }

        await commit();
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
            await rollback();
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

        const market = await getMarketById(marketId);

        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        if (market.created_by !== req.userId) {
            return res.status(403).json({ error: "You can only edit markets you created" });
        }

        if (market.status === "closed" || market.winning_option_id) {
            return res.status(400).json({ error: "Resolved markets cannot be edited" });
        }

        const betCountRow = await getBetCount(marketId);
        const betCount = Number(betCountRow.bet_count || 0);
        const existingOptions = await getMarketOptions(marketId);

        if (betCount > 0 && uniqueOptionLabels.length !== existingOptions.length) {
            return res.status(400).json({ error: "Cannot add or remove options after bets have been placed" });
        }

        await beginTransaction();
        transactionStarted = true;

        await updateMarket(marketName, description, category, new Date(closesAtMs).toISOString(), marketId);

        if (betCount > 0) {
            for (let index = 0; index < existingOptions.length; index += 1) {
                await updateMarketOptionLabel(uniqueOptionLabels[index], existingOptions[index].id, marketId);
            }
        } else {
            await deleteMarketOptions(marketId);
            for (const label of uniqueOptionLabels) {
                await insertMarketOption(marketId, label);
            }
        }

        await commit();
        transactionStarted = false;

        const updatedMarket = await getMarketWithOptions(marketId);
        res.json({ market: updatedMarket });
    } catch (err) {
        if (transactionStarted) {
            await rollback();
        }

        console.error(err);
        res.status(500).json({ error: "Internal Server Error with editing market" });
    }
});

// admin-only, remove a market created by the current admin.
// Unresolved markets refund stakes; resolved markets have already paid out, so balances are left unchanged.
router.delete('/:id', checkAuth, requireAdmin, async (req, res) => {
    let transactionStarted = false;

    try {
        const marketId = Number(req.params.id);
        if (!Number.isInteger(marketId)) {
            return res.status(400).json({ error: "A valid market id is required" });
        }

        const market = await getMarketById(marketId);

        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        if (market.created_by !== req.userId) {
            return res.status(403).json({ error: "You can only remove markets you created" });
        }

        const isResolved = market.status === "closed" || Boolean(market.winning_option_id);

        const refunds = isResolved
            ? []
            : await db.all(
                `SELECT user_id, SUM(amount) AS amount
                 FROM bets
                 WHERE market_id = ?
                 GROUP BY user_id
                 ORDER BY user_id ASC`,
                [marketId]
            );

        await beginTransaction();
        transactionStarted = true;

        for (const refund of refunds) {
            await addToUserBalance(Number(refund.amount || 0), refund.user_id);
        }

        await deleteBetsByMarket(marketId);
        await clearWinningOption(marketId);
        await deleteMarketOptions(marketId);
        await deleteMarket(marketId);

        await commit();
        transactionStarted = false;

        res.json({
            removed_market_id: marketId,
            was_resolved: isResolved,
            refunds: refunds.map((refund) => ({
                user_id: refund.user_id,
                amount: Number(refund.amount || 0),
            })),
            refund_total: refunds.reduce((sum, refund) => sum + Number(refund.amount || 0), 0),
        });
    } catch (err) {
        if (transactionStarted) {
            await rollback();
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

        const market = await getMarketById(marketId);

        if (!market) {
            return res.status(404).json({ error: "Market not found" });
        }

        if (market.status === "closed" || market.winning_option_id) {
            return res.status(400).json({ error: "Market has already been resolved" });
        }

        const winningOption = await getMarketOptionById(winningOptionId, marketId);

        if (!winningOption) {
            return res.status(400).json({ error: "Winning option does not belong to this market" });
        }

        const poolRow = await getMarketPool(marketId);
        const totalPool = Number(poolRow.total_pool || 0);

        const winningBets = await getWinningBets(marketId, winningOptionId);

        const winningPool = winningBets.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
        const payouts = allocatePayouts(winningBets, totalPool, winningPool);

        await beginTransaction();
        transactionStarted = true;

        await resolveMarket(winningOptionId, marketId);

        for (const payout of payouts) {
            await addToUserBalance(payout.payout, payout.user_id);
        }

        await commit();
        transactionStarted = false;

        const resolvedMarket = await getMarketWithOptions(marketId);

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
            await rollback();
        }

        console.error(err);
        res.status(500).json({ error: "Internal Server Error with resolving market" });
    }
});

module.exports = router;
