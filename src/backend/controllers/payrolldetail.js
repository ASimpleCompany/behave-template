const db = require('../config/db');
const pug = require('pug');
const {getUserId} = require('../helpers/utils')
const {insertlog} = require('../helpers/logactions');

const {inpuestosfijos}=require('./payrollFunctions')
const pdf = require('html-pdf');
const { check, validationResult } = require('express-validator');
const util = require('util');
const query = util.promisify(db.query).bind(db);
const fs=require('fs');



exports.discountlist=(req, res, next) => {
  db.query('SELECT id_tipo_descuento, descripcion,crdr FROM ctl_tipo_descuentopago where id_tipo_descuento in (1,6,14,16) order by crdr,descripcion asc',
    function (error, results, fields) {
      if (error){
        
        return res.status(401).json({message:'error en conección a datos '+error});
      } 
      return res.status(200).json(results);
  });
};

exports.getdetalle=(req, res, next) => {
  db.query('SELECT id_tipo_descuento, monto FROM tbl_detalle_planilla WHERE id_descuento_realizado=?',[req.params.id],
    function (error, results, fields) {
      if (error){
        res.status(401).json({message:'error en conección a datos '+error});
        return;
      } 
      return res.status(200).json(results);
  });
};

exports.create=[
  [
    check('monto').notEmpty(),
    check('id_tipo_descuento').notEmpty(),
    check('id_empleado').notEmpty(),
    check('id_codigoplanilla').notEmpty(),
    check('id_planilla').notEmpty(),
    check('id_nomina').notEmpty(),
  ], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array()});
    }

  let sql='INSERT INTO tbl_detalle_planilla(monto, id_tipo_descuento, id_empleado, id_codigoplanilla, id_planilla, id_nomina) \
  VALUES (?,?,?,?,?,?)';

  let data=[
    req.body.monto,
    req.body.id_tipo_descuento,
    req.body.id_empleado,
    req.body.id_codigoplanilla,
    req.body.id_planilla,
    req.body.id_nomina
  ]
  try{

    let rs = await query(sql,data);
    if (req.body.id_tipo_descuento!=='2' && req.body.id_tipo_descuento!=='4' && req.body.id_tipo_descuento !=='11'){
      await actualizadescuentos(req.body.id_planilla);  
    }
    insertlog('Detalle Planilla','Crea detalle', 0, getUserId(req));
    return res.status(200).json(rs);
  }catch(e){
    res.status(401).json({message:'No de Pudo crear el detalle',errno: e});
  }


}]

exports.actualizar=[
  [
    check('monto').notEmpty(),
    check('id_tipo_descuento').notEmpty(),
  ], async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array()});
    }
  let sql='update tbl_detalle_planilla set monto=?,id_tipo_descuento=? where id_descuento_realizado=?';

  let data=[
    req.body.monto,
    req.body.id_tipo_descuento,
    req.params.id
  ]

  try{
    /*let detalle = await query('select tp.id_planilla from tbl_detalle_planilla tp \
    where tp.id_descuento_realizado = ? and id_tipo_descuento not in (2,4,11)',[req.params.id]);*/
    let rs = await query(sql, data);

    if (req.body.id_tipo_descuento!=='2' && req.body.id_tipo_descuento!=='4' && req.body.id_tipo_descuento !=='11'){
      await actualizadescuentos(req.body.id_planilla);  
    }
    insertlog('Detalle Planilla','Elimina detalle', parseInt(req.params.id), getUserId(req));

    return res.status(200).json(rs);
  }catch(e){
    res.status(401).json({message:'No de Pudo actualizar el detalle',errno: e});  
  }
}]


exports.deletedeatil=[
  [
    check('id').notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array()});
    }
    let sql='DELETE FROM tbl_detalle_planilla WHERE id_descuento_realizado=?';

    try{
      let detalle = await query('select tp.id_planilla from tbl_detalle_planilla tp where tp.id_descuento_realizado = ? and id_tipo_descuento not in (2,4,11)',[req.params.id]);
      let rs = await query(sql, [req.params.id]);
      if (detalle.length>0){
        await actualizadescuentos(detalle[0].id_planilla);  
      }
      insertlog('Detalle Planilla','Elimina detalle', parseInt(req.params.id), getUserId(req));
      return res.status(200).json(rs);
    }catch(e){
      res.status(401).json({message:'No de Pudo actualizar el detalle',errno: e});  
    }
  }
];

/**
 * funcion para actualizar descuentos
 */
actualizadescuentos= async (insertId)=>{

  let detalle = await query('select tp.id_planilla,tp.id_nomina,tp.id_codigoplanilla, cc.id,tp.id_empleado from tbl_planillas tp \
  inner join ctl_codigoplanilla cc on cc.id_codigoplanilla = tp.id_codigoplanilla where tp.id_planilla = ?',[insertId]);

  let empleados =[];

  if(detalle.length>0){

    empleados = await query('select get_employeedata(id_empleado,\'SALARY\') as mensual, \
    get_planilladata(id_planilla,\'CR\') - get_planilladata(id_planilla,\'BEFORESUMDR\') as salario_quin,\
    id_empleado, id_contrato from tbl_planillas tp where tp.id_planilla = ? ', [detalle[0].id_planilla]);
    
    let sqldescuentos='select * from tbl_descuento_fijos where id_tipo_descuento in (2,4,11) and id_estado = 1';
    if(detalle[0].id===9||detalle[0].id===19||detalle[0].id===27){
      sqldescuentos='select * from tbl_descuento_fijos where id_tipo_descuento in (4,11) and id_estado = 1';
    }
    
    let descuentofijo = await query(sqldescuentos);
    

    await inpuestosfijos(detalle[0].id_codigoplanilla,descuentofijo,empleados[0],detalle[0].id_planilla,detalle[0].id_nomina);
  }
}


/* imprime recibo individual */
exports.printdetale=
  async (req, res, next) => {
    let compiledFunction = pug.compileFile('views/employeepayroll.pug');

    let filename= './files/reporte-'+req.params.id+'.pdf';
    let sql='SELECT tp.observaciones, te.cedula, te.num_colaborador,cc.descripcion as planilla,  concat(te.nombre,\' \',te.apellido) as nombre,id_planilla,get_employeedata(tp.id_empleado,\'DEPARTAMENT\') as departamento,get_employeedata(tp.id_empleado,\'OCUPATION\') as ocupacion, \
    format(salario_quincenal_neto,2) as salario_quincenal_neto, FORMAT(neto_a_pagar,2) as neto_a_pagar,FORMAT(total_descuentos,2) as total_descuentos, FORMAT(salario_mensual_pactado,2) as salario_mensual_pactado, DATE_FORMAT(tn.fecha_modificacion,\'%d de %M del %Y\') as fecha_modificacion,concat(cc.codigo,\'-\',tn.ano) as codigo, \
    DATE_FORMAT(DATE(concat(tn.ano,"-", cc.mes,"-", cc.diain)),\'%d-%M-%Y\') as fechain,DATE_FORMAT(DATE(concat(tn.ano,"-", cc.mes,"-",cc.diafin)),\'%d-%M-%Y\') as fechafin  \
    FROM tbl_planillas tp inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina \
    inner join ctl_codigoplanilla cc on tp.id_codigoplanilla = cc.id_codigoplanilla \
    inner join tbl_empleados te on te.id_empleado = tp.id_empleado where tp.id_planilla=?';

    let dr='SELECT ctp.descripcion, format(tdp.monto,2) as  monto, tdd.descripcion as descuendo_directo  FROM tbl_detalle_planilla tdp \
    inner join ctl_tipo_descuentopago ctp on tdp.id_tipo_descuento = ctp.id_tipo_descuento\
    left join tbl_descuento_directo tdd on tdp.id_descuento_directo = tdd.id_descuento_directo WHERE tdp.id_planilla=? and ctp.crdr="DR" \
    order by tdp.monto desc';

    let cr='SELECT ctp.descripcion, format(tdp.monto,2) as  monto, tdd.descripcion as descuendo_directo  FROM tbl_detalle_planilla tdp \
    inner join ctl_tipo_descuentopago ctp on tdp.id_tipo_descuento = ctp.id_tipo_descuento\
    left join tbl_descuento_directo tdd on tdp.id_descuento_directo = tdd.id_descuento_directo WHERE tdp.id_planilla=?  and ctp.crdr="CR"\
    order by tdp.monto desc';

    let rsdr = await query(dr, [req.params.id]);
    let rscr = await query(cr, [req.params.id]);
    let incapadisponible = await query(sql, [req.params.id]);

    pdf.create(compiledFunction({planilla:incapadisponible[0], cr:rscr,dr:rsdr}), {
      border:{
        "top": ".5in",            // default is 0, units: mm, cm, in, px
        "right": ".5in",
        "bottom": ".5in",
        "left": ".5in"
      }
    }).toStream( async (err, stream) => {
      if (err) return res.end(err.stack)
      res.setHeader('Content-type', 'application/pdf')
      await stream.pipe(res)
      fs.unlink(filename, function (err) {});
    });
    return;
  }


/* imprime recibo individual de vacaiones */
exports.printdetalevacation=
  async (req, res, next) => {
    let compiledFunction = pug.compileFile('views/employeevacaciones.pug');

    let filename= './files/reporte-'+req.params.id+'.pdf';
    let sql='SELECT tv.cantidaddias, tp.observaciones, te.cedula, te.num_colaborador,cc.descripcion as planilla,  concat(te.nombre,\' \',te.apellido) as nombre,id_planilla,get_employeedata(tp.id_empleado,\'DEPARTAMENT\') as departamento,get_employeedata(tp.id_empleado,\'OCUPATION\') as ocupacion, \
    format(salario_quincenal_neto,2) as salario_quincenal_neto, FORMAT(neto_a_pagar,2) as neto_a_pagar,FORMAT(total_descuentos,2) as total_descuentos, FORMAT(salario_mensual_pactado,2) as salario_mensual_pactado, DATE_FORMAT(tn.fecha_modificacion,\'%d de %M del %Y\') as fecha_modificacion,concat(cc.codigo,\'-\',tn.ano) as codigo, \
    DATE_FORMAT(tv.fecha_inicio,\'%d-%M-%Y\') as fechain,DATE_FORMAT(tv.fecha_retorno,\'%d-%M-%Y\') as fechafin  \
    FROM tbl_planillas tp inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina \
    inner join ctl_codigoplanilla cc on tp.id_codigoplanilla = cc.id_codigoplanilla \
    inner join tbl_vacaciones tv on tn.id_nomina = tv.id_nomina \
    inner join tbl_empleados te on te.id_empleado = tp.id_empleado where tp.id_planilla=?';

    let dr='SELECT ctp.descripcion, format(tdp.monto,2) as  monto, tdd.descripcion as descuendo_directo  FROM tbl_detalle_planilla tdp \
    inner join ctl_tipo_descuentopago ctp on tdp.id_tipo_descuento = ctp.id_tipo_descuento\
    left join tbl_descuento_directo tdd on tdp.id_descuento_directo = tdd.id_descuento_directo WHERE tdp.id_planilla=? and ctp.crdr="DR" \
    order by tdp.monto desc';

    let cr='SELECT ctp.descripcion, format(tdp.monto,2) as  monto, tdd.descripcion as descuendo_directo  FROM tbl_detalle_planilla tdp \
    inner join ctl_tipo_descuentopago ctp on tdp.id_tipo_descuento = ctp.id_tipo_descuento\
    left join tbl_descuento_directo tdd on tdp.id_descuento_directo = tdd.id_descuento_directo WHERE tdp.id_planilla=?  and ctp.crdr="CR"\
    order by tdp.monto desc';

    let rsdr = await query(dr, [req.params.id]);
    let rscr = await query(cr, [req.params.id]);
    let incapadisponible = await query(sql, [req.params.id]);

    pdf.create(compiledFunction({planilla:incapadisponible[0], cr:rscr,dr:rsdr}), {
      border:{
        "top": ".5in",            // default is 0, units: mm, cm, in, px
        "right": ".5in",
        "bottom": ".5in",
        "left": ".5in"
      }
    }).toStream( async (err, stream) => {
      if (err) return res.end(err.stack)
      res.setHeader('Content-type', 'application/pdf')
      await stream.pipe(res)
      fs.unlink(filename, function (err) {});
    });
    return;
  }


/*
  print all in once
*/
exports.printdetaleAll=
  async (req, res, next) => {
    let compiledFunction = pug.compileFile('views/employeepayrollAll.pug');

    let filename= './files/reporte-'+req.params.id+'.pdf';
    let sql='SELECT ifnull(tp.observaciones,\'\') as observaciones, te.cedula, te.num_colaborador,cc.descripcion as planilla,  \
    concat(te.nombre,\' \',te.apellido) as nombre,id_planilla,get_employeedata(tp.id_empleado,\'DEPARTAMENT\') as departamento,\
    get_employeedata(tp.id_empleado,\'OCUPATION\') as ocupacion, format(salario_quincenal_neto,2) as salario_quincenal_neto,\
    FORMAT(neto_a_pagar,2) as neto_a_pagar,FORMAT(total_descuentos,2) as total_descuentos, FORMAT(salario_mensual_pactado,2) as salario_mensual_pactado, \
    DATE_FORMAT(tn.fecha_modificacion,\'%d de %b del %Y\') as fecha_modificacion,concat(cc.codigo,\'-\',tn.ano) as codigo, \
    DATE_FORMAT(DATE(concat(tn.ano,"-", cc.mes,"-", cc.diain)),\'%d-%M-%Y\') as fechain,DATE_FORMAT(DATE(concat(tn.ano,"-", cc.mes,"-",cc.diafin)),\'%d-%M-%Y\') as fechafin  \
    FROM tbl_planillas tp inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina \
    inner join ctl_codigoplanilla cc on tp.id_codigoplanilla = cc.id_codigoplanilla \
    inner join tbl_empleados te on te.id_empleado = tp.id_empleado where tp.id_nomina=?';

    let dr='SELECT ctp.descripcion, format(tdp.monto,2) as  monto, tdd.descripcion as descuendo_directo  FROM tbl_detalle_planilla tdp \
    inner join ctl_tipo_descuentopago ctp on tdp.id_tipo_descuento = ctp.id_tipo_descuento\
    left join tbl_descuento_directo tdd on tdp.id_descuento_directo = tdd.id_descuento_directo WHERE tdp.id_planilla=? and ctp.crdr="DR"';

    let cr='SELECT ctp.descripcion, format(tdp.monto,2) as  monto, tdd.descripcion as descuendo_directo  FROM tbl_detalle_planilla tdp \
    inner join ctl_tipo_descuentopago ctp on tdp.id_tipo_descuento = ctp.id_tipo_descuento\
    left join tbl_descuento_directo tdd on tdp.id_descuento_directo = tdd.id_descuento_directo WHERE tdp.id_planilla=?  and ctp.crdr="CR"';

    
    let incapadisponible = await query(sql, [req.params.id]);

    let rs=[];
    for (const data in incapadisponible) {
      let rsdr = await query(dr, [incapadisponible[data].id_planilla]);
      let rscr = await query(cr, [incapadisponible[data].id_planilla]);
      let crdata=[],drdata=[];
      for (var key in rsdr) {
        drdata.push(JSON.parse(JSON.stringify(rsdr[key])));
      }
      for (var key in rscr) {
        crdata.push(JSON.parse(JSON.stringify(rscr[key])));
      }
      rs.push({planilla: JSON.parse(JSON.stringify(incapadisponible[data])),cr:crdata,dr:drdata});
    }

    pdf.create(compiledFunction({data:rs}), {
      format: 'Letter',
      border:{
        "top": ".5in",            // default is 0, units: mm, cm, in, px
        "right": ".5in",
        "bottom": ".5in",
        "left": ".5in"
      },
    }).toStream( async (err, stream) => {
      if (err) return res.end(err.stack)
      res.setHeader('Content-type', 'application/pdf')
      await stream.pipe(res)
      fs.unlink(filename, function (err) {});
    });
    return;
  }


/*
  retporte excel de nomina 
*/

exports.dataplanilla =async (req, res, next) => {
    let sqlcomplete = 'SELECT id_planilla, upper(concat(te.nombre,\' \',te.apellido)) as nombre,te.cedula,\
    FORMAT(deduccion_seg_educativo,2) as deduccion_seg_educativo,FORMAT(deduccion_seg_social,2) as deduccion_seg_social,\
    FORMAT(ausentismo_tardanza, 2) as ausentismo_tardanza,\
    FORMAT(salario_quincenal_neto-ausentismo_tardanza, 2) as devengado,\
    FORMAT(salario_quincenal_neto, 2) as salario_quincenal_neto,FORMAT(neto_a_pagar, 2) as neto_a_pagar,\
    FORMAT(otros_descuentos+deduccion_isr,2) as otros_descuentos,FORMAT(total_descuentos, 2) as total_descuentos,\
    FORMAT(salario_mensual_pactado, 2) as salario_mensual_pactado,observaciones,\
    get_employeedata(tp.id_contrato,\'DEPARCONTRACT\') as departamento FROM tbl_planillas tp \
    inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina \
    inner join tbl_empleados te on te.id_empleado = tp.id_empleado where tn.id_estado <> 7 and tp.id_nomina=?';
  
    let totales='SELECT FORMAT(sum(deduccion_seg_educativo),2) as deduccion_seg_educativo,\
    FORMAT(sum(deduccion_seg_social),2) as deduccion_seg_social,\
    FORMAT(sum(ausentismo_tardanza),2) as ausentismo_tardanza,\
    FORMAT(sum(salario_quincenal_neto-ausentismo_tardanza), 2) as devengado,\
    FORMAT(sum(salario_quincenal_neto),2) as salario_quincenal_neto,\
    FORMAT(sum(neto_a_pagar),2) as neto_a_pagar,\
    FORMAT(sum(otros_descuentos+deduccion_isr),2) as otros_descuentos,\
    FORMAT(sum(total_descuentos),2) as total_descuentos,\
    FORMAT(sum(salario_mensual_pactado),2) as salario_mensual_pactado \
    FROM tbl_planillas tp inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina \
    inner join tbl_empleados te on te.id_empleado = tp.id_empleado where tn.id_estado <> 7 and tp.id_nomina=?'
    
    let sql='select concat(tua.nombre,\' \', tua.apellido) as nombre, tn.fecha_creacion, tn.fecha_modificacion,\
    UPPER( cc.descripcion) as descripcion,UPPER( DATE_FORMAT(DATE(concat(tn.ano,"-", cc.mes,"-", cc.diain)),\'%d-%M-%Y\')) as fechain,\
    UPPER( DATE_FORMAT(DATE(concat(tn.ano,"-", cc.mes,"-",cc.diafin)),\'%d-%M-%Y\')) as fechafin,\
    tn.descripcion  as observacion from tbl_nomina tn inner join ctl_codigoplanilla cc on tn.id_codigoplanilla =cc.id_codigoplanilla\
    inner join tbl_usuarios_admin tua on tua.id = tn.creado_por where tn.id_nomina =?';

    let compiledFunction = pug.compileFile('views/payrollreport.pug');
    let filename= './files/planilla-'+req.params.id+'.pdf';

    let nomina = await query(sql, [req.params.id]);
    let datosnomina = await query(sqlcomplete, [req.params.id]);
    let totalesdata = await query(totales, [req.params.id]);

    pdf.create(compiledFunction({nomina:nomina[0],datos:datosnomina,totales:totalesdata[0]}), {
      format: 'Legal',
      border:{
        "top": ".5in",            // default is 0, units: mm, cm, in, px
        "right": ".5in",
        "bottom": ".5in",
        "left": ".5in"
      },
      orientation: "landscape"
    }).toStream( async (err, stream) => {
      if (err) return res.end(err.stack)
      res.setHeader('Content-type', 'application/pdf')
      await stream.pipe(res)
      fs.unlink(filename, function (err) {});
    });
    return;
}



/*
  retporte excel de decimo 
*/

exports.dataplanilladecimo =async (req, res, next) => {
  let sqlcomplete = 'SELECT upper(concat(te.nombre,\' \',te.apellido)) as nombre,te.cedula, id_planilla, \
  FORMAT(deduccion_seg_social,2) as deduccion_seg_social,FORMAT(deduccion_isr,2) as deduccion_isr, FORMAT(total_descuentos,2) as total_descuentos,\
  FORMAT(salario_quincenal_neto,2) as salario_quincenal_neto, FORMAT(neto_a_pagar,2) as neto_a_pagar,\
  FORMAT(total_ingresos,2) as total_ingresos, observaciones,get_employeedata(tp.id_contrato,\'DEPARCONTRACT\') as departamento \
  FROM tbl_planillas tp inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina \
  inner join tbl_empleados te on te.id_empleado = tp.id_empleado where tn.id_estado <> 7 and tp.id_nomina=? order by departamento,nombre';

  let totales='SELECT FORMAT(sum(deduccion_seg_social),2) as deduccion_seg_social,\
  FORMAT(sum(deduccion_isr),2) as deduccion_isr, FORMAT(sum(total_descuentos),2) as total_descuentos,\
  FORMAT(sum(salario_quincenal_neto),2) as salario_quincenal_neto,  \
  FORMAT(sum(neto_a_pagar),2) as neto_a_pagar, FORMAT(sum(total_ingresos),2) as total_ingresos \
  FROM tbl_planillas tp inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina where tn.id_estado <> 7 and tp.id_nomina=?'
  
  let sql='select concat(tua.nombre,\' \', tua.apellido) as nombre, tn.fecha_creacion, tn.fecha_modificacion,\
  UPPER( cc.descripcion) as descripcion,UPPER( DATE_FORMAT(DATE(concat( IF(tn.id_codigoplanilla=34, tn.ano-1, tn.ano),"-", cc.mes,"-", 16)),\'%d-%M-%Y\')) as fechain,\
  UPPER( DATE_FORMAT(DATE(concat(tn.ano,"-", cc.diain,"-",15)),\'%d-%M-%Y\')) as fechafin,\
  tn.descripcion  as observacion from tbl_nomina tn inner join ctl_codigoplanilla cc on tn.id_codigoplanilla =cc.id_codigoplanilla\
  inner join tbl_usuarios_admin tua on tua.id = tn.creado_por where tn.id_nomina =?';

  let compiledFunction = pug.compileFile('views/payrollreportdecimo.pug');
  let filename= './files/planilla-'+req.params.id+'.pdf';

  let nomina = await query(sql, [req.params.id]);
  let datosnomina = await query(sqlcomplete, [req.params.id]);
  let totalesdata = await query(totales, [req.params.id]);

  pdf.create(compiledFunction({nomina:nomina[0],datos:datosnomina,totales:totalesdata[0]}), {
    format: 'Legal',
    border:{
      "top": ".5in",            // default is 0, units: mm, cm, in, px
      "right": ".5in",
      "bottom": ".5in",
      "left": ".5in"
    },
    orientation: "landscape"
  }).toStream( async (err, stream) => {
    if (err) return res.end(err.stack)
    res.setHeader('Content-type', 'application/pdf')
    await stream.pipe(res)
    fs.unlink(filename, function (err) {});
  });
  return;
}