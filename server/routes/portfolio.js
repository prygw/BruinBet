const express = require('express');
const { checkAuth } = require('../middleware/auth');
const { getPositionsByUser } = require('../controllers/portfolioController');
const router = express.Router();

router.get('/', checkAuth, async (req,res) => {
        try {
                const positions = await getPositionsByUser(req.userId);
                res.json({ positions });
        } catch (err) {
                console.error('PORTFOLIO ROUTE ERROR', err);
                res.status(500).json({ error: "Issue with database fetching portfolio." });
        }
});

module.exports = router;
