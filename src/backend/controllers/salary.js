
const db = require('../config/db');
const { check,param, validationResult } = require('express-validator');

const {validateAdminiostrative, getUserId} = require('../helpers/utils')
const {insertlog} = require('../helpers/logactions');

const util = require('util');
const query = util.promisify(db.query).bind(db);

exports.salarytable=(req, res, next) => {
  db.query('SELECT a.id_salario,a.monto_hora, a.monto_mensual, DATE_FORMAT(a.fecha_creacion,"%d-%m-%Y") as fecha_creacion, a.fecha_modificacion, a.id_estado, b.descripcion, a.monto_quincenal, a.id_contrato \
            FROM tbl_salarios a INNER JOIN tbl_catalogo_estado b on a.id_estado=b.id_estado order by id_salario desc',
  function (error, results, fields) {
    if (error){
      res.status(401).json({message:'error en conección a datos '+error});
      return;
    }
    res.status(200).json(results);
  });
}


exports.salarytablecontract=(req, res, next) => {
  db.query('SELECT a.id_salario,a.monto_hora, a.monto_mensual, a.observacion, DATE_FORMAT(a.fecha_creacion,"%d-%m-%Y") as fecha_creacion, a.fecha_modificacion, a.id_estado, b.descripcion, a.monto_quincenal, a.id_contrato \
            FROM tbl_salarios a INNER JOIN tbl_catalogo_estado b on a.id_estado=b.id_estado where a.id_contrato=? order by id_salario desc',[parseInt(req.params.id)],
  function (error, results, fields) {
    if (error){
      res.status(401).json({message:'error en conección a datos '+error});
      return;
    }
    res.status(200).json(results);
  });
}


exports.salaryget=(req, res, next) => {
  db.query('SELECT a.id_salario,a.monto_hora, a.monto_mensual, a.monto_quincenal, a.id_contrato,a.observacion \
            FROM tbl_salarios a where a.id_salario=? order by id_salario desc',[parseInt(req.params.id)],
  function (error, results, fields) {
    if (error){
      
      res.status(401).json({message:'error en conección a datos '+error});
      return;
    }
    res.status(200).json(results);
  });
}


exports.create =[
  [
    check('monto_mensual').notEmpty().isDecimal(),
    check('monto_quincenal').notEmpty().isDecimal(),
    check('monto_hora').notEmpty().isDecimal(),
    check('id_contrato').notEmpty().bail().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let data=[req.body.monto_mensual,
      req.body.monto_quincenal,
      req.body.monto_hora,
      parseInt(req.body.id_contrato),
      req.body.observacion
    ];
    
    let salary = await query('SELECT id_salario FROM tbl_salarios where id_contrato = ? and id_estado in (7)',[parseInt(req.body.id_contrato)]);
    
    if(salary.length===0){
      /*let actualsalary = await query('SELECT monto_mensual, monto_quincenal, monto_hora FROM tbl_salarios where id_contrato = ? and id_estado = 6 limit 1',[parseInt(req.body.id_contrato)]);
      if(actualsalary.length>0){
        if(parseFloat(actualsalary[0].monto_mensual)>parseFloat(req.body.monto_mensual)|| 
        parseFloat(actualsalary[0].monto_quincenal)>parseFloat(req.body.monto_quincenal)||
        parseFloat(actualsalary[0].monto_hora)>parseFloat(req.body.monto_hora)){
          return res.status(401).json({message:'el salario debe ser mayor al actual'});
        }
      }*/
      db.query('INSERT INTO tbl_salarios (monto_mensual, id_estado, monto_quincenal,monto_hora, id_contrato,observacion) VALUES(?, 7, ?, ?,?,?)', data,
      function (error, results, fields) {
        if (error){
          res.status(401).json({message:error.sqlMessage,errno: error.errno});
          return;
        }
        res.status(200).json({message:'contrato creado.',id:results.insertId,database:results});
      });
    }else{
      
      res.status(401).json({message:'Colaborador cuenta con un salario por aprobar'});
    }
  }
];


exports.update=[
  [
    check('monto_mensual').notEmpty(),
    check('monto_quincenal').notEmpty(),
    check('monto_hora').notEmpty(),
    check('id_contrato').notEmpty().bail().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let data=[req.body.monto_mensual,
        req.body.monto_quincenal,
        req.body.monto_hora,
        parseInt(req.body.id_contrato),
        req.body.observacion,
        req.params.id];
    let salary = await query('SELECT id_salario, monto_mensual, id_contrato FROM tbl_salarios where id_salario = ? and id_estado = 6',[req.params.id]);

    if(salary.length===0){
      db.query('UPDATE tbl_salarios SET monto_mensual=?, monto_quincenal=?, monto_hora=?, id_contrato=? WHERE id_salario=?', data,
        function (error, results, fields) {
          if (error){
            res.status(401).json({message:error.sqlMessage,errno: error.errno});
            return;
          }
          res.status(200).json({message:'Contrato actualizado.',id:results.insertId,database:results});
      });
    }else{
        res.status(401).json({message:'No es posible editar este salario'});
    }
  }
];


exports.aprove=[
    [
      check('id').notEmpty().bail().isInt(),
      check('id_estado').notEmpty()
    ],
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      let salary = await query('SELECT id_salario, id_contrato FROM tbl_salarios where id_salario = ? and id_estado=7',[req.params.id]);
      if(salary.length>0){
        if (req.body.id_estado==6){
          await query('UPDATE tbl_salarios SET id_estado = 9 WHERE id_contrato = ? and id_estado= 6',[salary[0].id_contrato]);
        }

        db.query('UPDATE tbl_salarios SET id_estado=? WHERE id_salario=? ', [req.body.id_estado,req.params.id],
          function (error, results, fields) {
            if (error){
              res.status(401).json({message:error.sqlMessage,errno: error.errno});
              return;
            }
            res.status(200).json({message:'Contrato actualizado.',id:results.insertId,database:results});
        });
      }else{
        res.status(401).json({message:'No es posible editar este salario'});
      }
    }
];



