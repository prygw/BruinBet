const express = require('express');
const healthRouter = require('./health');

//this is the main aggregator

const router = express.Router();

router.use('/', healthRouter);

module.exports = router;
