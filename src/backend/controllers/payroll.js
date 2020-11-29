const db = require('../config/db');
const { getUserId, validateAdminiostrative } = require('../helpers/utils')
const { insertlog } = require('../helpers/logactions');
const { check, validationResult } = require('express-validator');
const util = require('util');
const query = util.promisify(db.query).bind(db);

exports.payrollstats = (req, res, next) => {
  db.query('SELECT get_planilladata(0,\'TOTALXMES\') as totxmes, \
  get_planilladata(0,\'TOTALMESX12\') as totmesx12, \
  get_planilladata(0,\'TOTALAPROBADAS\') as totapro, \
  get_planilladata(0,\'TOTALIMPUESTOS\') as totimp',
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
};


exports.getdisponible = (req, res, next) => {
  let sql='select YEAR(CURDATE()) as ano, concat(cod.codigo,\'-\',YEAR(CURDATE()),\'-\',cod.descripcion) as descripcion,cod.id_codigoplanilla\
  from ctl_codigoplanilla cod where tipo=? and id_codigoplanilla not in (select id_codigoplanilla \
  from tbl_nomina where id_estado in (6,7) and ano=YEAR(CURDATE())) \
  union all select YEAR(CURDATE())-1 as ano, concat(cod.codigo,\'-\', YEAR(CURDATE())-1,\'-\',cod.descripcion) as descripcion, \
  cod.id_codigoplanilla from ctl_codigoplanilla cod where tipo=? and id_codigoplanilla not in (select concat(id_codigoplanilla)\
  from tbl_nomina where id_estado in (6,7) and ano=(YEAR(CURDATE())-1)) \
  and id_codigoplanilla not in (select id_codigoplanilla from tbl_nomina where id_estado in (6,7) and ano=YEAR(CURDATE())-1)';

  db.query(sql,
    [req.params.id, req.params.id], function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
}

exports.getemployee = async (req, res, next) => {
  db.query('SELECT em.id_empleado,  upper(concat(em.nombre,\' \',em.apellido)) as nombre FROM tbl_empleados em \
  inner join tbl_contratos co on em.id_empleado = co.id_empleado \
  where co.id_estado=6 and em.id_estado not in(10,12,5) and em.id_empleado not in (select distinct id_empleado from tbl_planillas where id_nomina=?) order by nombre',[req.params.id], function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
}


exports.tablenaomina = (req, res, next) => {
  db.query('select id_nomina,tn.id_codigoplanilla,cc.codigo as codigodesplanilla, tn.id_estado,tn.ano, tce.descripcion as estado, cc.descripcion as nomina, tn.carga_marcacion, tn.marcacion_fin, tn.marcacion_inicio,tn.descripcion , \
  get_planilladata(id_nomina,\'CRNOMINA\') as monto_nomina,tn.fecha_creacion, get_planilladata(id_nomina,\'TOTALNOMINA\') as total_pagar \
  ,tn.id_estado from tbl_nomina tn inner join tbl_catalogo_estado tce on tn.id_estado = tce.id_estado \
  inner join ctl_codigoplanilla cc ON cc.id_codigoplanilla = tn.id_codigoplanilla where ano in (YEAR(CURDATE()),YEAR(CURDATE())-1) \
  and cc.tipo=? and tn.id_estado in(6,7) order by  tn.ano desc, tn.id_codigoplanilla desc', [req.params.id], function (error, results, fields) {
    if (error) {
      return res.status(401).json({ message: 'error en conexión a datos ' + error });
    }
    return res.status(200).json(results);
  });
}

exports.tablenaominaall = (req, res, next) => {
  let sql= 'select id_nomina,tn.id_codigoplanilla,cc.codigo as codigodesplanilla, tn.id_estado,tn.ano, tce.descripcion as estado, cc.descripcion as nomina, tn.carga_marcacion, tn.marcacion_fin, tn.marcacion_inicio,tn.descripcion , \
  get_planilladata(id_nomina,\'CRNOMINA\') as monto_nomina,tn.fecha_creacion, get_planilladata(id_nomina,\'TOTALNOMINA\') as total_pagar \
  ,tn.id_estado from tbl_nomina tn inner join tbl_catalogo_estado tce on tn.id_estado = tce.id_estado \
  inner join ctl_codigoplanilla cc ON cc.id_codigoplanilla = tn.id_codigoplanilla where ano =? and \
  cc.tipo=? and tn.id_estado <> 7 order by  tn.ano desc, tn.id_codigoplanilla desc';
  db.query(sql, [req.body.ano,req.body.id], function (error, results, fields) {
    if (error) {
      return res.status(401).json({ message: 'error en conexión a datos ' + error });
    }
    return res.status(200).json(results);
  });
}

exports.getnomina = (req, res, next) => {
  db.query('select cc.id as codigoplanilla, cc.codigo as codigodesplanilla, tn.id_codigoplanilla,tn.descripcion as comentario, tn.id_estado,tn.ano, \
  tce.descripcion as estado, cc.descripcion as nomina, tn.carga_marcacion, tn.marcacion_fin, tn.marcacion_inicio , get_admindata(tn.creado_por ,\'NOMBRE\') as creado_por, \
  get_admindata(tn.aprobado_por ,\'NOMBRE\') as aprobado_por, get_planilladata(id_nomina,\'CRNOMINA\') as monto_nomina,tn.fecha_creacion, get_planilladata(id_nomina,\'TOTALNOMINA\') as total_pagar \
  ,tn.descripcion,tn.id_nomina from tbl_nomina tn inner join tbl_catalogo_estado tce on tn.id_estado = tce.id_estado \
  inner join ctl_codigoplanilla cc ON cc.id_codigoplanilla = tn.id_codigoplanilla where id_nomina=?', [req.params.id], function (error, results, fields) {
    if (error) {
      return res.status(401).json({ message: 'error en conexión a datos ' + error });
    }
    return res.status(200).json(results);
  });
}


exports.tablplanilla = (req, res, next) => {
  let sql = 'SELECT concat(te.nombre,\' \',te.apellido) as nombre,id_planilla, '+
    'get_planilladata(id_planilla,\'EDUCATIVO\') as deduccion_seg_educativo, ' +
    'get_planilladata(id_planilla,\'SOCIAL\') as deduccion_seg_social,' +
    'get_planilladata(id_planilla,\'RENTA\') as deduccion_isr, ' +
    'get_planilladata(id_planilla,\'AUCENCIAS\') as ausentismo_tardanza, ' +
    'get_planilladata(id_planilla,\'CR\') as salario_quincenal_neto, ' +
    'get_planilladata(id_planilla,\'TOTALQUINCENA\') as neto_a_pagar, ' +
    'get_planilladata(id_planilla,\'OTRODESC\') as otros_descuentos, ' +
    'get_planilladata(id_planilla,\'DEDUCCIONES\') as total_descuentos, ' +
    'salario_mensual_pactado, observaciones, get_employeedata(tp.id_contrato,\'DEPARCONTRACT\') as departamento FROM tbl_planillas tp ' +
    'inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina inner join tbl_empleados te on te.id_empleado = tp.id_empleado ' +
    'where tn.id_estado = 7 and tp.id_nomina=? union all SELECT concat(te.nombre,\' \',te.apellido) as nombre,id_planilla, deduccion_seg_educativo, deduccion_seg_social, deduccion_isr,ausentismo_tardanza, ' +
    'salario_quincenal_neto, neto_a_pagar,otros_descuentos as otros_descuentos, total_descuentos, salario_mensual_pactado, ' +
    'observaciones,get_employeedata(tp.id_contrato,\'DEPARCONTRACT\') as departamento FROM tbl_planillas tp inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina ' +
    'inner join tbl_empleados te on te.id_empleado = tp.id_empleado where tn.id_estado <> 7 and tp.id_nomina=? order by departamento,nombre';
    db.query(sql,
    [parseInt(req.params.id), parseInt(req.params.id)], function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      res.status(200).json(results);
    });
}

exports.getplanilla = (req, res, next) => {
  let sql = 'SELECT concat(te.nombre,\' \',te.apellido) as nombre,  get_planilladata(id_planilla,\'EDUCATIVO\') as deduccion_seg_educativo, ' +
    'get_planilladata(id_planilla,\'SOCIAL\') as deduccion_seg_social,' +
    'get_planilladata(id_planilla,\'RENTA\') as deduccion_isr, ' +
    'get_planilladata(id_planilla,\'AUCENCIAS\') as ausentismo_tardanza, ' +
    'get_planilladata(id_planilla,\'CR\') as salario_quincenal_neto, ' +
    'get_planilladata(id_planilla,\'TOTALQUINCENA\') as neto_a_pagar, ' +
    'get_planilladata(id_planilla,\'OTRODESC\') as otros_descuentos, ' +
    'get_planilladata(id_planilla,\'DEDUCCIONES\') as total_descuentos, ' +
    'salario_mensual_pactado, observaciones, tp.id_empleado,tp.id_nomina,tp.id_codigoplanilla,tp.id_planilla FROM tbl_planillas tp ' +
    'inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina inner join tbl_empleados te on te.id_empleado = tp.id_empleado ' +
    'where tn.id_estado = 7 and tp.id_planilla=? union all  ' +
    'SELECT concat(te.nombre,\' \',te.apellido) as nombre, deduccion_seg_educativo, deduccion_seg_social, deduccion_isr, ausentismo_tardanza,' +
    'salario_quincenal_neto, neto_a_pagar,otros_descuentos+deduccion_isr as otros_descuentos, total_descuentos, salario_mensual_pactado, ' +
    'observaciones,tp.id_empleado,tp.id_nomina,tp.id_codigoplanilla,tp.id_planilla FROM tbl_planillas tp inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina ' +
    'inner join tbl_empleados te on te.id_empleado = tp.id_empleado where tn.id_estado <> 7 and tp.id_planilla=?';
  db.query(sql,
    [parseInt(req.params.id), parseInt(req.params.id)], function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      res.status(200).json(results);
    });
}

exports.deduccionespagos = (req, res, next) => {
  let sql = 'SELECT dp.id_descuento_realizado,dp.id_nomina,dp.id_descuento_directo,td.descripcion,dd.descripcion as descuento_directo,\
  td.crdr,dp.monto,dp.id_tipo_descuento FROM tbl_detalle_planilla dp \
  inner join ctl_tipo_descuentopago td on td.id_tipo_descuento = dp.id_tipo_descuento \
  left join tbl_descuento_directo dd on dd.id_descuento_directo = dp.id_descuento_directo \
  WHERE id_planilla = ? order by dp.monto desc, dp.id_descuento_directo asc';
  db.query(sql, [parseInt(req.params.id)],
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      res.status(200).json(results);
    });
}


exports.aprovenomina = [
  [
    check('id').notEmpty(),
    check('accion').notEmpty()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    if (validateAdminiostrative(req, res)) {

      let nomina = await query('SELECT id_estado, id_codigoplanilla FROM tbl_nomina where id_nomina = ?', [parseInt(req.params.id)]);
      let idestado = 6;
      let accion = '';

      if (nomina[0].id_estado === 7 && req.body.accion === 'true') {
        accion = 'Aprueba';
        idestado = 6;
      } else if (nomina[0].id_estado === 7 && req.body.accion === 'false') {
        accion = 'No Aprueba';
        idestado = 8;
        
        if(nomina[0].id_codigoplanilla===53){
          await query('update tbl_vacaciones set id_estado=8 where id_nomina=?', [req.params.id]);
          let id_empleado=await query('select id_empleado from tbl_vacaciones where id_nomina=?', [req.params.id]);
          await query('update tbl_empleado set id_estado=1 where id_emplado=?',[id_empleado[0].id_empleado]);
        }
      }
      if (idestado == 6) {
        try {
          let useid = getUserId(req);
          let nomina = await query('SELECT get_planilladata(id_planilla,\'EDUCATIVO\') as deduccion_seg_educativo, '+
            'get_planilladata(id_planilla,\'SOCIAL\') as deduccion_seg_social,'+
            'get_planilladata(id_planilla,\'RENTA\') as deduccion_isr, '+
            'get_planilladata(id_planilla,\'AUCENCIAS\') as ausentismo_tardanza, '+
            'get_planilladata(id_planilla,\'CR\') as salario_quincenal_neto, '+
            'get_planilladata(id_planilla,\'TOTALQUINCENA\') as neto_a_pagar, '+
            'get_planilladata(id_planilla,\'OTRODESC\') as otros_descuentos, '+
            'get_planilladata(id_planilla,\'DEDUCCIONES\') as total_descuentos, '+
            'salario_mensual_pactado,tp.id_planilla FROM tbl_planillas tp '+
            'inner join tbl_nomina tn on tp.id_nomina = tn.id_nomina inner join tbl_empleados te on te.id_empleado = tp.id_empleado '+
            'where tn.id_estado=7 and tp.id_nomina=?', [parseInt(req.params.id)]);
          for (const planilla of nomina) {
            let datos = [
              planilla.deduccion_seg_educativo,
              planilla.deduccion_seg_social,
              planilla.deduccion_isr,
              planilla.salario_quincenal_neto,
              planilla.neto_a_pagar,
              planilla.otros_descuentos,
              planilla.total_descuentos,
              planilla.ausentismo_tardanza,
              planilla.id_planilla
            ];
            await query('update tbl_vacaciones set pagado=true where id_nomina=?', [req.params.id]);
            await query('update tbl_vacaciones_adelanto set cobrado=true where id_nomina=?', [req.params.id]);
            
            await query('update tbl_nomina set aprobado_por=? where id_nomina=?', [useid,req.params.id]);
            let sql = 'update tbl_planillas set deduccion_seg_educativo=?,deduccion_seg_social=?,\
            deduccion_isr=?,salario_quincenal_neto=?, neto_a_pagar=?,otros_descuentos=?, total_descuentos=?, ausentismo_tardanza=? \
             where id_planilla=?';
            await query(sql, datos);
            await query('call update_vacaciones()');
          }
        } catch (e) {
          console.log(e);
          return res.status(401).json({ message: 'No se pudo realizar la acción.' });
        }
      }

      let data = [idestado, req.params.id];
      db.query('UPDATE tbl_nomina SET id_estado=? WHERE id_nomina=?', data,
        async function (error, results, fields) {
          if (error) {
            return res.status(401).json({ message: error.sqlMessage, errno: error.errno });
          }
          await insertlog('Planilla', accion, parseInt(req.params.id), getUserId(req));
          return res.status(200).json({ message: 'Planilla Actualizada', id: results.insertId, database: results });
        });
    } else {
      return res.status(401).json({ message: 'No se pudo realizar la acción.' });
    }
  }
];




exports.actualizaronservaciones = [
  [
    check('comentario').notEmpty(),
    check('tabla').notEmpty(),
  ], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let nomina = 'UPDATE tbl_nomina SET descripcion=? WHERE id_nomina=?';
    let planilla = 'UPDATE tbl_planillas SET observaciones=? WHERE id_planilla=?';
    let sql = planilla;
    let data = [req.body.comentario, req.params.id];
    if (req.body.tabla === 'n') { sql = nomina; }
    db.query(sql, data,
      function (error, results, fields) {
        if (error) {
          return res.status(401).json({ message: 'error en conexión a datos ' + error });
        }
        
        return res.status(200).json(results);
      });
  }]


exports.eliminaplanilla = async (req, res, next) => {
  let rs = [];
  try {
    rs = await query('select id_estado from tbl_nomina where id_nomina=?', [req.params.id]);
    if (rs[0].id_estado === 7) {
      await query('update tbl_vacaciones set id_nomina=null where id_nomina=?', [req.params.id]);
      await query('DELETE FROM tbl_detalle_planilla where id_nomina=?', [req.params.id]);
      await query('DELETE FROM tbl_planillas where id_nomina=?', [req.params.id]);
      let del = await query('DELETE FROM tbl_nomina where id_nomina=?', [req.params.id]);
      return res.status(200).json(del);
    } else {
      insertlog('Planilla','Elimina', parseInt(req.params.id), getUserId(req));
      return res.status(401).json({ message: 'Planilla no puede ser eliminada' + error });
    }
  } catch (e) {
    return res.status(401).json({ message: 'error en conexión a datos ', error: e });
  }
}

exports.eliminaplanilladetalle = async (req, res, next) => {
  let rs = [];
  try {
    rs = await query('select tn.id_estado from tbl_nomina tn \
    inner join tbl_planillas tp on tn.id_nomina=tp.id_nomina \
    where tp.id_planilla=?', [req.params.id]);
    if (rs[0].id_estado === 7) {
      await query('DELETE FROM tbl_detalle_planilla where id_planilla=?', [req.params.id]);
      let del = await query('DELETE FROM tbl_planillas where id_planilla=?', [req.params.id]);
      return res.status(200).json(del);
    } else {
      return res.status(401).json({ message: 'Planilla no puede ser eliminada' + error });
    }
  } catch (e) {
    return res.status(401).json({ message: 'error en conexión a datos ', error: e });
  }
}



