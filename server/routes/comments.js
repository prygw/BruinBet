const express = require('express')
const { checkAuth } = require('../middleware/auth')
const { getCommentsByMarket, getMarketById, insertComment, getCommentById } = require('../controllers/commentsController')

const router = express.Router();

router.get('/markets/:marketId', async (req, res) => {
	try {
		const comments = await getCommentsByMarket(req.params.marketId);
		res.json({ comments });
	} catch (err) {
		res.status(500).json({ 'error': 'Failed to fetch comments' });
	}
});

router.post('/markets/:marketId', checkAuth, async (req, res) => {
	try {
		const msg = (req.body.body || '').trim();
		if (!msg)
			return res.status(400).json({ 'error': 'Cannot be empty' });
		if (msg.length > 500)
			return res.status(400).json({ 'error': 'Comment cannot be longer than 500 characters' });
		const market = await getMarketById(req.params.marketId);
		if (!market) return res.status(404).json({ 'error': 'Market not found' });
		const result = await insertComment(req.params.marketId, req.userId, msg);
		const comment = await getCommentById(result.lastID)
		//worked
		res.status(201).json({ comment });
	} catch (err) {
		res.status(500).json({ 'error': 'Failed to post comments' })
	}
});

module.exports = router;
