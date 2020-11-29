const db = require('../config/db');
const {validateAdminiostrative, getUserId} = require('../helpers/utils')
const {insertlog} = require('../helpers/logactions');
const { check,param, validationResult } = require('express-validator');


exports.table=(req, res, next) => {
  db.query('select id_departamento, descripcion from tbl_departamento', 
    function (error, results, fields) {
      if (error){
        res.status(401).json({message:'error en conección a datos '+error});
        return;
      } 
      res.status(200).json(results);
  });
};

exports.tabledepocu=[
  [
    param('id').isInt({min:1})
  ],
(req, res, next) => {
  db.query('select ocu.id_ocupacion, ocu.id_departamento, ocu.descripcion from tbl_ocupaciones ocu \
            inner join tbl_departamento dep on ocu.id_departamento= dep.id_departamento', [parseInt(req.params.id)],
    function (error, results, fields) {
      if (error){
        res.status(401).json({message:'error en conección a datos '+error});
        return;
      } 
      res.status(200).json(results);
  });
}];


exports.get=[
  [
    param('id').isInt({min:1})
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array()});
    }else{
      try{
        db.query('select id_departamento, descripcion from tbl_departamento where id_departamento = ? ', [parseInt(req.params.id)],
          function (error, results, fields) {
            if (error){
              res.status(401).json({message:'error en conección a datos '+error});
              return;
            } 
            res.status(200).json(results);
        });
      }catch(error){
        res.status(401).json({message:'error: '+error});
      }  
    }
  }
]

exports.getocupations=[
  [
    param('id').isInt({min:1})
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array()});
    }else{
      try{
        db.query('select id_ocupacion, id_departamento, descripcion from tbl_ocupaciones where id_departamento = ? ', [parseInt(req.params.id)],
          function (error, results, fields) {
            if (error){
              res.status(401).json({message:'error en conección a datos '+error});
              return;
            } 
            res.status(200).json(results);
        });
      }catch(error){
        res.status(401).json({message:'error: '+error});
      }  
    }
  }
]

exports.create=[
  [
    check('descripcion').notEmpty().bail().isString({min:4}),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let data=[req.body.descripcion];
    db.query('INSERT INTO tbl_departamento (descripcion) values (?)', data,
      function (error, results, fields) {
        if (error){
          
          res.status(401).json({message:error.sqlMessage,errno: error.errno});
          return;
        }
        res.status(200).json({message:'Departamento creado.',id:results.insertId,database:results});
        insertlog('tbl_empleados','inserta',results.insertId,0);
    });
  }
];


exports.update=[
    [
        check('descripcion').notEmpty().bail().isString({min:4}),
    ],
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).json({ errors: errors.array() });
        }
        //db.connect();
        let data=[req.body.descripcion, parseInt(req.params.id)];
        db.query('update tbl_departamento set descripcion= ? where id_departamento = ?', data,
          function (error, results, fields) {
            if (error){
              
              res.status(401).json({message:error.sqlMessage,errno: error.errno});
              return;
            }
            res.status(200).json({message:'Departamento actualizado.',id:results.insertId,database:results});
            insertlog('tbl_empleados','inserta',results.insertId,0);
        });
        //db.end();
      }
];


exports.deletedep=[
  [
    check('id').notEmpty().bail().isInt({min:1})
  ],
  (req, res, next) => {
    db.query('delete from tbl_departamento where id_departamento = ?',parseInt(req.params.id), 
      function (error, results, fields) {
        if (error){
          return res.status(401).json({message:'error en conección a datos '+error});
        } 
        return res.status(200).json(results);
    });
}];


