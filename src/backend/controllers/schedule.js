const db = require('../config/db');
const {validateAdminiostrative, getUserId} = require('../helpers/utils')
const {insertlog} = require('../helpers/logactions');

const { check,param, validationResult } = require('express-validator');

exports.table=(req, res, next) => {
  db.query('SELECT id_horario, TIME_FORMAT(hora_inicio_jornada, "%h:%i:%s %p") as hora_inicio_jornada, TIME_FORMAT(hora_fin_hornada, "%h:%i:%s %p") as hora_fin_hornada, total_horas_diarias, \
            horas_receso, descripcion, dia_lunes,dia_martes,dia_miercoles,dia_jueves,dia_viernes,dia_sabado,dia_domingo FROM tbl_horarios ', 
    function (error, results, fields) {
      if (error){
        res.status(401).json({message:'error en conección a datos '+error});
        return;
      }
      res.status(200).json(results);
  });
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
        db.query('SELECT id_horario, hora_inicio_jornada, hora_fin_hornada, total_horas_diarias, \
                horas_receso, descripcion,dia_lunes,dia_martes,dia_miercoles,dia_jueves,dia_viernes,dia_sabado,dia_domingo,\
                horain_lunes,horain_martes,horain_miercoles,horain_jueves,horain_viernes,horain_sabado,horain_domingo,\
                horafin_lunes,horafin_martes,horafin_miercoles,horafin_jueves,horafin_viernes,horafin_sabado,horafin_domingo FROM planilla.tbl_horarios \
                where id_horario = ? ', [parseInt(req.params.id)],
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


exports.getlist=(req, res, next) => {
  db.query('SELECT id_horario, descripcion, sum(dia_lunes +dia_martes + dia_miercoles +dia_jueves +dia_viernes +dia_sabado +dia_domingo ) as horas \
  FROM tbl_horarios group by id_horario, descripcion',
    function (error, results, fields) {
      if (error){
        res.status(401).json({message:'error en conección a datos '+error});
        return;
      } 
      res.status(200).json(results);
  });
}



exports.create=[
  [
    /*check('hora_inicio_jornada').notEmpty(),
    check('hora_fin_hornada').notEmpty(),
    check('total_horas_diarias').notEmpty().matches(/^\d{1,2}:\d{2}:\d{2}/,"i"),
    check('horas_receso').notEmpty().matches(/^\d{1,2}:\d{2}:\d{2}/,"i"),*/
    check('descripcion').notEmpty(),
    check('dia_lunes').notEmpty(),
    check('dia_martes').notEmpty(),
    check('dia_miercoles').notEmpty(),
    check('dia_jueves').notEmpty(),
    check('dia_viernes').notEmpty(),
    check('dia_sabado').notEmpty(),
    check('dia_domingo').notEmpty(),

    check('horain_lunes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_lunes) && value===''){return false;}else{return true;}}),
    check('horain_martes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_martes) && value===''){return false;}else{return true;}}),
    check('horain_miercoles').custom((value,meta)=>{if(parseInt(meta.req.body.dia_miercoles) && value===''){return false;}else{return true;}}),
    check('horain_jueves').custom((value,meta)=>{if(parseInt(meta.req.body.dia_jueves) && value===''){return false;}else{return true;}}),
    check('horain_viernes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_viernes) && value===''){return false;}else{return true;}}),
    check('horain_sabado').custom((value,meta)=>{if(parseInt(meta.req.body.dia_sabado) && value===''){return false;}else{return true;}}),
    check('horain_domingo').custom((value,meta)=>{if(parseInt(meta.req.body.dia_domingo) && value===''){return false;}else{return true;}}),

    check('horafin_lunes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_lunes) && value===''){return false;}else{return true;}}),
    check('horafin_martes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_martes) && value===''){return false;}else{return true;}}),
    check('horafin_miercoles').custom((value,meta)=>{if(parseInt(meta.req.body.dia_miercoles) && value===''){return false;}else{return true;}}),
    check('horafin_jueves').custom((value,meta)=>{if(parseInt(meta.req.body.dia_jueves) && value===''){return false;}else{return true;}}),
    check('horafin_viernes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_viernes) && value===''){return false;}else{return true;}}),
    check('horafin_sabado').custom((value,meta)=>{if(parseInt(meta.req.body.dia_sabado) && value===''){return false;}else{return true;}}),
    check('horafin_domingo').custom((value,meta)=>{if(parseInt(meta.req.body.dia_domingo) && value===''){return false;}else{return true;}}),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    //db.connect();


    let tothur=parseInt(req.body.dia_lunes)+
    parseInt(req.body.dia_martes)+
    parseInt(req.body.dia_miercoles)+
    parseInt(req.body.dia_jueves)+
    parseInt(req.body.dia_viernes)+
    parseInt(req.body.dia_sabado)+
    parseInt(req.body.dia_domingo);

    if(tothur===0){
      return res.status(401).json({message:'Debe ingresar al menos 1 hora a algúno de los días.'});
    }

    let data=[
      /*req.body.hora_inicio_jornada,  
      req.body.hora_fin_hornada,
      req.body.total_horas_diarias,
      req.body.horas_receso,*/
      tothur+':00',
      req.body.descripcion,
      parseInt(req.body.dia_lunes),
      parseInt(req.body.dia_martes),
      parseInt(req.body.dia_miercoles),
      parseInt(req.body.dia_jueves),
      parseInt(req.body.dia_viernes),
      parseInt(req.body.dia_sabado),
      parseInt(req.body.dia_domingo),
      req.body.horain_lunes ,
      req.body.horain_martes,
      req.body.horain_miercoles,
      req.body.horain_jueves,
      req.body.horain_viernes,
      req.body.horain_sabado,
      req.body.horain_domingo,
      req.body.horafin_lunes,
      req.body.horafin_martes,
      req.body.horafin_miercoles,
      req.body.horafin_jueves,
      req.body.horafin_viernes,
      req.body.horafin_sabado,
      req.body.horafin_domingo,
    ];
    //hora_inicio_jornada, hora_fin_hornada, total_horas_diarias, horas_receso,
    db.query('INSERT INTO tbl_horarios (total_horas_diarias, descripcion, \
      dia_lunes,dia_martes,dia_miercoles,dia_jueves,dia_viernes,dia_sabado,dia_domingo,\
      horain_lunes,horain_martes,horain_miercoles,horain_jueves,horain_viernes,horain_sabado,horain_domingo,\
      horafin_lunes,horafin_martes,horafin_miercoles,horafin_jueves,horafin_viernes,horafin_sabado,horafin_domingo)\
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', data,
      function (error, results, fields) {
        if (error){
          return res.status(401).json({message:error.sqlMessage,errno: error.errno});
        }
        res.status(200).json({message:'Horario creado.',id:results.insertId,database:results});
        //insertlog('tbl_horarios','inserta',results.insertId,0);
    });
    //db.end();
  }
];


exports.update=[
    [
      /*check('hora_inicio_jornada').notEmpty(),
      check('hora_fin_hornada').notEmpty(),
      check('total_horas_diarias').notEmpty().matches(/^\d{1,2}:\d{2}:\d{2}/,"i"),
      check('horas_receso').notEmpty().matches(/^\d{1,2}:\d{2}:\d{2}/,"i"),*/
      check('descripcion').notEmpty(),
      check('dia_lunes').notEmpty(),
      check('dia_martes').notEmpty(),
      check('dia_miercoles').notEmpty(),
      check('dia_jueves').notEmpty(),
      check('dia_viernes').notEmpty(),
      check('dia_sabado').notEmpty(),
      check('dia_domingo').notEmpty(),
      
      check('horain_lunes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_lunes)>0 && value===''){return false;}else{return true;}}),
      check('horain_martes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_martes)>0 && value===''){return false;}else{return true;}}),
      check('horain_miercoles').custom((value,meta)=>{if(parseInt(meta.req.body.dia_miercoles)>0 && value===''){return false;}else{return true;}}),
      check('horain_jueves').custom((value,meta)=>{if(parseInt(meta.req.body.dia_jueves)>0 && value===''){return false;}else{return true;}}),
      check('horain_viernes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_viernes)>0 && value===''){return false;}else{return true;}}),
      check('horain_sabado').custom((value,meta)=>{if(parseInt(meta.req.body.dia_sabado)>0 && value===''){return false;}else{return true;}}),
      check('horain_domingo').custom((value,meta)=>{if(parseInt(meta.req.body.dia_domingo)>0 && value===''){return false;}else{return true;}}),
  
      check('horafin_lunes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_lunes)>0 && value===''){return false;}else{return true;}}),
      check('horafin_martes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_martes)>0 && value===''){return false;}else{return true;}}),
      check('horafin_miercoles').custom((value,meta)=>{if(parseInt(meta.req.body.dia_miercoles)>0 && value===''){return false;}else{return true;}}),
      check('horafin_jueves').custom((value,meta)=>{if(parseInt(meta.req.body.dia_jueves)>0 && value===''){return false;}else{return true;}}),
      check('horafin_viernes').custom((value,meta)=>{if(parseInt(meta.req.body.dia_viernes)>0 && value===''){return false;}else{return true;}}),
      check('horafin_sabado').custom((value,meta)=>{if(parseInt(meta.req.body.dia_sabado)>0 && value===''){return false;}else{return true;}}),
      check('horafin_domingo').custom((value,meta)=>{if(parseInt(meta.req.body.dia_domingo)>0 && value===''){return false;}else{return true;}}),
    ],
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).json({ errors: errors.array() });
        }

        let tothur=parseInt(req.body.dia_lunes)+
        parseInt(req.body.dia_martes)+
        parseInt(req.body.dia_miercoles)+
        parseInt(req.body.dia_jueves)+
        parseInt(req.body.dia_viernes)+
        parseInt(req.body.dia_sabado)+
        parseInt(req.body.dia_domingo);
    
        let data=[
          // req.body.hora_inicio_jornada,  
          // req.body.hora_fin_hornada,
          // req.body.total_horas_diarias,
          // req.body.horas_receso,
          tothur+':00',
          req.body.descripcion,
          parseInt(req.body.dia_lunes),
          parseInt(req.body.dia_martes),
          parseInt(req.body.dia_miercoles),
          parseInt(req.body.dia_jueves),
          parseInt(req.body.dia_viernes),
          parseInt(req.body.dia_sabado),
          parseInt(req.body.dia_domingo),
          req.body.horain_lunes ,
          req.body.horain_martes,
          req.body.horain_miercoles,
          req.body.horain_jueves,
          req.body.horain_viernes,
          req.body.horain_sabado,
          req.body.horain_domingo,
          req.body.horafin_lunes,
          req.body.horafin_martes,
          req.body.horafin_miercoles,
          req.body.horafin_jueves,
          req.body.horafin_viernes,
          req.body.horafin_sabado,
          req.body.horafin_domingo,
          parseInt(req.params.id)];

          //SET hora_inicio_jornada=?, hora_fin_hornada=?, total_horas_diarias=?, horas_receso=?, \

        db.query('UPDATE tbl_horarios set total_horas_diarias=?, descripcion=?, dia_lunes=?,dia_martes=?,dia_miercoles=?, \
                  dia_jueves=?, dia_viernes=?,dia_sabado=?,dia_domingo=?, \
                  horain_lunes=?,horain_martes=?,horain_miercoles=?,horain_jueves=?,horain_viernes=?,horain_sabado=?,horain_domingo=?,\
                  horafin_lunes=?,horafin_martes=?,horafin_miercoles=?,horafin_jueves=?,horafin_viernes=?,horafin_sabado=?,horafin_domingo=?\
                  WHERE id_horario=?', data,
          function (error, results, fields) {
            if (error){
              res.status(401).json({message:error.sqlMessage,errno: error.errno});
              return;
            }
            res.status(200).json({message:'Horario actualizado.',id:results.insertId,database:results});
            //insertlog('tbl_empleados','inserta',results.insertId,0);
        });

      }
];

exports.deletehorario=[
  [
    check('id').notEmpty().bail().isInt({min:1})
  ],
  (req, res, next) => {
    db.query('DELETE FROM tbl_horarios WHERE id_horario=?',parseInt(req.params.id), 
      function (error, results, fields) {
        if (error){
          res.status(401).json({message:'error en conección a datos '+error});
          return;
        } 
        res.status(200).json({message:'Horario eliminado.',id:results.insertId,database:results});
    });
}];


