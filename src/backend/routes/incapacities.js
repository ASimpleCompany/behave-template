//MODULES
const express = require('express');
const incapacities = require('../controllers/incapacities');

const router = express.Router();

router.route('/:id').get(incapacities.getIncapacities).put(incapacities.updateIncapacities);
router.route('/:id/approve').put(incapacities.aproveincapacity);
router.route('/').post(incapacities.createIncapacities);
router.route('/:id').delete(incapacities.deleteIncapacities);


module.exports = router;