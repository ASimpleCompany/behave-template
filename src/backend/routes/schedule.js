const express = require('express');
const {table,get,create,deletehorario, update, getlist} = require('../controllers/schedule');

const router = express.Router();

router.route('/').get(table);
router.route('/').post(create);
router.route('/list').get(getlist);

router.route('/:id').get(get).put(update).delete(deletehorario);

module.exports = router;
