//MODULES
const express = require('express')
const uploadFile = require('../middleware/attedance')
const attendance = require('../controllers/attendance')
const attendanceManual = require('../controllers/attendanceManual');

const router = express.Router();

router
.route('/').post(attendance.createAttendance)

// .route('/manual/attedance/').post()
// .route('/manual/attedance/').post()
// .route('/manual/attedance/').post()






module.exports = router;