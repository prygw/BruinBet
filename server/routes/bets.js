const express = require('express');
const { checkAuth } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();

// POST /api/bets — place a bet on an open market
router.post('/', checkAuth, async (req, res) => {
    try {
        const { market_id, option_id, amount } = req.body;
        const userId = req.userId;

        const db = await getDb();

        const user = await db.get('SELECT balance FROM users WHERE id = ?', [userId]);

        await db.run('BEGIN');
        await db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);
        const result = await db.run(
            'INSERT INTO bets (user_id, market_id, option_id, amount) VALUES (?, ?, ?, ?)',
            [userId, market_id, option_id, amount]
        );
        await db.run('COMMIT');

        const { balance } = await db.get('SELECT balance FROM users WHERE id = ?', [userId]);

        res.status(201).json({
            bet: { id: result.lastID, user_id: userId, market_id, option_id, amount },
            balance,
        });
    } catch (err) {
        await db.run('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Something went wrong with placing your bet. Please try again.' });
    }
});

module.exports = router;
