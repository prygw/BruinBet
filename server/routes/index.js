const express = require('express');

const router = express.Router();

router.use('/markets', require('./markets'));
router.use('/', require('./health'));
router.use('/auth', require('./auth'));

module.exports = router;
