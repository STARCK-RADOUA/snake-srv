const express = require('express');
const { updateSeenWarns } = require('../controllers/warnController');
const router = express.Router();

router.put('/update-all-warns-seen', updateSeenWarns);


module.exports = router;
