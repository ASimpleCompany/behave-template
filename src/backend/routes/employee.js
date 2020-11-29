const express = require('express');
const {
  createemployee,
  employeestable,
  getemployee,
  updateemployee,
  employeedelete,
  employeecontracts,
  employeestats,
  employeestableinactive,
  employeestableended,
  employeincapacidades,
  createemployeecomplete,
  employeeactiveContract,
  employeecontratlist,
  getemployeesalary
} = require('../controllers/employee');

const router = express.Router();

router.route('/').get(employeestable);
router.route('/inactive').get(employeestableinactive);
router.route('/ended').get(employeestableended);
router.route('/stats').get(employeestats);
router.route('/activecontract/:id').get(employeeactiveContract);
router.route('/constractlist/:id').get(employeecontratlist);

router.route('/:id/contracts').get(employeecontracts);
router.route('/:id/incapacity').get(employeincapacidades);
router.route('/:id/salary').get(getemployeesalary);

router.route('/:id').get(getemployee);
router.route('/').post(createemployee);
router.route('/complete').post(createemployeecomplete);
router.route('/:id').put(updateemployee);
router.route('/:id').delete(employeedelete);




module.exports = router;
