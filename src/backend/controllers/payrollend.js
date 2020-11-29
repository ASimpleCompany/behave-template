const db = require('../config/db');
const { getUserId, formValidations } = require('../helpers/utils')
const { insertlog } = require('../helpers/logactions');
const { check, validationResult } = require('express-validator');
const {creadecimo,createVacations}=require('./payrollFunctions')
const mysql = require('mysql');
const util = require('util');
const query = util.promisify(db.query).bind(db);


exports.tablends = (req, res, next) => {
  let sql ='SELECT tc.id_contrato, upper(concat(te.apellido ,\' \',te.apellido )) as nombre, td.descripcion as departamento, \
  DATE_FORMAT(tc.fecha_inicio_labores,\'%d-%m-%Y\') as fecha_inicio_labores, DATE_FORMAT(tfc.fecha_culmina,\'%d-%m-%Y\') as fecha_culmina,\
  ctf.descripcion as finaliza, ct.descripcion as tipocontrato, tc.id_estado as idestadocontrato, tce.descripcion as estadocontrato,\
  ifnull(tn.id_estado,0) as idestadonomina, ifnull(tce2.descripcion,\'NO CREADO\') as estadonomina\
  from tbl_contratos tc inner join ctl_tipocontrato ct on ct.id_tipocontrato = tc.id_tipocontrato\
  inner join tbl_empleados te on te.id_empleado = tc.id_empleado\
  inner join tbl_departamento td on tc.id_departamento = td.id_departamento\
  inner join tbl_finaliza_contrato tfc on tc.id_contrato = tfc.id_contrato\
  inner join ctl_tipo_finaliza ctf on ctf.id_tipo_finaliza = tfc.id_tipo_finaliza\
  inner join tbl_catalogo_estado tce on tce.id_estado = tc.id_estado\
  left join tbl_nomina tn on tfc.id_nomina = tn.id_nomina left join tbl_catalogo_estado tce2 on tn.id_estado = tce2.id_estado\
  where YEAR(tfc.fecha_culmina)= YEAR(now()) order by tfc.id_finaliza desc';
  db.query(sql, [req.params.id], function (error, results, fields) {
    if (error) {
      return res.status(401).json({ message: 'error en conexión a datos ' + error });
    }
    return res.status(200).json(results);
  });
}


exports.tablendsreport = (req, res, next) => {
  let sql ='SELECT tc.id_contrato, upper(concat(te.apellido ,\' \',te.apellido )) as nombre, td.descripcion as departamento, \
  DATE_FORMAT(tc.fecha_inicio_labores,\'%d-%m-%Y\') as fecha_inicio_labores, DATE_FORMAT(tfc.fecha_culmina,\'%d-%m-%Y\') as fecha_culmina,\
  ctf.descripcion as finaliza, ct.descripcion as tipocontrato, tc.id_estado as idestadocontrato, tce.descripcion as estadocontrato,\
  ifnull(tn.id_estado,0) as idestadonomina, ifnull(tce2.descripcion,\'NO CREADO\') as estadonomina\
  from tbl_contratos tc inner join ctl_tipocontrato ct on ct.id_tipocontrato = tc.id_tipocontrato\
  inner join tbl_empleados te on te.id_empleado = tc.id_empleado\
  inner join tbl_departamento td on tc.id_departamento = td.id_departamento\
  inner join tbl_finaliza_contrato tfc on tc.id_contrato = tfc.id_contrato\
  inner join ctl_tipo_finaliza ctf on ctf.id_tipo_finaliza = tfc.id_tipo_finaliza\
  inner join tbl_catalogo_estado tce on tce.id_estado = tc.id_estado\
  left join tbl_nomina tn on tfc.id_nomina = tn.id_nomina left join tbl_catalogo_estado tce2 on tn.id_estado = tce2.id_estado\
  where tn.id_estado in (6,10) order by tfc.id_finaliza desc';
  db.query(sql, [req.params.id], function (error, results, fields) {
    if (error) {
      return res.status(401).json({ message: 'error en conexión a datos ' + error });
    }
    return res.status(200).json(results);
  });
}


exports.detailperyeardend = async (req, res, next) => {
  let sqlanos='SELECT tc.id_contrato,tn.ano,sum(tp.salario_quincenal_neto-tp.ausentismo_tardanza) as totaldevengado from tbl_planillas tp \
  inner join tbl_contratos tc on tp.id_contrato = tc.id_contrato \
  inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina \
  inner join ctl_codigoplanilla cc ON tp.id_codigoplanilla = cc.id_codigoplanilla \
  where tn.id_estado = 6 and tc.id_contrato=? GROUP by tc.id_contrato, tn.ano\
  order by  tn.ano desc';
  try{
    let anos = await query(sqlanos, [req.params.id]);
    return res.status(200).json(anos);
  }catch(e){
    return res.status(401).json({ message: 'error en conexión a datos ' + error });
  }
}


exports.detailend = async (req, res, next) => {
  let sql='SELECT tc.id_contrato, upper(concat(te.apellido ,\' \',te.apellido )) as nombre, td.descripcion as departamento,\
  DATE_FORMAT(tc.fecha_inicio_labores,\'%d-%m-%Y\') as fecha_inicio_labores, DATE_FORMAT(tfc.fecha_culmina,\'%d-%m-%Y\') as fecha_culmina,\
  ctf.descripcion as finaliza,tfc.motivo, ct.descripcion as tipocontrato, tc.id_estado as idestadocontrato, tce.descripcion as estadocontrato,\
  ifnull(tn.id_estado,0) as idestadonomina, ifnull(tce2.descripcion,\'NO CREADO\') as estadonomina  from tbl_contratos tc \
  inner join ctl_tipocontrato ct on ct.id_tipocontrato = tc.id_tipocontrato  inner join tbl_empleados te on te.id_empleado = tc.id_empleado  \
  inner join tbl_departamento td on tc.id_departamento = td.id_departamento  inner join tbl_finaliza_contrato tfc on tc.id_contrato = tfc.id_contrato  \
  inner join ctl_tipo_finaliza ctf on ctf.id_tipo_finaliza = tfc.id_tipo_finaliza  inner join tbl_catalogo_estado \
  tce on tce.id_estado = tc.id_estado  left join tbl_nomina tn on tfc.id_nomina = tn.id_nomina left join tbl_catalogo_estado tce2 on tn.id_estado = tce2.id_estado  \
  where tc.id_contrato = ? order by tfc.id_finaliza desc';
  try{
    let detail = await query(sql, [req.params.id]);
    return res.status(200).json(detail);
  }catch(e){
    return res.status(401).json({ message: 'error en conexión a datos ' + error });
  }
}


exports.createend = [
  [
    check('id_contrato').notEmpty().isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    formValidations(req, res);
    try {
      /**
       * Inserta en nomina
       */
      let empleadosvac = await query('select  get_employeedata(tc.id_empleado,\'CANTIDADVAC\') as cantidaddias,tc.id_empleado,tc.id_contrato,year(tfc.fecha_culmina) as ano,tfc.fecha_culmina, tc.id_departamento,\
      get_employeedata(tc.id_empleado,\'SALARY\') as mensual, get_employeedata(tc.id_empleado,\'SALARYQUIN\') as salario_quin,get_employeedata(tc.id_empleado,\'SALARYHORA\') as hora,\
      get_vacationdata(tc.id_empleado,\'MONTOADELANTADO\') as vacadelantado, tfc.id_finaliza from tbl_contratos tc inner join tbl_catalogo_estado tce on tce.id_estado = tc.id_estado \
      inner join tbl_finaliza_contrato tfc on tc.id_contrato = tfc.id_contrato where tc.id_estado in (6,10) and tc.id_contrato=?', [req.body.id_contrato]);

      let useid = getUserId(req);
      let sql = 'INSERT INTO tbl_nomina (id_estado, ano,id_codigoplanilla, carga_marcacion,creado_por) VALUES(7,?,?,?,?)';
      nomina = [empleadosvac[0].ano, 55, false, useid];
      let rs = [];
      rs = await query(sql, nomina);
      let id_nomina = rs.insertId;
      let id_planilla = 0;
      
      /**
       * Inserta en vacacione 
       */
      
      try {
        let descuentofijo = await query('select * from tbl_descuento_fijos where id_tipo_descuento in (2,4,11) and id_estado = 1');
        for (const empleado of empleadosvac) {
          let rs=createVacations(empleado,descuentofijo,id_nomina,id_planilla);
          id_planilla=rs[0];
        }
      } catch (e) {
        return res.status(401).json({ message: 'error en conexión a datos ', error: e });
      }    

      /**
       * Inserta en Decimo toma la fecha de 
       */
      let ano = parseInt(empleadosvac[0].ano);
      let fechacul=empleadosvac[0].fecha_culmina;

      sql = mysql.format('select now(),tipo,id,cuatrimestre,CONCAT(IF(id=9,?-1,?),"-",mes,"-",diain) as ini, CONCAT(?,"-",mesfin,"-",diafin) as fin from ctl_codigoplanilla\
      where tipo = 2 and ? >= date(CONCAT(IF(id=9,?-1,?),"-",mes,"-",diain)) and ? <= date(CONCAT(?,"-",mesfin,"-",diafin)) union all\
      select now(),tipo,id,cuatrimestre,CONCAT(?,"-",mes,"-",diain) as ini, CONCAT(?+1,"-",mesfin,"-",diafin) as fin from ctl_codigoplanilla\
      where id=9 and ? >= date(CONCAT(?,"-",mes,"-",diain)) and ? <= date(CONCAT(?+1,"-",mesfin,"-",diafin))', 
      [ano,ano,ano,fechacul,ano,ano,fechacul,ano,ano,ano,fechacul,ano,fechacul,ano]);

      let codplanilla = await query(sql);
      let ini= codplanilla[0].ini;
      let fin= codplanilla[0].fin;
      let emdata=[ini,fin,empleadosvac[0].ano,codplanilla[0].cuatrimestre, req.body.id_contrato];
      let primerDecimo="";
      
      if(codplanilla[0].id===9){
        //ini= (empleadosvac[0].ano-1) +"-"+codplanilla[0].ini;
        //fin= empleadosvac[0].ano+"-"+codplanilla[0].fin;
        emdata=[ini,fin,empleadosvac[0].ano,codplanilla[0].cuatrimestre,parseInt(empleadosvac[0].ano)-1,codplanilla[0].cuatrimestre,req.body.id_contrato];
        primerDecimo='union all select concat(26,?))';
      } 
      
      let emp='SELECT sum(monto)+get_montoVacaciones(?,?,tc.id_contrato) as mensual, dp.id_empleado,get_employeedata(dp.id_empleado,\'SALARYQUIN\') as salario_quin, get_employeedata(dp.id_empleado,\'SALARY\') as salario, get_employeedata(dp.id_empleado,\'SALARYHORA\') as hora,\
          cc.tipo,tc.id_contrato  FROM tbl_detalle_planilla dp inner join ctl_codigoplanilla cc on cc.id_codigoplanilla = dp.id_codigoplanilla\
          inner join ctl_tipo_descuentopago td on td.id_tipo_descuento = dp.id_tipo_descuento inner join tbl_nomina tn on tn.id_nomina = dp.id_nomina inner join tbl_planillas tp on dp.id_planilla = tp.id_planilla\
          inner join tbl_contratos tc on tc.id_contrato = tp.id_contrato where concat(id,tn.ano) in (select concat(id,?) from ctl_codigoplanilla where cuatrimestre=? and tipo = 1)\
          '+primerDecimo+' and td.crdr=\'CR\' and tc.id_estado=6 and tc.id_contrato = ? group by dp.id_empleado,cc.tipo,salario_quin,salario';
      
      let empleadosdeci = await query(emp,emdata);
      let descuentofijo = await query('select * from tbl_descuento_fijos where id_tipo_descuento in (15,11) and id_estado = 1');
      let decimo        = await query('select * from tbl_descuento_fijos where id_tipo_descuento in (13)');
      
      
      for (const empleado of empleadosdeci) {
        creadecimo(decimo,empleado,descuentofijo,req.body.id_codigoplanilla,id_nomina,id_planilla);
      }
      await query("update tbl_finaliza_contrato set id_nomina=? where id_finaliza=? ", [id_nomina,empleadosvac[0].id_finaliza]);
    } catch (e) {
      return res.status(401).json({ message: 'error en conexión a datos ', error: e });
    }
    insertlog('Planilla','Crea Decimo', 0, getUserId(req));
    return res.status(200).json({mensaje:'Decimo Creado'});
  }
];

