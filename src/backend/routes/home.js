const express = require('express');
const { homeStats, pendingView ,pendingstatsemployee} = require('../controllers/home');

const router = express.Router();

router.route('/stats').get(homeStats);
router.route('/pendingview').get(pendingView);
router.route('/piechar').get(pendingstatsemployee);



module.exports = router;
