//MODULES
const express = require('express');
const {deletedeatil,discountlist,create,actualizar,dataplanilladecimo,printdetalevacation,
    getdetalle,printdetale,printdetaleAll, dataplanilla} = require('../controllers/payrolldetail');

const router = express.Router();


router.route('/').post(create);
router.route('/list').get(discountlist);
router.route('/report/:id').get(printdetale);
router.route('/reportall/:id').get(printdetaleAll);
router.route('/reportpayrol/:id').get(dataplanilla);
router.route('/reporttenth/:id').get(dataplanilladecimo);
router.route('/reportvaction/:id').get(printdetalevacation);

router.route('/planilla/:id').get(printdetaleAll);
router.route('/:id').delete(deletedeatil).put(actualizar).get(getdetalle);

module.exports = router;