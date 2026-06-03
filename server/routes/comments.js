const express = require('express')
const {checkAuth} = require('../middleware/auth')
const {getDb} = require('../db')

const router = express.Router();

router.get('/markets/:marketId', async (req, res) => {
	try {
		const db = await getDb();
		const comments = await db.all(`SELECT comments.id, comments.body, comments.created_at, users.username FROM comments JOIN users ON users.id = comments.user_id WHERE comments.market_id = ? ORDER by comments.created_at DESC`, [req.params.marketId]);
		res.json({comments});
	} catch(err) {
		res.status(500).json({'error': 'Failed to fetch comments'});
	}
});

router.post('/markets/:marketId', checkAuth, async (req, res) => {
	try {
		const msg = (req.body.body || '').trim();
		if (!msg)
			return res.status(400).json({'error': 'Cannot be empty'});
		if (msg.length > 500)
			return res.status(400).json({'error': 'Comment cannot be longer than 500 characters'});
		const db = await getDb();
		const market = await db.get(`SELECT id FROM markets WHERE id = ?`, [req.params.marketId]);
		if (!market) return res.status(404).json({'error': 'Market not found'});
		const result = await db.run(`INSERT INTO comments (market_id, user_id, body) VALUES (?, ?, ?)`, [req.params.marketId, req.userId, msg]);
		const comment = await db.get(`SELECT comments.id, comments.body, comments.created_at, users.username FROM comments JOIN users ON users.id = comments.user_id WHERE comments.id = ?`, [result.lastID])
		//worked
		res.status(201).json({comment});
	} catch(err) {
		res.status(500).json({'error': 'Failed to post comments'})
	}
});

module.exports = router;
