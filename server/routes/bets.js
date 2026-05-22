const express = require('express');
const { checkAuth } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

function isOpenMarket(market) {
    if (market.status === 'closed' || market.winning_option_id) {
        return false;
    }

    return Date.parse(market.closes_at) > Date.now();
}

// POST /api/bets — place a bet on an open market
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

        const db = await getDb();

        const market = await db.get('SELECT * FROM markets WHERE id = ?', [marketId]);
        if (!market) {
            return res.status(404).json({ error: 'Market not found' });
        }

        if (!isOpenMarket(market)) {
            return res.status(400).json({ error: 'Market is not open for betting' });
        }

        const option = await db.get(
            'SELECT id, label FROM market_options WHERE id = ? AND market_id = ?',
            [optionId, marketId]
        );
        if (!option) {
            return res.status(400).json({ error: 'Option does not belong to this market' });
        }

        const user = await db.get('SELECT balance FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        await db.run('BEGIN');
        transactionStarted = true;

        const balanceUpdate = await db.run(
            'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?',
            [amount, userId, amount]
        );

        if (balanceUpdate.changes !== 1) {
            await db.run('ROLLBACK');
            transactionStarted = false;
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const result = await db.run(
            'INSERT INTO bets (user_id, market_id, option_id, amount) VALUES (?, ?, ?, ?)',
            [userId, marketId, optionId, amount]
        );
        await db.run('COMMIT');
        transactionStarted = false;

        const { balance } = await db.get('SELECT balance FROM users WHERE id = ?', [userId]);

        res.status(201).json({
            bet: { id: result.lastID, user_id: userId, market_id: marketId, option_id: optionId, amount },
            balance,
        });
    } catch (err) {
        if (transactionStarted) {
            const db = await getDb();
            await db.run('ROLLBACK');
        }

        console.error(err);
        res.status(500).json({ error: 'Something went wrong with placing your bet. Please try again.' });
    }
});

module.exports = router;
