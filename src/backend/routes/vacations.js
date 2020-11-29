//MODULES
const express = require('express');
const {table,tableemployee,create,update,get,aprovevacation,deletevacation} = require('../controllers/vacations');
const router = express.Router();

router.route('/:id/approve').put(aprovevacation);
router.route('/:id/employee').get(tableemployee);
router.route('/').post(create).get(table);
router.route('/:id').get(get).put(update).delete(deletevacation);

module.exports = router;