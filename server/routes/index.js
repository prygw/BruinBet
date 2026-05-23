const express = require('express');

const router = express.Router();

router.use('/markets', require('./markets'));
router.use('/bets', require('./bets'));
router.use('/', require('./health'));
router.use('/auth', require('./auth'));
router.use('/portfolio', require('./portfolio'));
router.use('/leaderboard', require('./leaderboard'));

module.exports = router;
