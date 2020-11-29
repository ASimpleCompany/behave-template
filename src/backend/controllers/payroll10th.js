const db = require('../config/db');
const { getUserId, validateAdminiostrative } = require('../helpers/utils')
const { insertlog } = require('../helpers/logactions');
const { check, validationResult } = require('express-validator');
const {creadecimo}=require('./payrollFunctions')
const util = require('util');
const query = util.promisify(db.query).bind(db);

exports.getdataemployee = [
  [
    check('id_nomina').notEmpty().bail().isInt({ min: 1 }),
    check('id_empleado').notEmpty().bail().isInt({ min: 1 }),
  ],
  async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) { 
      return res.status(422).json({ errors: errors.array() });
    }
    let sqlrs='';
    let datasql=[];
    let nomina = await query('select cc.tipo,cc.id,cc.cuatrimestre, tn.ano from tbl_nomina tn\
    inner join ctl_codigoplanilla cc on cc.id_codigoplanilla = tn.id_codigoplanilla where id_nomina=?', [req.body.id_nomina]);
    
    if(nomina[0].id===9){
      datasql=[nomina[0].ano,nomina[0].cuatrimestre,nomina[0].ano-1,parseInt(req.body.id_empleado),nomina[0].cuatrimestre];
      sqlrs='SELECT Upper(MONTHNAME(STR_TO_DATE(cc.mes, \'%m\'))) as mes, cc.cuatrimestre,ifnull(sal.mensual,0) as mensual,\
        sal.salario_quin,cc.cuatrimestre from ctl_codigoplanilla cc left join (\
        SELECT sum(monto) as mensual, dp.id_empleado,get_employeedata(dp.id_empleado,\'SALARYQUIN\') as salario_quin, cc.mes\
        FROM tbl_detalle_planilla dp inner join ctl_codigoplanilla cc on cc.id_codigoplanilla = dp.id_codigoplanilla\
        inner join ctl_tipo_descuentopago td on td.id_tipo_descuento = dp.id_tipo_descuento \
        inner join tbl_nomina tn on tn.id_nomina = dp.id_nomina inner join tbl_planillas tp on dp.id_planilla = tp.id_planilla\
        inner join tbl_contratos tc on tc.id_contrato = tp.id_contrato where concat(id,tn.ano) in (\
              select concat(id,?) from ctl_codigoplanilla where cuatrimestre=? and tipo = 1 union all select concat(26,?)\
              ) and td.crdr=\'CR\' and tc.id_estado=6 and dp.id_empleado = ? group by dp.id_empleado,cc.mes,salario_quin) sal\
              on cc.mes = sal.mes where cc.cuatrimestre= ? group by cc.mes,cc.cuatrimestre, sal.id_empleado  order by cc.cuatrimestre,cc.mes';
    }else{
      datasql=[nomina[0].ano,nomina[0].cuatrimestre,parseInt(req.body.id_empleado),nomina[0].cuatrimestre];
      sqlrs='SELECT Upper(MONTHNAME(STR_TO_DATE(cc.mes, \'%m\'))) as mes, cc.cuatrimestre, ifnull(sal.mensual,0) as mensual,\
        sal.salario_quin, cc.cuatrimestre from ctl_codigoplanilla cc left join (\
        SELECT ifnull(sum(monto),0) as mensual, dp.id_empleado,get_employeedata(dp.id_empleado,\'SALARYQUIN\') as salario_quin, cc.mes\
        FROM tbl_detalle_planilla dp inner join ctl_codigoplanilla cc on cc.id_codigoplanilla = dp.id_codigoplanilla\
        inner join ctl_tipo_descuentopago td on td.id_tipo_descuento = dp.id_tipo_descuento \
        inner join tbl_nomina tn on tn.id_nomina = dp.id_nomina inner join tbl_planillas tp on dp.id_planilla = tp.id_planilla\
        inner join tbl_contratos tc on tc.id_contrato = tp.id_contrato where concat(id,tn.ano) in (\
              select concat(id,?) from ctl_codigoplanilla where cuatrimestre=? and tipo = 1\
              ) and td.crdr=\'CR\' and tc.id_estado=6 and dp.id_empleado = ? group by dp.id_empleado,cc.mes,salario_quin) sal\
              on cc.mes = sal.mes where cc.cuatrimestre= ? group by cc.mes,cc.cuatrimestre, sal.id_empleado  order by cc.cuatrimestre,cc.mes';
    }

    db.query(sqlrs,datasql, function (error, results, fields) {
        if (error) {
          return res.status(401).json({ message: 'error en conexión a datos ' + error });
        }
        return res.status(200).json(results);
      });
  }
]


exports.tablaplanilla = (req, res, next) => {
  let sql = 'SELECT concat(te.nombre,\' \',te.apellido) as nombre,id_planilla, '+
    'get_planilladata(id_planilla,\'SOCIAL\') as deduccion_seg_social,' +
    'get_planilladata(id_planilla,\'RENTA\') as deduccion_isr, ' +
    'get_planilladata(id_planilla,\'DEDUCCIONES\') as total_descuentos, ' +
    'get_planilladata(id_planilla,\'CR\') as salario_quincenal_neto, ' +
    'get_planilladata(id_planilla,\'TOTALQUINCENA\') as neto_a_pagar, total_ingresos,' +
    'salario_mensual_pactado, observaciones, get_employeedata(tp.id_contrato,\'DEPARCONTRACT\') as departamento FROM tbl_planillas tp ' +
    'inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina inner join tbl_empleados te on te.id_empleado = tp.id_empleado ' +
    'where tn.id_estado = 7 and tp.id_nomina=? union all SELECT concat(te.nombre,\' \',te.apellido) as nombre,id_planilla, deduccion_seg_social, deduccion_isr, ' +
    'total_descuentos,salario_quincenal_neto, neto_a_pagar,total_ingresos, salario_mensual_pactado, ' +
    'observaciones,get_employeedata(tp.id_contrato,\'DEPARCONTRACT\') as departamento FROM tbl_planillas tp inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina ' +
    'inner join tbl_empleados te on te.id_empleado = tp.id_empleado where tn.id_estado <> 7 and tp.id_nomina=? order by departamento,nombre';

    db.query(sql,
    [parseInt(req.params.id), parseInt(req.params.id)], function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
}



exports.createdecimo = [
  [
    check('id_codigoplanilla').notEmpty().bail().isInt({ min: 1 }),
    check('ano').notEmpty().isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) { 
        return res.status(422).json({ errors: errors.array() });
      }
      let useid = getUserId(req);
      
      sql = 'INSERT INTO tbl_nomina (id_estado, ano,id_codigoplanilla, carga_marcacion,creado_por) VALUES(7,?,?,?,?)';
      nomina = [req.body.ano, req.body.id_codigoplanilla, false, useid];
    
      let rs = [];
      rs = await query(sql, nomina);
      let id_nomina = rs.insertId;

      let codplanilla = await query('select tipo,id,cuatrimestre, CONCAT(mes,"-",diain) as ini, CONCAT(mesfin,"-",diafin) as fin from ctl_codigoplanilla where id_codigoplanilla=?', [req.body.id_codigoplanilla]);
      //busca las fechas para sumar los pagos de vacaciones
      let ini= req.body.ano +"-"+codplanilla[0].ini;
      let fin= req.body.ano +"-"+codplanilla[0].fin;

      let emdata=[ini,fin,req.body.ano,codplanilla[0].cuatrimestre];
      let primerDecimo="";

      if(codplanilla[0].id===9){
        ini= (req.body.ano-1) +"-"+codplanilla[0].ini;
        fin= req.body.ano+"-"+codplanilla[0].fin;
        emdata=[ini,fin,req.body.ano,codplanilla[0].cuatrimestre,parseInt(req.body.ano)-1,codplanilla[0].cuatrimestre];
        primerDecimo='union all select concat(26,?)';
      }

      emp='SELECT sum(monto)+get_montoVacaciones(?,?,tc.id_contrato) as mensual, dp.id_empleado,get_employeedata(dp.id_empleado,\'SALARYQUIN\') as salario_quin, get_employeedata(dp.id_empleado,\'SALARY\') as salario, get_employeedata(dp.id_empleado,\'SALARYHORA\') as hora,\
          cc.tipo,tc.id_contrato  FROM tbl_detalle_planilla dp inner join ctl_codigoplanilla cc on cc.id_codigoplanilla = dp.id_codigoplanilla\
          inner join ctl_tipo_descuentopago td on td.id_tipo_descuento = dp.id_tipo_descuento inner join tbl_nomina tn on tn.id_nomina = dp.id_nomina inner join tbl_planillas tp on dp.id_planilla = tp.id_planilla\
          inner join tbl_contratos tc on tc.id_contrato = tp.id_contrato where concat(id,tn.ano) in (select concat(id,?) from ctl_codigoplanilla where cuatrimestre=? and tipo = 1\
          '+primerDecimo+') and td.crdr=\'CR\' and tc.id_estado=6 group by dp.id_empleado,cc.tipo,salario_quin,salario';
      
      let empleados = await query(emp,emdata);
      let descuentofijo = await query('select * from tbl_descuento_fijos where id_tipo_descuento in (15,11) and id_estado = 1');
      let decimo = await query('select * from tbl_descuento_fijos where id_tipo_descuento in (13)');
      
      for (const empleado of empleados) {
        creadecimo(decimo,empleado,descuentofijo,req.body.id_codigoplanilla,id_nomina);
      }
    } catch (e) {
      console.log(e);
      return res.status(401).json({ message: 'error en conexión a datos ', error: e });
    }
    insertlog('Planilla','Crea Decimo', 0, getUserId(req));
    return res.status(200).json({mensaje:'Decimo Creado'});
  }
];



exports.creaindividual = [
  [
    check('id_nomina').notEmpty().bail().isInt({ min: 1 }),
    check('id_empleado').notEmpty().isInt({ min: 1 }),
    check('monto').notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) { return res.status(422).json({ errors: errors.array() });}

      let id_nomina = req.body.id_nomina;
      let codplanilla = await query('select id_codigoplanilla from tbl_nomina where id_nomina=?', [req.body.id_nomina]);
      let idcodigoplanilla=codplanilla[0].id_codigoplanilla;
      let emdata=[];
  
      emdata=[req.body.monto, req.body.id_empleado];
      emp='select ? as mensual, get_employeedata(te.id_empleado,\'SALARYQUIN\') as salario_quin,\
      get_employeedata(te.id_empleado,\'SALARY\') as salario, get_employeedata(te.id_empleado,\'SALARYHORA\') as hora,\
      get_employeedata(te.id_empleado,\'SALARYHORA\') as hora,tc.id_contrato,te.id_empleado\
      from tbl_empleados te inner join tbl_contratos tc on tc.id_empleado = te.id_empleado\
      where tc.id_estado = 6 and tc.id_empleado = ? limit 1';
      
      let empleados = await query(emp,emdata);
      let descuentofijo = await query('select * from tbl_descuento_fijos where id_tipo_descuento in (15,11) and id_estado = 1');
      let decimo = await query('select * from tbl_descuento_fijos where id_tipo_descuento in (13)');
      
      for (const empleado of empleados) {
        creadecimo(decimo,empleado,descuentofijo,idcodigoplanilla,id_nomina);
      }
    } catch (e) {
      return res.status(401).json({ message: 'error en conexión a datos ', error: e });
    }
    insertlog('Planilla','Crea Decimo', req.body.id_nomina, getUserId(req));
    return res.status(200).json({mensaje:'Decimo Creado'});
  }
];




