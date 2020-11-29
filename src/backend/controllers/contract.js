
const db = require('../config/db');
const { check,param, validationResult } = require('express-validator');
const {getUserId,validateAdminiostrative} = require('../helpers/utils')
const {insertlog} = require('../helpers/logactions');

const util = require('util');
const query = util.promisify(db.query).bind(db);

exports.contracttable = (req, res, next) => {
  db.query('select id_contrato,te.nombre, DATE_FORMAT(tc.fecha_fin_labores,\'%d-%m-%Y\') as fecha_fin_labores, DATE_FORMAT(tc.fecha_inicio_labores,\'%d-%m-%Y\') as fecha_inicio_labores, \
  ct.descripcion as tipocontrato, th.descripcion as horario, tc.id_estado, tc.hora_semana from tbl_contratos tc inner join ctl_tipocontrato ct on tc.id_tipocontrato = ct.id_tipocontrato \
  inner join tbl_horarios th on tc.id_horario = th.id_horario inner join tbl_empleados te on tc.id_empleado = te.id_empleado',
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conección a datos ' + error });
        
      }
      return res.status(200).json(results);
    });
}


exports.contractget = (req, res, next) => {
  db.query('select id_contrato, te.nombre, te.apellido, DATE_FORMAT(tc.fecha_fin_labores,\'%d-%m-%Y\') as fecha_fin_labores, DATE_FORMAT(tc.fecha_inicio_labores,\'%d-%m-%Y\') as fecha_inicio_labores, \
  tc.id_tipocontrato,tip.descripcion as tipocontrato,get_employeedata(id_contrato,\'OCUPCONTRACT\') as ocupacion,get_employeedata(id_contrato,\'DEPARCONTRACT\') as departamento, id_departamento, \
  hora_semana,id_ocupacion, tc.id_horario, ho.descripcion as horario, tc.id_estado, es.descripcion as estado from tbl_contratos tc \
  inner join tbl_catalogo_estado es on es.id_estado = tc.id_estado \
  inner join tbl_horarios ho on ho.id_horario = ho.id_horario \
  inner join ctl_tipocontrato tip on tc.id_tipocontrato=tip.id_tipocontrato \
  inner join tbl_empleados te on tc.id_empleado = te.id_empleado where id_contrato=?',[parseInt(req.params.id)],
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conección a datos ' + error });
      }
      return res.status(200).json(results);
    });
}


exports.contractendget = (req, res, next) => {
  db.query('select * from tbl_finaliza_contrato where id_contrato=? order by id_finaliza desc limit 1',[parseInt(req.params.id)],
    function (error, results, fields) {
      if (error) {
        res.status(401).json({ message: 'error en conección a datos ' + error });
        return;
      }
      res.status(200).json(results);
    });
}

exports.contracttypeendupdate =[
  [
    check('id_contrato').notEmpty().isInt(),
    check('motivo').notEmpty(),
    check('id_tipo_finaliza').notEmpty().isInt(),
    check('fecha_culmina').notEmpty(),
  ], async (req, res, next) => {
  let {id_contrato,motivo,id_tipo_finaliza,fecha_culmina}=req.body;
  await query('UPDATE tbl_contratos SET fecha_fin_labores=? WHERE id_contrato=?', [fecha_culmina,id_contrato]);

  db.query('update tbl_finaliza_contrato set id_contrato=?, id_tipo_finaliza=?, motivo=?,fecha_culmina=?\
  where id_finaliza=?',[parseInt(id_contrato),parseInt(id_tipo_finaliza),motivo,fecha_culmina, parseInt(req.params.id)],
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conección a datos ' + error });
      }
      return res.status(200).json(results);
    });
}];

exports.contracttypeendcreate=[
  [
    check('id_contrato').notEmpty().isInt(),
    check('motivo').notEmpty(),
    check('id_tipo_finaliza').notEmpty().isInt(),
    check('fecha_culmina').notEmpty()
  ], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let {id_contrato,motivo,id_tipo_finaliza,fecha_culmina}=req.body;

    let finlabores = await query('select fecha_fin_labores from  tbl_contratos WHERE id_contrato=?', [id_contrato]);
    await query('UPDATE tbl_contratos SET fecha_fin_labores=?, fecha_fin_labores_save=? WHERE id_contrato=?', [fecha_culmina,finlabores[0].fecha_fin_labores,id_contrato]);
    db.query('insert into tbl_finaliza_contrato(id_contrato, id_tipo_finaliza, motivo,fecha_culmina)\
    VALUES(?,?,?,?)',[id_contrato,id_tipo_finaliza,motivo,fecha_culmina],
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conección a datos ' + error });
      }
      return res.status(200).json(results);
    });
}]



exports.contracttype = (req, res, next) => {
  db.query('SELECT id_tipocontrato, descripcion FROM ctl_tipocontrato',
    function (error, results, fields) {
      if (error) {
        res.status(401).json({ message: 'error en conección a datos ' + error });
        return;
      }
      res.status(200).json(results);
    });
}

exports.hasactivesalary = (req, res, next) => {
  db.query('SELECT get_employeedata(?,\'TIENSALARIO\') as result',[parseInt(req.params.id)],
    function (error, results, fields) {
      if (error) {
        res.status(401).json({ message: 'error en conección a datos ' + error });
        return;
      }
      res.status(200).json(results);
    });
}

exports.create = [
  [
    check('fecha_inicio_labores').notEmpty(),
    check('id_empleado').notEmpty().bail().isInt(),
    check('id_tipocontrato').notEmpty().bail().isInt(),
    check('id_horario').notEmpty().bail().isInt(),
    check('hora_semana').notEmpty().bail().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let data = [req.body.fecha_inicio_labores,
    parseInt(req.body.id_empleado),
    parseInt(req.body.id_tipocontrato),
    parseInt(req.body.id_horario)];

    let contarcts = await query('SELECT id_empleado FROM tbl_contratos where id_empleado = ? and id_estado in(7,6)', [parseInt(req.body.id_empleado)]);

    if (contarcts.length === 0) {
      await query('UPDATE tbl_salarios SET id_estado = 9 WHERE id_contrato=?', [parseInt(req.body.id_contrato)]);
      db.query('INSERT INTO tbl_contratos \
      (fecha_inicio_labores, id_empleado, id_tipocontrato, id_horario) \
      VALUES(?, ?, ?, ?)', data,
        function (error, results, fields) {
          if (error) {
            res.status(401).json({ message: error.sqlMessage, errno: error.errno });
            return;
          }
          res.status(200).json({ message: 'contrato creado.', id: results.insertId, database: results });
        });
    } else {
      res.status(401).json({ message: 'Colaborador cuenta con un contrato activo' });
    }
  }
];


exports.createcontractcomplete=[
  [
    check('id_empleado').notEmpty().isInt({min:0}),
    check('ocupacion').notEmpty().bail().isInt({min:1}),
    check('departamento').notEmpty().bail().isInt({min:1}),
    check('fecha_inicio_labores').custom((value) => {
      if (value==='' || value==='Invalid date'){
        return false;  
      }else{
        return true;
      }
    }),

    check('fecha_fin_labores').custom((value, { req }) => {
      if (req.body.id_tipocontrato==9 && (value==='' || value==='Invalid date')){
        return false;  
      }else{
        return true;
      }
    }),

    check('id_tipocontrato').notEmpty().bail().isInt(),
    check('id_horario').notEmpty().bail().isInt(),
    check('hora_semana').notEmpty().bail().isInt(),
    check('monto_mensual').notEmpty().isDecimal({min:50}),
    check('monto_quincenal').notEmpty().isDecimal({min:50}),
    check('monto_hora').notEmpty().isDecimal({min:50}),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    
    try{
      let sql= 'INSERT INTO tbl_contratos (fecha_inicio_labores,fecha_fin_labores,id_empleado,id_tipocontrato,id_horario,id_ocupacion,id_departamento,hora_semana) VALUES(?,?,?,?,?,?,?,?)'
      let datacontract=[req.body.fecha_inicio_labores,
            req.body.fecha_fin_labores,parseInt(req.body.id_empleado),parseInt(req.body.id_tipocontrato),
            parseInt(req.body.id_horario),parseInt(req.body.ocupacion),parseInt(req.body.departamento),parseInt(req.body.hora_semana)];
      if(req.body.fecha_fin_labores==''){
        sql= 'INSERT INTO tbl_contratos (fecha_inicio_labores, id_empleado, id_tipocontrato, id_horario,id_ocupacion,id_departamento,hora_semana) VALUES(?,?,?,?,?,?,?)';
        datacontract=[req.body.fecha_inicio_labores,
          parseInt(req.body.id_empleado),parseInt(req.body.id_tipocontrato),
          parseInt(req.body.id_horario),parseInt(req.body.ocupacion),parseInt(req.body.departamento),
          parseInt(req.body.hora_semana)
        ];
      }

      let contratrs = await query(sql, datacontract);
      let datasalary=[req.body.monto_mensual,req.body.monto_quincenal,contratrs.insertId, req.body.monto_hora];
      await query('INSERT INTO tbl_salarios (monto_mensual, id_estado, monto_quincenal, id_contrato, monto_hora) VALUES(?, 7, ?, ?, ?)', datasalary);
      await query('update tbl_empleados set id_estado = 1 where id_empleado = ?', [parseInt(req.body.id_empleado)]);
      insertlog('Contratos','Creacion', 0, getUserId(req));
      return res.status(200).json({message:'Empleado creado.',id:contratrs.insertId,database:contratrs});
    }catch(e){
      return res.status(401).json({message:e.sqlMessage,errno: e.errno});
    }
  }
];


exports.update = [
  [
    check('fecha_inicio_labores').custom((value) => {
      if (value==='' || value==='Invalid date'){return false;}
      else{return true;}
    }),
    check('fecha_fin_labores').custom((value, { req }) => {

      if (req.body.id_tipocontrato==9 &&  (value==='' || value==='Invalid date')){return false;}
      else{return true;}
    }),
    check('id_tipocontrato').notEmpty().bail().isInt(),
    check('id_horario').notEmpty().bail().isInt(),
    check('ocupacion').notEmpty().bail().isInt({min:1}),
    check('departamento').notEmpty().bail().isInt({min:1}),
    check('hora_semana').notEmpty().bail().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    
    let contarcts = await query('SELECT id_empleado FROM tbl_contratos where id_contrato = ? and id_estado in (7,6)', [parseInt(req.params.id)]);
    if (contarcts.length > 0) { 

      let sql= 'UPDATE tbl_contratos SET fecha_inicio_labores=?,fecha_fin_labores=?, \
                id_tipocontrato=?, id_horario=?, id_estado=7, id_ocupacion=?,id_departamento=?,hora_semana=? WHERE id_contrato=?'

      let datacontract=[req.body.fecha_inicio_labores,
        req.body.fecha_fin_labores,
        parseInt(req.body.id_tipocontrato),
        parseInt(req.body.id_horario),
        parseInt(req.body.ocupacion),
        parseInt(req.body.departamento),
        parseInt(req.body.hora_semana),
        parseInt(req.params.id)
      ];

      if(req.body.fecha_fin_labores==''){
        sql= 'UPDATE tbl_contratos SET fecha_inicio_labores=?, id_tipocontrato=?, id_horario=?,\
        id_estado=7,id_ocupacion=?,id_departamento=?,hora_semana=?  WHERE id_contrato=?';
        datacontract=[req.body.fecha_inicio_labores,
          parseInt(req.body.id_tipocontrato),
          parseInt(req.body.id_horario),
          parseInt(req.body.ocupacion),
          parseInt(req.body.departamento),
          parseInt(req.body.hora_semana),
          parseInt(req.params.id)
        ];
      }

      db.query(sql, datacontract,
        function (error, results, fields) {
          if (error) {
            return res.status(401).json({ message: error.sqlMessage, errno: error.errno });
          }
          insertlog('Contratos','actualiza', parseInt(req.params.id), getUserId(req));
          return res.status(200).json({
            message: 'Contrato actualizado.',
            id: results.insertId,
            database: results
          });
        });
    }else{
      return res.status(401).json({ message: 'Contrato no puede ser actualizado'});
    }
  }
];


exports.aprovecontract= [
  [
    check('id').notEmpty(),
    check('accion').notEmpty()
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    if(validateAdminiostrative(req, res)){
      let contarct = await query('SELECT id_estado, id_empleado FROM tbl_contratos where id_contrato = ?', [parseInt(req.params.id)]);
      let idestado=6;
      let accion='';

      if(contarct[0].id_estado===7 && req.body.accion==='true'){
        accion='Aprueba';
        idestado=6;
      }else if(contarct[0].id_estado===7 && req.body.accion==='false'){
        accion='No Aprueba';
        idestado=8;
      }else if(contarct[0].id_estado===6 && req.body.accion==='true'){
        accion='Finalización por aprobar';
        idestado=11;
      }else if(contarct[0].id_estado===11 && req.body.accion==='true'){
        accion='Finalización aprobada';
        idestado=10;
      }else if(contarct[0].id_estado===11 && !req.body.accion==='false'){
        accion='Finalización no aprobada';
        await query('delete from tbl_finaliza_contrato where id_contrato = ?', [parseInt(req.params.id)]);
        idestado=6;
      }

      let data = [idestado,req.params.id];
      db.query('UPDATE tbl_contratos SET id_estado=? WHERE id_contrato=?', data,
        async function (error, results, fields) {
          if (error) {
            return res.status(401).json({ message: error.sqlMessage, errno: error.errno });
          }
          if(idestado===10||idestado===8){
            await query('update tbl_empleados set id_estado=1 where id_empleado = ?', [contarct[0].id_empleado]);
            await query('update tbl_salarios set id_estado=? where id_contrato = ?', [idestado,parseInt(req.params.id)]);
          }
          insertlog('Contratos',accion, parseInt(req.params.id), getUserId(req));
          return res.status(200).json({ message: 'Contrato actualizado', id: results.insertId, database: results });
        });
    }else{
      return res.status(401).json({ message: 'No se pudo realizar la acción.' });
    }
  }
];


exports.updatefinaliza = [
  [
    check('fecha_inicio_labores').notEmpty(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let data = [req.body.fecha_inicio_labores,
    req.params.id
    ];

    db.query('UPDATE tbl_contratos SET fecha_fin_labores=?, aprobado=false WHERE id_contrato=?', data,
      function (error, results, fields) {
        if (error) {
          res.status(401).json({ message: error.sqlMessage, errno: error.errno });
          return;
        }
        insertlog('Contratos','Finaliza', parseInt(req.params.id), getUserId(req));
        return res.status(200).json({ message: 'usuario creado.', id: results.insertId, database: results });
      });

  }
];



exports.deletecontract = [
  [
    check('fecha_inicio_labores').notEmpty(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let data = [req.body.fecha_inicio_labores,
    req.params.id
    ];

    db.query('UPDATE tbl_contratos SET fecha_fin_labores=?, aprobado=false WHERE id_contrato=?', data,
      function (error, results, fields) {
        if (error) {
          res.status(401).json({ message: error.sqlMessage, errno: error.errno });
          return;
        }
        res.status(200).json({ message: 'usuario creado.', id: results.insertId, database: results });

      });

  }
];