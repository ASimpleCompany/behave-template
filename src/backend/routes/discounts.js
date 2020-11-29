const express = require('express');
const {tablefixeddiscounts} = require('../controllers/discounts');

const router = express.Router();

router.route('/fixed').get(tablefixeddiscounts);



module.exports = router;
