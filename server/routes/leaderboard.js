const express = require('express');
const { getDb } = require('../db');

const router = express.Router();


router.get('/', async (req, res) => {
	try {
		const db = await getDb();
		const users = await db.all(`SELECT users.id, users.username, users.balance, COALESCE(SUM(bets.amount), 0) as total_bet_amount, COUNT(bets.id) as bet_count FROM users LEFT JOIN bets on bets.user_id = users.id GROUP BY users.id ORDER BY users.balance DESC, total_bet_amount DESC LIMIT 20`);
		res.json({users});
	} catch(err) {
		res.status(500).json({error: "Error getting leaderboard"});
	}
});

module.exports = router;

