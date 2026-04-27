const express = require('express');

//this is the main aggregator

const router = express.Router();
//add new stuff here
router.use('/', require('./health'));

module.exports = router;
