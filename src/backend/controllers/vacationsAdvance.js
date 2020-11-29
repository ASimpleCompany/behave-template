const db = require('../config/db');
const {getUserId} = require('../helpers/utils')
const {insertlog} = require('../helpers/logactions');
const { check,param, validationResult } = require('express-validator');
const util = require('util');
const query = util.promisify(db.query).bind(db);



/* TODO agregar vacaciones adelan tadas
**  - vacaciones adelantadas se cobran al finalizar contrato
**  
*/



exports.table=(req, res, next) => {
  db.query('SELECT id_vacaciones, concat(get_employeedata(id_empleado,\'OCUPATION\'),\' - \', get_employeedata(id_empleado,\'SALARY\')) as contrato, DATE_FORMAT(fecha_inicio,"%d-%m-%Y") as fecha_inicio, DATE_FORMAT(fecha_retorno,"%d-%m-%Y") as fecha_retorno, \
  cobrado,id_empleado,te.descripcion as estado, tv.id_estado, cantidaddias, diashabiles, totalhoras,salarioxhora,monto_total \
  FROM tbl_vacaciones_adelanto tv inner join tbl_catalogo_estado te on te.id_estado=tv.id_estado order by id_vacaciones desc limit 1000', 
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
      ,cobrado,diashabiles,totalhoras,salarioxhora,monto_total FROM tbl_vacaciones_adelanto tv inner join tbl_catalogo_estado te on te.id_estado=tv.id_estado WHERE id_empleado=? order by id_vacaciones desc', [parseInt(req.params.id)],
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
        ,cobrado,diashabiles,totalhoras,salarioxhora,monto_total,monto_cobrado FROM tbl_vacaciones_adelanto tv inner join tbl_catalogo_estado te on te.id_estado=tv.id_estado WHERE id_vacaciones=?', [parseInt(req.params.id)],
          function (error, results, fields) {
            if (error){
              return res.status(401).json({message:'error en conección a datos '+error});
            } 
            return res.status(200).json(results);
        });
      }catch(error){
        res.status(401).json({message:'error: '+error});
      }  
    }
  }
]


exports.calculateAmount=[
  [
    check('fecha_inicio').notEmpty(),
    check('fecha_retorno').notEmpty(),
    check('id_contrato').notEmpty().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array()});
    }else{
      try{
        let datasalario= [req.body.fecha_inicio,req.body.fecha_inicio,req.body.fecha_retorno, parseInt(req.body.id_contrato)];
        let vacationssalarios = await query('select sum(horas) total_horas,count(horas) total_dias,get_employeedata(id_empleado,\'SALARYHORA\') as salario_hora, \
        sum(horas)*get_employeedata(id_empleado,\'SALARYHORA\') as monto_total, id_contrato, id_empleado \
        from (select selected_date, weekday(selected_date) as weekd, tc.id_horario, tc.id_contrato, tc.id_empleado from tbl_contratos tc, \
        (select adddate(?,t4.i*10000 + t3.i*1000 + t2.i*100 + t1.i*10 + t0.i) selected_date from \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t0, \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t1, \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t2, \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t3, \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t4 limit 60\) v \
          where selected_date between ? and ?) fechas left join vw_horassemana horario on horario.id_horario = fechas.id_horario and horario.weekd=fechas.weekd \
        where horas <> 0 and id_contrato = ? GROUP by id_contrato, id_empleado order by fechas.id_contrato, fechas.selected_date',datasalario);
        
        if(vacationssalarios.length>0){
          return res.status(200).json(vacationssalarios);
        }else{
          return res.status(200).json([]); 
        }

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
    check('cantidaddias').notEmpty().isInt({min:1,max:15}),
    check('monto_total').notEmpty().isDecimal(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    /*let vacations = await query('SELECT count(id_vacaciones) as total, get_employeedata(?, \'CANTIDADVAC\') as totaldias\
    FROM tbl_vacaciones_adelanto where id_contrato = ? and id_estado in (7,6)',[parseInt(req.body.id_empleado),parseInt(req.body.id_contrato)]);

    if(vacations[0].total===0 && vacations[0].totaldias>=parseInt(req.body.cantidaddias)){*/
      let datasalario= [req.body.fecha_inicio,req.body.fecha_inicio,req.body.fecha_retorno, parseInt(req.body.id_contrato)];
      let vacationssalarios = await query('select sum(horas) total_horas,count(horas) total_dias,get_employeedata(id_empleado,\'SALARYHORA\') as salario_hora, \
      sum(horas)*get_employeedata(id_empleado,\'SALARYHORA\') as total_pagar \
      from (select selected_date, weekday(selected_date) as weekd, tc.id_horario, tc.id_contrato, tc.id_empleado from tbl_contratos tc, \
      (select adddate(?,t4.i*10000 + t3.i*1000 + t2.i*100 + t1.i*10 + t0.i) selected_date from \
        (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t0, \
        (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t1, \
        (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t2, \
        (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t3, \
        (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t4 limit 60\) v \
        where selected_date between ? and ?) fechas left join vw_horassemana horario on horario.id_horario = fechas.id_horario and horario.weekd=fechas.weekd \
      where horas <> 0 and id_contrato = ? GROUP by id_contrato, id_empleado order by fechas.id_contrato, fechas.selected_date',datasalario);

      let data=[
        req.body.fecha_inicio,
        req.body.fecha_retorno,
        parseInt(req.body.id_empleado),
        parseInt(req.body.cantidaddias),
        parseInt(req.body.id_contrato),
        vacationssalarios[0].total_horas,
        vacationssalarios[0].salario_hora,
        vacationssalarios[0].total_dias,
        req.body.monto_total
      ];

      db.query('INSERT INTO tbl_vacaciones_adelanto(fecha_inicio, fecha_retorno, id_empleado, cantidaddias,\
        id_estado,id_contrato,totalhoras,salarioxhora,diashabiles,monto_total) VALUES (?,?,?,?,7,?,?,?,?,?)', data,
      function (error, results, fields) {
        if (error){
            return res.status(401).json({message:error.sqlMessage,errno: error.errno});
        }
        insertlog('Vacaciones Adelantadas','inserta',results.insertId,getUserId(req));
        return res.status(200).json({message:'Compromiso creado.',id:results.insertId,database:results});
      });
  /*  }else{
      return res.status(401).json({message:'Colaborador ya tiene vacaciones registradas o no cuenta con suficientes días.'});
    }*/
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

      /*let vacations = await query('SELECT count(id_vacaciones) as total, get_employeedata(?, \'CANTIDADVAC\') as totaldias\
      FROM tbl_vacaciones_adelanto where id_contrato = ? and id_estado in (7,6)',[parseInt(req.body.id_empleado),parseInt(req.body.id_contrato)]);

      if(vacations[0].totaldias>=parseInt(req.body.cantidaddias)){*/

        let datasalario= [parseInt(req.body.id_empleado),req.body.fecha_inicio,req.body.fecha_inicio,req.body.fecha_retorno, parseInt(req.body.id_contrato)];
        let vacationssalarios = await query('select sum(horas) total_horas,count(horas) total_dias,get_employeedata(id_empleado,\'SALARYHORA\') as salario_hora, \
        sum(horas)*get_employeedata(id_empleado,\'SALARYHORA\') as total_pagar, id_contrato, id_empleado \
        from (select selected_date, weekday(selected_date) as weekd, tc.id_horario, tc.id_contrato, tc.id_empleado from tbl_contratos tc, \
        (select adddate(?,t4.i*10000 + t3.i*1000 + t2.i*100 + t1.i*10 + t0.i) selected_date from \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t0, \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t1, \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t2, \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t3, \
          (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t4 limit 60\) v \
          where selected_date between ? and ?) fechas left join vw_horassemana horario on horario.id_horario = fechas.id_horario and horario.weekd=fechas.weekd \
        where horas <> 0 and id_contrato = ? GROUP by id_contrato, id_empleado order by fechas.id_contrato, fechas.selected_date',datasalario);

        let data=[
          req.body.fecha_inicio,
          req.body.fecha_retorno,
          parseInt(req.body.id_empleado),
          parseInt(req.body.cantidaddias),
          parseInt(req.body.id_contrato),
          vacationssalarios[0].total_horas,
          vacationssalarios[0].salario_hora,
          vacationssalarios[0].total_dias,
          req.body.monto_total,
          parseInt(req.params.id)
        ];

        db.query('update tbl_vacaciones_adelanto set fecha_inicio=?, fecha_retorno=?, id_empleado=?, cantidaddias=?,\
        id_contrato=?,totalhoras=?,salarioxhora=?,diashabiles=?, monto_total=? where id_vacaciones=?', data,
          function (error, results, fields) {
            if (error){
              return res.status(401).json({message:error.sqlMessage,errno: error.errno});
            }
            insertlog('Descuento Directo','actualiza',results.insertId,getUserId(req));
            return res.status(200).json({message:'Compromiso Actualizado.',id:results.insertId,database:results});
        });
      /*}else{
        return res.status(401).json({message:'Colaborador ya tiene vacaciones registradas o no cuenta con suficientes días.'});
      }*/
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
          let compromiso = await query('SELECT id_estado FROM tbl_vacaciones_adelanto where id_vacaciones = ?', [parseInt(req.params.id)]);
          
          if(compromiso[0].id_estado===7  && req.body.accion==='true'){estado = 6;}
          else if(compromiso[0].id_estado===7  && req.body.accion==='false'){estado = 8;}
          else if(compromiso[0].id_estado===6){estado = 11;}
          else if(compromiso[0].id_estado===11 && req.body.accion==='true'){estado = 10;}
          else if(compromiso[0].id_estado===11 && req.body.accion==='false'){estado = 6;}
      
          let data=[estado, parseInt(req.params.id)];
      
          db.query('update tbl_vacaciones_adelanto set id_estado=? where id_vacaciones=?', data,
          async  (error, results, fields)=>{
              if (error){
                  return res.status(401).json({message:error.sqlMessage,errno: error.errno});
              }
              insertlog('Vacaciones','actualiza estado',results.insertId,getUserId(req));
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
    db.query('delete from tbl_vacaciones_adelanto where id_vacaciones=? and id_estado = 7',parseInt(req.params.id), 
      function (error, results, fields) {
        if (error){
            return res.status(401).json({message:'error en conección a datos '+error});
        } 
        res.status(200).json({message:'Compromiso eliminado.',id:results.insertId,database:results});
    });
}];


