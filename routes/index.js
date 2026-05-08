const express = require('express');

//this is the main aggregator

const router = express.Router();

router.use('/', require('./health'));
router.use('/auth', require('./auth'));

module.exports = router;
