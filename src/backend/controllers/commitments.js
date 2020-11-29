const db = require('../config/db');

const {getUserId} = require('../helpers/utils');
const {insertlog} = require('../helpers/logactions');

const { check,param, validationResult } = require('express-validator');

const util = require('util');

const query = util.promisify(db.query).bind(db);

exports.table=(req, res, next) => {
  db.query('SELECT id_descuento_directo, descripcion, montototal, id_empleado, id_estado, \
  monto_letra_quincenal, fecha_creacion, fecha_modificacion, montoactual\
   FROM tbl_descuento_directo WHERE 1', 
    function (error, results, fields) {
      if (error){
        res.status(401).json({message:'error en conección a datos '+error});
        return;
      } 
      res.status(200).json(results);
  });
};

exports.tableemployee=(req, res, next) => {
    try{
        db.query('SELECT des.id_descuento_directo, es.descripcion as estado, des.descripcion, des.montototal,des.id_estado, DATE_FORMAT(des.fecha_creacion,"%d-%m-%Y") as fecha_creacion,\
        des.monto_letra_quincenal, des.montoactual, des.id_empleado,(select count(id_descuento_directo) from tbl_detalle_planilla where id_descuento_directo=des.id_descuento_directo) as cuotaspagadas\
        FROM tbl_descuento_directo des inner join tbl_catalogo_estado es on es.id_estado = des.id_estado WHERE id_empleado=?', [parseInt(req.params.id)],
          function (error, results, fields) {
            if (error){
                return res.status(401).json({message:'error en conección a datos '+error});
            } 
            return res.status(200).json(results);
        });
    }catch(e){
        return res.status(401).json({message:e});
    }
};
  

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
        //db.connect();
        db.query('SELECT id_descuento_directo, id_empleado,descripcion, montototal,id_estado, \
        monto_letra_quincenal, montoactual\
        FROM tbl_descuento_directo WHERE id_descuento_directo=?', [parseInt(req.params.id)],
          function (error, results, fields) {
            if (error){
              res.status(401).json({message:'error en conección a datos '+error});
              return;
            } 
            res.status(200).json(results);
        });
        //db.end();
      }catch(error){
        res.status(401).json({message:'error: '+error});
      }  
    }
  }
]


exports.create=[
  [
    check('descripcion').notEmpty().bail().isString({min:1,max:250}),
    check('montototal').notEmpty().isDecimal(),
    check('monto_letra_quincenal').notEmpty().isDecimal(),
    check('id_empleado').notEmpty().isInt(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let data=[
        req.body.descripcion,
        req.body.montototal,
        req.body.monto_letra_quincenal,
        req.body.montototal,
        parseInt(req.body.id_empleado),
    ];

    db.query('INSERT INTO tbl_descuento_directo(descripcion, montototal, monto_letra_quincenal, \
             montoactual,id_empleado, id_estado) VALUES (?,?,?,?,?,7)', data,
      function (error, results, fields) {
        if (error){
            return res.status(401).json({message:error.sqlMessage,errno: error.errno});
        }
        insertlog('Descuento Directo','inserta',results.insertId,getUserId(req));
        return res.status(200).json({message:'Compromiso creado.',id:results.insertId,database:results});
    });
  }
];


exports.update=[
    [
      check('id').notEmpty().bail()
    ],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      let data=[
          req.body.descripcion,
          req.body.montototal,
          req.body.monto_letra_quincenal,
          parseInt(req.body.id_empleado),
          parseInt(req.params.id)
      ];
      db.query('update tbl_descuento_directo set descripcion=?, montototal=?, monto_letra_quincenal=?, \
               id_empleado=? where id_descuento_directo=?', data,
        function (error, results, fields) {
          if (error){
            return res.status(401).json({message:error.sqlMessage,errno: error.errno});
          }
          insertlog('Descuento Directo','actualiza',results.insertId,getUserId(req));
          return res.status(200).json({message:'Compromiso Actualizado.',id:results.insertId,database:results});
      });
    }
  ];


exports.aprovecommitment=[
    [
      check('id').notEmpty(),
      check('accion').notEmpty(),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        try{
            let estado=6;
            let compromiso = await query('SELECT id_estado FROM tbl_descuento_directo where id_descuento_directo = ?', [parseInt(req.params.id)]);
           
            if(compromiso[0].id_estado===7  && req.body.accion==='true'){
                estado = 6;
            }else if(compromiso[0].id_estado===7  && req.body.accion==='false'){
                estado = 8;
            }else if(compromiso[0].id_estado===6){
                estado = 11;
            }else if(compromiso[0].id_estado===11 && req.body.accion==='true'){
                estado = 10;
            }else if(compromiso[0].id_estado===11 && req.body.accion==='false'){
                estado = 6;
            }
        
            let data=[estado, parseInt(req.params.id)];
        
            db.query('update tbl_descuento_directo set id_estado=? where id_descuento_directo=?', data,
            function (error, results, fields) {
                if (error){
                    return res.status(401).json({message:error.sqlMessage,errno: error.errno});
                }
                insertlog('Descuento Directo','actualiza estado',results.insertId,getUserId(req));
                return res.status(200).json({message:'Compromiso Actualizado.',id:results.insertId,database:results});
            });
        }catch(e){
            return res.status(401).json({message:'No actualizado'});
        }
    }
  ];

exports.deletecommitment=[
  [
    check('id').notEmpty().bail().isInt({min:1})
  ],
  (req, res, next) => {
    db.query('delete from tbl_descuento_directo where id_descuento_directo=? and id_estado = 7',parseInt(req.params.id), 
      function (error, results, fields) {
        if (error){
            return res.status(401).json({message:'error en conección a datos '+error});
        } 
        res.status(200).json({message:'Compromiso eliminado.',id:results.insertId,database:results});
    });
}];


