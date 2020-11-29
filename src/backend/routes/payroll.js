//MODULES
const express = require('express');
const {payrollstats,getdisponible,tablenaomina,actualizaronservaciones,tablenaominaall,
        tablplanilla,getnomina,deduccionespagos,getemployee,getplanilla,eliminaplanilladetalle,
        aprovenomina,eliminaplanilla} = require('../controllers/payroll');
const {createdecimo,tablaplanilla,getdataemployee,creaindividual} = require('../controllers/payroll10th');
const {create,createindividual} = require('../controllers/payroll15');
const {vacaciones,tablepayrollvacations} = require('../controllers/payrollvacation');
const {tablends,detailperyeardend,detailend,createend} = require('../controllers/payrollend');
const router = express.Router();

router.route('/available/:id').get(getdisponible);
router.route('/stats').get(payrollstats);
router.route('/nomina/tabla/:id').get(tablenaomina);
router.route('/nomina/all').post(tablenaominaall);
router.route('/nomina/aprove/:id').post(aprovenomina);

router.route('/nomina/:id').get(getnomina).delete(eliminaplanilla);
router.route('/detail/:id').get(tablplanilla).delete(eliminaplanilladetalle);

router.route('/employee/:id').get(getplanilla);
router.route('/employeelist/:id').get(getemployee);
router.route('/comment/:id').put(actualizaronservaciones);

router.route('/detailpayroll/:id').get(deduccionespagos);
router.route('/addemployee').post(createindividual);

router.route('/').post(create);

router.route('/tenth').post(createdecimo);
router.route('/tenth/data').post(getdataemployee);
router.route('/tenth/addemployee').post(creaindividual);
router.route('/tenth/:id').get(tablaplanilla);
router.route('/vacations').get(tablepayrollvacations).post(vacaciones);

router.route('/end').get(tablends).post(createend);
router.route('/end/yeardetail/:id').get(detailperyeardend);
router.route('/end/detail/:id').get(detailend);

module.exports = router;