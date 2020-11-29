//MODULES
const express = require('express')
const attendanceManual = require('../controllers/attendanceManual');
const router = express.Router();

router
.route('/:id/employee').get(attendanceManual.getAttedances);
// .route('/manual/attedance/').post()
// .route('/manual/attedance/').post()
// .route('/manual/attedance/').post()


module.exports = router;