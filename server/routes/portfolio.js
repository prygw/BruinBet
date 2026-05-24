const express = require('express');
const { checkAuth } = require('../middleware/auth');
const { getDb } = require('../db');
const router = express.Router();

router.get('/', checkAuth, async (req,res) => {
        try {
                const db = await getDb();
                const positions = await db.all(`SELECT bets.id as id_bet, bets.amount, bets.created_at, markets.id as id_market, markets.market_name, markets.description, markets.status, markets.closes_at, markets.winning_option_id, market_options.id as id_option, market_options.label as option_label FROM bets JOIN markets on markets.id = bets.market_id JOIN market_options on market_options.id = bets.option_id WHERE bets.user_id = ? ORDER BY bets.created_at DESC`, [req.userId]);
                res.json({positions});
        } catch(err) {
                console.error('PORTFOLIO ROUTE ERROR', err);
                res.status(500).json({error: "Issue with database fetching portfolio."});
        }
});

module.exports = router;
