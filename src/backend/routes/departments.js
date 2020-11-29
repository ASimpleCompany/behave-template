const express = require('express');
const {table,getocupations,get,create,deletedep, update} = require('../controllers/departments');

const router = express.Router();

router.route('/').get(table);
router.route('/').post(create);


router.route('/:id/ocupations').get(getocupations);
router.route('/:id').get(get).put(update).delete(deletedep);

module.exports = router;
