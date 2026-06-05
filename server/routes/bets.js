const express = require('express');
const { checkAuth } = require('../middleware/auth');
const {
    getMarketById,
    getMarketOption,
    getUserBalance,
    beginTransaction,
    deductBalance,
    rollback,
    insertBet,
    commit,
    getPositionCount,
} = require('../controllers/betsController');

const router = express.Router();

function isOpenMarket(market) {
    if (market.status === 'closed' || market.winning_option_id) {
        return false;
    }

    return Date.parse(market.closes_at) > Date.now();
}

// user placing bets
router.post('/', checkAuth, async (req, res) => {
    let transactionStarted = false;

    try {
        const marketId = Number(req.body.market_id);
        const optionId = Number(req.body.option_id);
        const amount = Number(req.body.amount);
        const userId = req.userId;

        if (!Number.isInteger(marketId) || !Number.isInteger(optionId)) {
            return res.status(400).json({ error: 'market_id and option_id are required' });
        }

        if (!Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Bet amount must be a positive whole number' });
        }

        const user = await getUserBalance(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.is_admin) {
            return res.status(403).json({ error: 'Admin accounts cannot place bets' });
        }

        const market = await getMarketById(marketId);
        if (!market) {
            return res.status(404).json({ error: 'Market not found' });
        }

        if (!isOpenMarket(market)) {
            return res.status(400).json({ error: 'Market is not open for betting' });
        }

        const option = await getMarketOption(optionId, marketId);
        if (!option) {
            return res.status(400).json({ error: 'Option does not belong to this market' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        await beginTransaction();
        transactionStarted = true;

        const balanceUpdate = await deductBalance(userId, amount);

        if (balanceUpdate.changes !== 1) {
            await rollback();
            transactionStarted = false;
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const result = await insertBet(userId, marketId, optionId, amount);
        await commit();
        transactionStarted = false;

        const { balance } = await getUserBalance(userId);
        const { position_count: positionCount } = await getPositionCount(userId, marketId);

        res.status(201).json({
            bet: { id: result.lastID, user_id: userId, market_id: marketId, option_id: optionId, amount },
            balance,
            position_count: positionCount,
        });
    } catch (err) {
        if (transactionStarted) {
            await rollback();
        }

        console.error(err);
        res.status(500).json({ error: 'Something went wrong with placing your bet. Please try again.' });
    }
});

module.exports = router;
