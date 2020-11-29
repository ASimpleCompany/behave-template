const db = require('../config/db');
const {getUserId} = require('../helpers/utils')
const {insertlog} = require('../helpers/logactions');
const { check,param, validationResult } = require('express-validator');
const util = require('util');
const query = util.promisify(db.query).bind(db);



/* TODO agregar vacaciones adelan tadas
**  - vacaciones adelantadas se cobran al finalizar contrato
**  - 
*/

exports.table=(req, res, next) => {
  db.query('SELECT id_vacaciones, concat(get_employeedata(id_empleado,\'OCUPATION\'),\' - \', get_employeedata(id_empleado,\'SALARY\')) as contrato, DATE_FORMAT(fecha_inicio,"%d-%m-%Y") as fecha_inicio, DATE_FORMAT(fecha_retorno,"%d-%m-%Y") as fecha_retorno, id_empleado,te.descripcion as estado, tv.id_estado, cantidaddias \
  FROM tbl_vacaciones tv inner join tbl_catalogo_estado te on te.id_estado=tv.id_estado order by id_vacaciones desc limit 1000', 
    function (error, results, fields) {
      if (error){
        return res.status(401).json({message:'error en conección a datos '+error});
      } 
      return res.status(200).json(results);
  });
};

exports.tableemployee=(req, res, next) => {
    try{
      db.query('SELECT id_vacaciones,concat(get_employeedata(id_empleado,\'OCUPATION\'),\' - \', get_employeedata(id_empleado,\'SALARY\')) as contrato, DATE_FORMAT(fecha_inicio,"%d-%m-%Y") as fecha_inicio, DATE_FORMAT(fecha_retorno,"%d-%m-%Y") as fecha_retorno, id_empleado,te.descripcion as estado, tv.id_estado, cantidaddias \
      ,pagado FROM tbl_vacaciones tv inner join tbl_catalogo_estado te on te.id_estado=tv.id_estado WHERE id_empleado=? order by id_vacaciones desc', [parseInt(req.params.id)],
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
        db.query('SELECT id_vacaciones,id_contrato,concat(get_employeedata(id_empleado,\'OCUPATION\'),\' - \', get_employeedata(id_empleado,\'SALARY\')) as contrato, DATE_FORMAT(fecha_inicio,"%d-%m-%Y") as fecha_inicio, DATE_FORMAT(fecha_retorno,"%d-%m-%Y") as fecha_retorno, id_empleado,te.descripcion as estado, tv.id_estado, cantidaddias \
        ,pagado FROM tbl_vacaciones tv inner join tbl_catalogo_estado te on te.id_estado=tv.id_estado WHERE id_vacaciones=?', [parseInt(req.params.id)],
          function (error, results, fields) {
            if (error){
              res.status(401).json({message:'error en conección a datos '+error});
              return;
            } 
            return res.status(200).json(results);
        });
        
      }catch(error){
        return res.status(401).json({message:'error: '+error});
      }  
    }
  }
]


exports.create=[
  [
    check('fecha_inicio').notEmpty(),
    check('fecha_retorno').notEmpty(),
    check('id_empleado').notEmpty().isInt(),
    check('id_contrato').notEmpty().isInt(),
    check('cantidaddias').notEmpty().isInt({min:1,max:30}),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let data=[
        req.body.fecha_inicio,
        req.body.fecha_retorno,
        parseInt(req.body.id_empleado),
        parseInt(req.body.cantidaddias),
        parseInt(req.body.id_contrato)
    ];

    let vacations = await query('SELECT count(id_vacaciones) as total, get_employeedata(?, \'CANTIDADVAC\') as totaldias\
    FROM tbl_vacaciones where id_contrato = ? and id_estado in (7,6)',[parseInt(req.body.id_empleado),parseInt(req.body.id_contrato)]);

    if(vacations[0].total===0 && vacations[0].totaldias>=parseInt(req.body.cantidaddias)){
      db.query('INSERT INTO tbl_vacaciones(fecha_inicio, fecha_retorno, id_empleado, cantidaddias,\
        id_estado,id_contrato) VALUES (?,?,?,?,7,?)', data,
      function (error, results, fields) {
        if (error){
            return res.status(401).json({message:error.sqlMessage,errno: error.errno});
        }
        insertlog('Vacaciones','inserta',results.insertId,getUserId(req));
        return res.status(200).json({message:'Compromiso creado.',id:results.insertId,database:results});
      });
    }else{
      return res.status(401).json({message:'Colaborador ya tiene vacaciones registradas o no cuenta con suficientes días.'});
    }
  }
];


exports.update=[
    [
      check('id').notEmpty().bail(),
      check('fecha_inicio').notEmpty(),
      check('fecha_retorno').notEmpty(),
      check('id_empleado').notEmpty().isInt(),
      check('id_contrato').notEmpty().isInt(),
      check('cantidaddias').notEmpty().isInt({min:1,max:30}),
    ],
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      let data=[
          req.body.fecha_inicio,
          req.body.fecha_retorno,
          parseInt(req.body.id_empleado),
          parseInt(req.body.cantidaddias),
          parseInt(req.body.id_contrato),
          parseInt(req.params.id)
      ];
      let vacations = await query('SELECT count(id_vacaciones) as total, get_employeedata(?, \'CANTIDADVAC\') as totaldias\
      FROM tbl_vacaciones where id_contrato = ? and id_estado in (7,6)',[parseInt(req.body.id_empleado),parseInt(req.body.id_contrato)]);

      if(vacations[0].totaldias>=parseInt(req.body.cantidaddias)){
        db.query('update tbl_vacaciones set fecha_inicio=?, fecha_retorno=?, id_empleado=?, cantidaddias=?,\
        id_contrato=? where id_vacaciones=?', data,
          function (error, results, fields) {
            if (error){
              return res.status(401).json({message:error.sqlMessage,errno: error.errno});
            }
            insertlog('Descuento Directo','actualiza',results.insertId,getUserId(req));
            return res.status(200).json({message:'Compromiso Actualizado.',id:results.insertId,database:results});
        });
      }else{
        return res.status(401).json({message:'Colaborador ya tiene vacaciones registradas o no cuenta con suficientes días.'});
      }
    }
  ];


exports.aprovevacation=[
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
            let compromiso = await query('SELECT id_estado FROM tbl_vacaciones where id_vacaciones = ?', [parseInt(req.params.id)]);
           
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
        
            db.query('update tbl_vacaciones set id_estado=? where id_vacaciones=?', data,
            async  (error, results, fields)=>{
                if (error){
                    return res.status(401).json({message:error.sqlMessage,errno: error.errno});
                }
                insertlog('Vacaciones','actualiza estado',results.insertId,getUserId(req));
                if(estado===6){
                  await query('call update_vacaciones()');
                }else if(estado===10){
                  let rs= await query('select id_empleado from tbl_vacaciones where id_vacaciones=?',[parseInt(req.params.id)]);
                  await query('update tbl_empleados set id_estado = 1 where id_empleado = ?', [rs[0].id_empleado]);
                }
                
                return res.status(200).json({message:'Vacación Actualizado.',id:results.insertId,database:results});
            });
        }catch(e){
            return res.status(401).json({message:'No actualizado'});
        }
    }
  ];

exports.deletevacation=[
  [
    check('id').notEmpty().bail().isInt({min:1})
  ],
  (req, res, next) => {
    db.query('delete from tbl_vacaciones where id_vacaciones=? and id_estado = 7',parseInt(req.params.id), 
      function (error, results, fields) {
        if (error){
            return res.status(401).json({message:'error en conección a datos '+error});
        } 
        res.status(200).json({message:'Compromiso eliminado.',id:results.insertId,database:results});
    });
}];


