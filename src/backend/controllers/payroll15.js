const db = require('../config/db');
const { getUserId, validateAdminiostrative } = require('../helpers/utils')
const { insertlog } = require('../helpers/logactions');
const { check, validationResult } = require('express-validator');
const {inpuestosfijos}=require('./payrollFunctions')
const util = require('util');
const query = util.promisify(db.query).bind(db);


exports.create = [
  [
    check('id_codigoplanilla').notEmpty().bail().isInt({ min: 1 }),
    check('ano').notEmpty().isInt({ min: 1 }),
    check('carga_marcacion').notEmpty(),
    check('marcacion_inicio').custom((value, meta) => { return !(meta.req.body.carga_marcacion === 'true' && value === '') }),
    check('marcacion_fin').custom((value, meta) => { return !(meta.req.body.carga_marcacion === 'true' && value === '') }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(422).json({ errors: errors.array() }); }

    let useid = getUserId(req);
    let sql = 'INSERT INTO tbl_nomina (id_estado, ano,id_codigoplanilla, carga_marcacion, marcacion_inicio, marcacion_fin,creado_por) VALUES(7,?,?,?,?,?,?)';
    let nomina = [req.body.ano, req.body.id_codigoplanilla, true, req.body.marcacion_inicio, req.body.marcacion_fin, useid];

    if (req.body.carga_marcacion === 'false') {
      sql = 'INSERT INTO tbl_nomina (id_estado, ano,id_codigoplanilla, carga_marcacion,creado_por) VALUES(7,?,?,?,?)';
      nomina = [req.body.ano, req.body.id_codigoplanilla, false, useid];
    }

    let rs = {};
    try {
      rs = await query(sql, nomina);
    } catch (e) {
      return res.status(401).json({ message: 'error en conexión a datos ', error: e });
    }
    
    let id_nomina = rs.insertId;

    try {

      let sqlempleados='select get_employeedata(te.id_empleado,\'SALARY\') as mensual,get_employeedata(te.id_empleado,\'SALARYHORA\') as hora,\
      get_employeedata(te.id_empleado,\'SALARYQUIN\') as salario_quin, te.id_empleado, tc.id_contrato,te.id_empleado  from tbl_empleados te \
      inner join tbl_contratos tc on te.id_empleado = tc.id_empleado where tc.id_estado = 6 and te.id_estado = 1';
      
      let empleados = await query(sqlempleados);
      let descuentofijo = await query('select * from tbl_descuento_fijos where id_tipo_descuento in (2,4,11) and id_estado = 1');

      for (const empleado of empleados) {
        let sqldetalle = 'INSERT INTO tbl_detalle_planilla(id_nomina,id_tipo_descuento,id_empleado,id_codigoplanilla,id_planilla,monto) VALUES (?,?,?,?,?,?)';
        
        /*
        * Crea Planill para colaborador
        */
        let planilladata = [empleado.mensual, empleado.salario_quin, empleado.id_empleado,
          id_nomina, req.body.id_codigoplanilla, empleado.id_contrato,empleado.hora];
        let planilla = await query('INSERT INTO tbl_planillas(salario_mensual_pactado,salario_quincenal_neto, id_empleado, \
          id_nomina, id_codigoplanilla,id_contrato,salario_hora) VALUES (?,?,?,?,?,?,?)', planilladata);
        let id_planilla = planilla.insertId;
        
        /*
        * Insertar creditos para colaborador
        */
        let datosdetalle = [id_nomina, 12, empleado.id_empleado, req.body.id_codigoplanilla, id_planilla, empleado.salario_quin];
        await query(sqldetalle, datosdetalle);
        
        /*
        * Insertar todos los descuentos fijos
        */
        inpuestosfijos(req.body.id_codigoplanilla,descuentofijo,empleado,id_planilla,id_nomina);
        
        /*
        * Insertar todos los descuentos directos
        */
        let directos = await query('SELECT id_descuento_directo, montototal, monto_letra_quincenal, montoactual, montoactual-monto_letra_quincenal as last FROM tbl_descuento_directo WHERE id_empleado = ? and id_estado=6', [empleado.id_empleado]);
        sqldetalle = 'INSERT INTO tbl_detalle_planilla(id_descuento_directo,id_nomina,id_tipo_descuento,id_empleado,id_codigoplanilla,id_planilla,monto) VALUES (?,?,?,?,?,?,?)';

        for (const directo of directos) {
          let datosdetalle = [];
          if (directo.last <= 0) {
            datosdetalle = [directo.id_descuento_directo, id_nomina, 1, empleado.id_empleado, req.body.id_codigoplanilla, id_planilla, directo.montoactual];
          } else {
            datosdetalle = [directo.id_descuento_directo, id_nomina, 1, empleado.id_empleado, req.body.id_codigoplanilla, id_planilla, directo.monto_letra_quincenal];
          }
          await query(sqldetalle, datosdetalle);
        }
        
      }
    } catch (e) {
      return res.status(401).json({ message: 'error en conexión a datos ', error: e });
    }
    insertlog('Planilla','Crea Planilla', 0, getUserId(req));
    return res.status(200).json(rs);
  }
];


/*
* crea planilla individual por colaborador
*/
exports.createindividual = [
  [
    check('id_nomina').notEmpty().bail().isInt({ min: 1 }),
    check('id_empleado').notEmpty().bail().isInt({ min: 1 })
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(422).json({ errors: errors.array() }); }
    let rsnomina = await query('select tn.id_codigoplanilla, cc.id from tbl_nomina tn \
    inner join ctl_codigoplanilla cc on cc.id_codigoplanilla = tn.id_codigoplanilla where id_nomina=?', [req.body.id_nomina]);
    
    let id_nomina = req.body.id_nomina;
    let id_codigoplanilla = rsnomina[0].id_codigoplanilla

    try {
      let empleados = await query('select get_employeedata(te.id_empleado,\'SALARY\') as mensual,get_employeedata(te.id_empleado,\'SALARYHORA\') as hora,\
      get_employeedata(te.id_empleado,\'SALARYQUIN\') as salario_quin, te.id_empleado,tc.id_contrato,te.id_empleado from tbl_empleados te \
      inner join tbl_contratos tc on te.id_empleado = tc.id_empleado where tc.id_estado = 6 and te.id_estado = 1 and te.id_empleado=?', [req.body.id_empleado]);

      let sqldescuento='select * from tbl_descuento_fijos where id_tipo_descuento in (2,4,11) and id_estado = 1'

      if(rsnomina[0].id===9||rsnomina[0].id===19||rsnomina[0].id===27){
        sqldescuento='select * from tbl_descuento_fijos where id_tipo_descuento in (4,11) and id_estado = 1';
      }

      let descuentofijo = await query(sqldescuento);
      
      for (const empleado of empleados) {
        let sqldetalle = 'INSERT INTO tbl_detalle_planilla(id_nomina,id_tipo_descuento,id_empleado,id_codigoplanilla,id_planilla,monto) VALUES (?,?,?,?,?,?)';
        /*
        * Crea Planill para colaborador
        */
        let planilladata = [empleado.mensual, empleado.salario_quin, empleado.id_empleado, 
          id_nomina, id_codigoplanilla, empleado.id_contrato,empleado.hora];
        let planilla = await query('INSERT INTO tbl_planillas(salario_mensual_pactado,salario_quincenal_neto, id_empleado,\
           id_nomina, id_codigoplanilla,id_contrato,salario_hora) VALUES (?,?,?,?,?,?,?)', planilladata);
        let id_planilla = planilla.insertId;

        /*
        * Insertar creditos para colaborador
        */
        let datosdetalle = [id_nomina, 12, empleado.id_empleado, id_codigoplanilla, id_planilla, empleado.salario_quin];
        await query(sqldetalle, datosdetalle);

        /*
        * Insertar todos los descuentos fijos
        */
        inpuestosfijos(id_codigoplanilla,descuentofijo,empleado,id_planilla,id_nomina);
        
        /*
        * Insertar todos los descuentos directos
        */
        let directos = await query('SELECT id_descuento_directo, montototal, monto_letra_quincenal, montoactual, montoactual-monto_letra_quincenal as last FROM tbl_descuento_directo WHERE id_empleado = ? and id_estado=6', [empleado.id_empleado]);
        sqldetalle = 'INSERT INTO tbl_detalle_planilla(id_descuento_directo,id_nomina,id_tipo_descuento,id_empleado,id_codigoplanilla,id_planilla,monto) VALUES (?,?,?,?,?,?,?)';

        for (const directo of directos) {
          let datosdetalle = [];
          if (directo.last <= 0) {
            datosdetalle = [directo.id_descuento_directo, id_nomina, 1, empleado.id_empleado, id_codigoplanilla, id_planilla, directo.montoactual];
          } else {
            datosdetalle = [directo.id_descuento_directo, id_nomina, 1, empleado.id_empleado, id_codigoplanilla, id_planilla, directo.monto_letra_quincenal];
          }
          await query(sqldetalle, datosdetalle);
        }
      }
    } catch (e) {
      return res.status(401).json({ message: 'error en conexión a datos ', error: e });
    }
    insertlog('Planilla','Agrega Colaborador',id_nomina, getUserId(req));
    return res.status(200).json({ mensaje: 'Empleado agregado' });
  }
];
