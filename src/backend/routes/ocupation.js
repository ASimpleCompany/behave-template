const express = require('express');
const {table,get,create,deleteocupation, update} = require('../controllers/ocupation');

const router = express.Router();

router.route('/').get(table);
router.route('/').post(create);

router.route('/:id').get(get).put(update).delete(deleteocupation);

module.exports = router;
