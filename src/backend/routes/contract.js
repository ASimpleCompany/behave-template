const express = require('express');
const {
    contracttable,
    contracttype,
    createcontractcomplete,
    update,
    deletecontract,
    contractget,
    contractendget,
    aprovecontract,
    hasactivesalary,
    contracttypeendcreate,
    contracttypeendupdate
} = require('../controllers/contract');

const router = express.Router();


router.route('/').post(createcontractcomplete).get(contracttable);
router.route('/type').get(contracttype);
router.route('/aprove/:id').post(aprovecontract);
router.route('/hassalary/:id').post(hasactivesalary);
router.route('/:id').put(update).delete(deletecontract).get(contractget);

router.route('/finalize/:id').get(contractendget).put(contracttypeendupdate);
router.route('/finalize').post(contracttypeendcreate);


module.exports = router;
