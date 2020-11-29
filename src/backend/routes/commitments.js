//MODULES
const express = require('express');
const {table,tableemployee,create,update,deletecommitment,get,aprovecommitment} = require('../controllers/commitments');

const router = express.Router();
router.route('/:id/approve').put(aprovecommitment);
router.route('/:id/employee').get(tableemployee);
router.route('/').post(create).get(table);
router.route('/:id').get(get).put(update).delete(deletecommitment);

module.exports = router;