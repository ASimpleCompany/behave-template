const express = require('express');
const {
    salarytable,
    create,
    update,
    aprove,
    salaryget,
    salarytablecontract
} = require('../controllers/salary');

const router = express.Router();

router.route('/').post(create);
router.route('/').get(salarytable);

router.route('/:id/contract').get(salarytablecontract);
router.route('/:id').put(update).get(salaryget);
router.route('/:id/approve').put(aprove);


module.exports = router;
