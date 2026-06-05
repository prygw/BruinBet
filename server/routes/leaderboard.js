const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();


router.get('/', async (req, res) => {
	try {
		const users = await getLeaderboard();
		res.json({ users });
	} catch (err) {
		res.status(500).json({ error: "Error getting leaderboard" });
	}
});

module.exports = router;
