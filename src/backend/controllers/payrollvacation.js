const db = require('../config/db');
const { getUserId, validateAdminiostrative } = require('../helpers/utils')
const { insertlog } = require('../helpers/logactions');
const { check, validationResult } = require('express-validator');
const { createVacations } = require('./payrollFunctions')
const util = require('util');
const query = util.promisify(db.query).bind(db);


exports.tablepayrollvacations = (req, res, next) => {
  db.query('select tce.id_estado,tce.descripcion as estado, tv.id_vacaciones, concat(te.nombre,\' \',te.apellido) as nombre, td.descripcion as departamento,tn.ano, \
  tv.cantidaddias,tv.id_nomina, pagado,  DATE_FORMAT(tv.fecha_inicio, \'%d-%m-%Y\') as fecha_inicio,  DATE_FORMAT(tv.fecha_retorno, \'%d-%m-%Y\') as fecha_retorno,\
  IF(tn.monto_nomina>0,tn.monto_nomina,get_planilladata(tv.id_nomina,\'CRNOMINA\')) as monto_nomina, tn.fecha_creacion, if(tn.total_pagar>0,tn.total_pagar,get_planilladata(tv.id_nomina,\'TOTALNOMINA\')) as total_pagar,\
  ifnull(tcen.id_estado,0) as id_estado_nomina, ifnull(tcen.descripcion,\'NO CREADO\') as estado_nomina  from tbl_vacaciones tv  \
  inner join tbl_catalogo_estado tce on tce.id_estado =tv.id_estado LEFT join tbl_contratos tc on tv.id_contrato =tc.id_contrato \
  LEFT join tbl_empleados te on tc.id_empleado =te.id_empleado LEFT join tbl_departamento td on tc.id_departamento =td.id_departamento\
  LEFT join tbl_nomina tn on tn.id_nomina = tv.id_nomina LEFT join tbl_catalogo_estado tcen on tcen.id_estado = tn.id_estado\
  where tv.id_estado in (6,8,10)  ORDER BY tv.id_vacaciones desc',
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conección a datos ' + error });
      }
      return res.status(200).json(results);
    });
};


exports.vacaciones = [
  [
    check('id_vacaciones').notEmpty().isInt({ min: 1 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(422).json({ errors: errors.array() }); }
    let sqlvac='select tv.id_vacaciones,tv.cantidaddias,tc.id_empleado,tc.id_contrato,year(fecha_inicio) as ano, tc.id_departamento,  \
    get_employeedata(tc.id_empleado,\'SALARY\') as mensual, get_employeedata(tc.id_empleado,\'SALARYQUIN\') as salario_quin,get_employeedata(tc.id_empleado,\'SALARYHORA\') as hora,\
    get_vacationdata(tv.id_empleado,\'MONTOADELANTADO\') as vacadelantado\
    from tbl_vacaciones tv inner join tbl_catalogo_estado tce on tce.id_estado = tv.id_estado \
    LEFT join tbl_contratos tc on tv.id_contrato =tc.id_contrato where tv.id_estado in (6,8) and id_vacaciones=?';
    let empleados = await query(sqlvac, [req.body.id_vacaciones]);

    let useid = getUserId(req);
    let sql = 'INSERT INTO tbl_nomina (id_estado, ano,id_codigoplanilla, carga_marcacion,creado_por) VALUES(7,?,53,?,?)';
    let nomina = [empleados[0].ano, false, useid];
    let rs = [];
    try {
      rs = await query(sql, nomina);
      await query('update tbl_vacaciones set id_nomina = ? where id_vacaciones= ?', [rs.insertId, parseInt(req.body.id_vacaciones)]);
    } catch (e) {
      console.log(e);
      return res.status(401).json({ message: 'error en conexión a datos ', error: e });
    }

    let id_nomina = rs.insertId;
    try {
      let descuentofijo = await query('select * from tbl_descuento_fijos where id_tipo_descuento in (2,4,11) and id_estado = 1');
      for (const empleado of empleados) {
        createVacations(empleado,descuentofijo,id_nomina,0);
      }
    } catch (e) {
      console.log(e);
      return res.status(401).json({ message: 'error en conexión a datos ', error: e });
    }
    insertlog('Planilla Vacaciones', 'Agrega', id_nomina, getUserId(req));
    return res.status(200).json(rs);
  }
];





