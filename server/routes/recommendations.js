// AI-GENERATED CODE START: recommendations route imports and setup
const express = require('express');
const { checkAuth } = require('../middleware/auth');
const { getDb } = require('../db');

const router = express.Router();
const RECOMMENDATION_LIMIT = 3;
// AI-GENERATED CODE END: recommendations route imports and setup

// AI-GENERATED CODE START: open-market status SQL predicate helper
const OPEN_MARKET_WHERE = `
    markets.status = 'open'
    AND markets.winning_option_id IS NULL
    AND datetime(markets.closes_at) > datetime('now')
`;
// AI-GENERATED CODE END: open-market status SQL predicate helper

// AI-GENERATED CODE START: recommendation endpoint returning only market IDs
router.get('/', checkAuth, async (req, res) => {
    try {
        const db = await getDb();

        const topCategory = await db.get(
            `
                SELECT markets.category
                FROM bets
                JOIN markets ON markets.id = bets.market_id
                WHERE bets.user_id = ? AND markets.category IS NOT NULL AND TRIM(markets.category) != ''
                GROUP BY markets.category
                ORDER BY COUNT(*) DESC, COALESCE(SUM(bets.amount), 0) DESC, markets.category ASC
                LIMIT 1
            `,
            [req.userId]
        );

        const params = [];
        let categoryFilter = '';

        if (topCategory?.category) {
            categoryFilter = 'AND markets.category = ?';
            params.push(topCategory.category);
        }

        const recommendedMarkets = await db.all(
            `
                SELECT
                    markets.id,
                    COALESCE(SUM(bets.amount), 0) AS market_volume
                FROM markets
                LEFT JOIN bets ON bets.market_id = markets.id
                WHERE ${OPEN_MARKET_WHERE}
                ${categoryFilter}
                GROUP BY markets.id
                ORDER BY market_volume DESC, markets.created_at DESC, markets.id ASC
                LIMIT ?
            `,
            [...params, RECOMMENDATION_LIMIT]
        );

        res.json({
            recommended_market_ids: recommendedMarkets.map((market) => market.id),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error getting recommendations' });
    }
});
// AI-GENERATED CODE END: recommendation endpoint returning only market IDs

// AI-GENERATED CODE START: recommendations router export
module.exports = router;
// AI-GENERATED CODE END: recommendations router export
