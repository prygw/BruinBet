const express = require('express');

const router = express.Router();

router.use('/markets', marketsRouter);
router.use('/', require('./health'));
router.use('/auth', require('./auth'));

module.exports = router;
