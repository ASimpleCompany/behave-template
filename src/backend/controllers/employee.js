const db = require('../config/db');

const { formValidations, getUserId } = require('../helpers/utils')
const { insertlog } = require('../helpers/logactions');
const util = require('util');
const query = util.promisify(db.query).bind(db);
const { check, param, validationResult } = require('express-validator');


/*TODO:
  dividir los colaboradores por estados en el menu para evitar confuciones
*/


exports.employeestats = (req, res, next) => {
  db.query('SELECT get_employeedata(0,\'TOTEMPLO\') as totalemp, \
  get_employeedata(0,\'TOTCONTRATOS\') as totalcontra,\
  get_employeedata(0,\'TOTSALARIO\') as salariotot, \
  get_employeedata(0,\'TOTDEPTOS\') as totdeptos, \
  get_employeedata(0,\'TOTHORARIOS\') as tothorarios',
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
};


exports.employeestable = (req, res, next) => {
  db.query('SELECT em.id_empleado, em.num_colaborador, em.nombre, em.apellido, em.genero, em.cedula, \
  em.seguro_social, em.correo, em.fecha_creacion,em.id_estado, \
  es.descripcion as estado, get_employeedata(em.id_empleado,\'DEPARTAMENT\')  as departamento, em.fecha_nacimiento, \
  em.telefono, em.acumulado_total_salario_devengado, em.apellido_casada FROM tbl_empleados em \
  INNER JOIN tbl_catalogo_estado es on em.id_estado = es.id_estado \
  where em.id_estado = 1 and get_employeedata(em.id_empleado,\'DEPARTAMENT\') not in ("2") order by departamento desc,em.id_estado,  em.nombre',
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
};



exports.employeestableinactive = (req, res, next) => {
  db.query('SELECT em.id_empleado, em.num_colaborador, em.nombre, em.apellido, em.genero, em.cedula, \
  em.seguro_social, em.correo, em.fecha_creacion,em.id_estado, \
  es.descripcion as estado, get_employeedata(em.id_empleado,\'DEPARTAMENT\')  as departamento, em.fecha_nacimiento, \
  em.telefono, em.acumulado_total_salario_devengado, em.apellido_casada FROM tbl_empleados em \
  INNER JOIN tbl_catalogo_estado es on em.id_estado = es.id_estado \
  where em.id_estado in (2,3,4,6,13) and get_employeedata(em.id_empleado,\'DEPARTAMENT\') not in (2) order by departamento desc,em.id_estado,  em.nombre',
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
};


exports.employeestableended = (req, res, next) => {
  db.query('SELECT em.id_empleado, em.num_colaborador, em.nombre, em.apellido, em.genero, em.cedula, \
  em.seguro_social, em.correo, em.fecha_creacion,em.id_estado, \
  es.descripcion as estado, get_employeedata(em.id_empleado,\'DEPARTAMENT\')  as departamento, em.fecha_nacimiento, \
  em.telefono, em.acumulado_total_salario_devengado, em.apellido_casada FROM tbl_empleados em \
  INNER JOIN tbl_catalogo_estado es on em.id_estado = es.id_estado \
  where em.id_estado not in (1,3,4,6,13) and get_employeedata(em.id_empleado,\'DEPARTAMENT\') in (2) order by departamento desc,em.id_estado,em.nombre',
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
};


exports.employeecontracts = [
  [
    param('id').isInt({ min: 1 })
  ], (req, res, next) => {
    formValidations(req, res);
    let sql = 'SELECT con.id_contrato, DATE_FORMAT(con.fecha_creacion,"%d-%m-%Y") as fecha_creacion, DATE_FORMAT(con.fecha_inicio_labores,"%d-%m-%Y") as fecha_inicio_labores,\
    DATE_FORMAT(con.fecha_fin_labores,"%d-%m-%Y") as fecha_fin_labores, es.descripcion as estado,con.id_estado, th.descripcion as horario, \
    con.id_empleado,tc.descripcion as tipocontrato, con.id_tipocontrato, hora_semana as horas, \
    (SELECT a.monto_mensual FROM tbl_salarios a  where a.id_salario = (select max(b.id_salario) from tbl_salarios b where b.id_contrato =con.id_contrato)) as salary,con.incapacidades \
    FROM tbl_contratos con inner join ctl_tipocontrato tc on tc.id_tipocontrato = con.id_tipocontrato \
    inner join tbl_catalogo_estado es on es.id_estado= con.id_estado \
    inner join tbl_horarios th on th.id_horario = con.id_horario \
    where con.id_empleado=? order by con.id_contrato desc';
    db.query(sql, [req.params.id],
      function (error, results, fields) {
        if (error) {
          return res.status(401).json({ message: 'error en conexión a datos ' + error });
        }
        return res.status(200).json(results);
      });
  }];


exports.employeincapacidades = [
  [
    param('id').isInt({ min: 1 })
  ], (req, res, next) => {
    formValidations(req, res);
    db.query('select ti.id_incapacidad,DATE_FORMAT(fecha_culmina,"%d-%m-%Y") as fecha_culmina,DATE_FORMAT(fecha_creacion,"%d-%m-%Y") as fecha_creacion,id_empleado,\
        DATE_FORMAT(ti.fecha_incapacidad,"%d-%m-%Y") as fecha_incapacidad,ti.codigo_incapacidad,ti.descripcion, ano, ti.id_estado, te.descripcion as estado  from tbl_incapacidades ti inner join tbl_catalogo_estado te on te.id_estado=ti.id_estado where id_empleado = ? order by id_incapacidad desc', [req.params.id],
      function (error, results, fields) {
        if (error) {
          return res.status(401).json({ message: 'error en conexión a datos ' + error });
        }
        return res.status(200).json(results);
      });
  }];


exports.employeecontratlist = [
  [
    param('id').isInt({ min: 1 })
  ], (req, res, next) => {
    formValidations(req, res);
    db.query('select concat(get_employeedata(id_empleado,\'OCUPATION\'),\' - \', get_employeedata(id_empleado,\'SALARY\')) as descripcion, id_contrato from tbl_contratos where id_estado in(6,11) and id_empleado=?', [req.params.id],
      function (error, results, fields) {
        if (error) {
          return res.status(401).json({ message: 'error en conexión a datos ' + error });
        }
        return res.status(200).json(results);
      });
  }];


exports.employeediscounts = [
  [
    param('id').isInt({ min: 1 })
  ], (req, res, next) => {
    formValidations(req, res);
    db.query('SELECT con.id_contrato, con.fecha_creacion, con.fecha_inicio_labores,\
    con.fecha_fin_labores, con.id_empleado, con.id_tipocontrato, tc.descripcion \
    FROM tbl_contratos con inner join ctl_tipocontrato tc on tc.id_tipocontrato = con.id_tipocontrato \
    where con.id_empleado=?', [req.params.id],
      function (error, results, fields) {
        if (error) {
          res.status(401).json({ message: 'error en conexión a datos ' + error });
          return;
        }
        res.status(200).json(results);
      });
  }];


exports.employeeactiveContract = [
  [
    param('id').isInt({ min: 1 })
  ], (req, res, next) => {
    formValidations(req, res);
    db.query('SELECT count(con.id_contrato) as total FROM tbl_contratos con where con.id_empleado=? and id_estado in (6,7)', [req.params.id],
      function (error, results, fields) {
        if (error) {
          res.status(401).json({ message: 'error en conexión a datos ' + error });
          return;
        }
        return res.status(200).json(results);
      });
  }];


exports.getemployee = [
  [
    param('id').isInt({ min: 1 })
  ],
  (req, res, next) => {
    formValidations(req, res);
    try {
      let sql = 'SELECT em.id_empleado,em.id_estado, em.num_colaborador, em.nombre, em.apellido, em.genero, em.cedula, em.seguro_social, em.correo, em.fecha_creacion, \
        es.descripcion as estado, concat(get_employeedata(em.id_empleado, \'CANTIDADVAC\'),\' Días\') as vacaciones, \
        get_employeedata(em.id_empleado,\'OCUPATION\') as ocupacion,get_employeedata(em.id_empleado,\'DEPARTAMENT\')  as departamento ,\
        concat(get_employeedata(em.id_empleado,\'VACADELANDATAS\'),\' Días\') as vacadelantadas, DATE_FORMAT(em.fecha_nacimiento,"%d-%m-%Y") as fecha_nacimiento, \
        em.telefono, em.acumulado_total_salario_devengado, em.apellido_casada, get_employeedata(em.id_empleado, \'ANTIGUE\') as antiguedad,\
        get_employeedata(em.id_empleado, \'SALARY\') as salario, get_employeedata(em.id_empleado, \'TIPOCON\') as tipocon, \
        CAST(get_employeedata(em.id_empleado, \'INCAPA\') as UNSIGNED) as incapacidades \
        FROM tbl_empleados em INNER JOIN tbl_catalogo_estado es on em.id_estado = es.id_estado \
        where em.id_empleado = ?';
      db.query(sql, [req.params.id],
        function (error, results, fields) {
          if (error) {
            return res.status(401).json({ message: 'error en conexión a datos ' + error });
          }
          return res.status(200).json(results);
        });
    } catch (error) {
      res.status(401).json({ message: 'error: ' + error });
    }

  }
]

exports.getemployeesalary = [
  [
    param('id').isInt({ min: 1 })
  ], (req, res, next) => {
    db.query('SELECT get_employeedata(?,\'SALARYHORA\') as salariohora, get_employeedata(?,\'SALARYQUIN\') as salarioquin, get_employeedata(?,\'SALARY\') as  salariomen',
      [req.params.id, req.params.id, req.params.id],
      function (error, results, fields) {
        if (error) {
          res.status(401).json({ message: 'error en conexión a datos ' + error });
          return;
        }
        res.status(200).json(results);
      });
  }];



exports.createemployee = [
  [
    check('num_colaborador').notEmpty().bail().isInt({ min: 0 }),
    check('nombre').notEmpty().bail().isString({ min: 0 }),
    check('apellido_casada').isString({ min: 0 }),
    check('apellido').notEmpty().bail().isString({ min: 0 }),
    check('cedula').notEmpty().bail().isString({ min: 3 }),
    check('seguro_social').notEmpty().bail().isString({ min: 3 }),
    check('correo').notEmpty().bail().isString({ min: 6 }).bail().isEmail(),
    check('estado').notEmpty().bail().isInt({ min: 1 }),
    check('genero').notEmpty().bail().isString({ min: 1, max: 1 }),
    check('fecha_nacimiento').custom((value) => {
      if (value === '' || value === 'Invalid date') {
        return false;
      } else {
        return true;
      }
    }),
    check('telefono').notEmpty().bail().isString({ min: 1, max: 1 }),
  ],
  (req, res, next) => {
    formValidations(req, res);
    //db.connect();
    let data = [
      parseInt(req.body.num_colaborador), req.body.nombre, req.body.apellido_casada,
      req.body.apellido, req.body.cedula, req.body.seguro_social, req.body.correo,
      parseInt(req.body.estado), req.body.genero,
      req.body.fecha_nacimiento, req.body.telefono
    ];

    db.query('INSERT INTO tbl_empleados\
      (num_colaborador, nombre, apellido_casada, apellido, cedula, seguro_social,\
        correo, id_estado,genero,fecha_nacimiento,telefono,acumulado_total_salario_devengado)\
      VALUES (?,?,?,?,?,?,?,?,?,?,?,0)', data,
      function (error, results, fields) {
        if (error) {
          res.status(401).json({ message: error.sqlMessage, errno: error.errno });
          return;
        }
        res.status(200).json({ message: 'usuario creado.', id: results.insertId, database: results });
        insertlog('tbl_empleados', 'inserta', results.insertId, 0);
      });
  }
];


exports.createemployeecomplete = [
  [
    check('num_colaborador').notEmpty().isInt({ min: 0 }),
    check('nombre').notEmpty().bail().isString({ min: 0 }),
    check('apellido_casada').isString({ min: 0 }),
    check('apellido').notEmpty().bail().isString({ min: 0 }),
    check('cedula').notEmpty().bail().isString({ min: 3 }),
    check('seguro_social').notEmpty().bail().isString({ min: 3 }),
    check('correo').notEmpty().bail().isString({ min: 6 }).bail().isEmail(),
    check('estado').notEmpty().bail().isInt({ min: 1 }),
    check('ocupacion').notEmpty().bail().isInt({ min: 1 }),
    check('genero').notEmpty().bail().isString({ min: 1, max: 1 }),
    check('telefono').notEmpty().bail().isString({ min: 1, max: 1 }),
    check('departamento').notEmpty().bail().isInt({ min: 1 }),
    check('fecha_nacimiento').custom((value) => {
      if (value === '' || value === 'Invalid date') {
        return false;
      } else {
        return true;
      }
    }),

    check('fecha_inicio_labores').custom((value) => {

      if (value === '' || value === 'Invalid date') {
        return false;
      } else {
        return true;
      }
    }),

    check('fecha_fin_labores').custom((value, { req }) => {
      if (req.body.id_tipocontrato == 9 && (value === '' || value === 'Invalid date')) {
        return false;
      } else {
        return true;
      }
    }),

    check('id_tipocontrato').notEmpty().bail().isInt(),
    check('id_horario').notEmpty().bail().isInt(),
    check('monto_mensual').notEmpty().isDecimal({ min: 50 }),
    check('monto_quincenal').notEmpty().isDecimal({ min: 50 }),
    check('monto_hora').notEmpty().isDecimal({ min: 50 }),
  ],
  async (req, res, next) => {
    formValidations(req, res);

    let dataemployee = [
      parseInt(req.body.num_colaborador), req.body.nombre, req.body.apellido_casada,
      req.body.apellido, req.body.cedula, req.body.seguro_social, req.body.correo,
      parseInt(req.body.estado), req.body.genero,
      req.body.fecha_nacimiento, req.body.telefono,
    ];

    try {

      let data = await query('select count(num_colaborador) as total from tbl_empleados where num_colaborador=?', parseInt(req.body.num_colaborador));
      if (data[0].total > 0) {
        return res.status(401).json({ message: 'Número de colaborador ya existe' });
      }

      let employeers = await query('INSERT INTO tbl_empleados (num_colaborador, nombre, apellido_casada, apellido, cedula, seguro_social,\
        correo, id_estado,genero,fecha_nacimiento,telefono,acumulado_total_salario_devengado)\
        VALUES (?,?,?,?,?,?,?,?,?,?,?,0)', dataemployee);

      let sql = 'INSERT INTO tbl_contratos (fecha_inicio_labores,fecha_fin_labores, id_empleado, id_tipocontrato, id_horario,id_ocupacion,id_departamento) \
                VALUES(?, ?, ?, ?, ?,?,?)'
      let datacontract = [req.body.fecha_inicio_labores, req.body.fecha_fin_labores, employeers.insertId, parseInt(req.body.id_tipocontrato),
      parseInt(req.body.id_horario), parseInt(req.body.ocupacion), parseInt(req.body.departamento)];

      if (req.body.fecha_fin_labores == '') {
        sql = 'INSERT INTO tbl_contratos (fecha_inicio_labores, id_empleado, id_tipocontrato, id_horario,id_ocupacion,id_departamento) \
                VALUES(?, ?, ?, ?,?,?)';
        datacontract = [req.body.fecha_inicio_labores, employeers.insertId, parseInt(req.body.id_tipocontrato),
        parseInt(req.body.id_horario), parseInt(req.body.ocupacion), parseInt(req.body.departamento)];
      }
      let contratrs = await query(sql, datacontract);

      let datasalary = [req.body.monto_mensual, req.body.monto_quincenal, contratrs.insertId, req.body.monto_hora];
      await query('INSERT INTO tbl_salarios (monto_mensual, id_estado, monto_quincenal, id_contrato, monto_hora) VALUES(?, 7, ?, ?,?)', datasalary);

      return res.status(200).json({ message: 'Empleado creado.', id: employeers.insertId, database: employeers });

    } catch (e) {
      return res.status(401).json({ message: e.sqlMessage, errno: e.errno });

    }
  }
];


exports.updateemployee = [
  [
    check('num_colaborador').notEmpty().bail().isInt({ min: 0 }),
    check('nombre').notEmpty().bail().isString({ min: 0 }),
    check('apellido_casada').isString({ min: 0 }),
    check('apellido').notEmpty().bail().isString({ min: 0 }),
    check('cedula').notEmpty().bail().isString({ min: 3 }),
    check('seguro_social').notEmpty().bail().isString({ min: 3 }),
    check('correo').notEmpty().bail().isString({ min: 6 }).bail().isEmail(),
    check('id_estado').notEmpty().bail().isInt({ min: 1 }),
    check('genero').notEmpty().bail().isString({ min: 1, max: 1 }),
    check('fecha_nacimiento').custom((value) => {
      if (value === '' || value === 'Invalid date') {
        return false;
      } else {
        return true;
      }
    }),
    check('telefono').notEmpty().bail().isString({ min: 1, max: 1 })
  ],
  (req, res, next) => {
    formValidations(req, res);
    //db.connect();
    let data = [
      parseInt(req.body.num_colaborador), req.body.nombre, req.body.apellido_casada,
      req.body.apellido, req.body.cedula, req.body.seguro_social, req.body.correo,
      parseInt(req.body.id_estado), req.body.genero,
      req.body.fecha_nacimiento, req.body.telefono, req.params.id
    ];

    db.query('update tbl_empleados set \
      num_colaborador=?, nombre=?,apellido_casada=?, apellido=?, cedula=?, seguro_social=?,correo=?,\
      id_estado=?,genero=?,fecha_nacimiento=?,telefono=? \
      where id_empleado=?', data,

      function (error, results, fields) {
        if (error) {
          res.status(401).json({ message: error.sqlMessage, errno: error.errno });
          return;
        }
        res.status(200).json({ message: 'usuario actualizado', id: req.params.id, database: results });
        insertlog('tbl_empleados', 'actualiza', req.params.id, 0);
      });
  }
];


/* *********************************************************************************************************
 * *********************************************************************************************************
 * *********************************************************************************************************
*/

exports.obtaintoken = (req, res, next) => {
  if (req.body.username && req.body.password) {
    const query = 'SELECT  usuario.id , usuario.num_colaborador , usuario.nombre , usuario.apellido , roles.descripcion  FROM tbl_usuarios_admin  as usuario  INNER JOIN tbl_roles as roles ON usuario.id_rol = roles.id_rol WHERE nombre_usuario = ? and contrasena = ?'
    db.query(query, [req.body.username, req.body.password],

      function (error, results, fields) {

        if (error) {

          res.status(401).json({ message: 'Credenciales no validas' });
        }

        if (results[0]) {
          let usuario = {
            id: results[0].id,
            user_num: results[0].num_colaborador,
            user_nombre: results[0].nombre,
            user_apellido: results[0].apellido,
            roles: results[0].descripcion
          }

          try {
            var token = jwt.sign(usuario, process.env.JWTSECRET, { expiresIn: '1h' });
            var tokenrf = jwt.sign(usuario, process.env.JWTSECRETRF, { algorithm: 'HS384', expiresIn: '1d' });

            res.status(200).json({ access: token, refresh: tokenrf });

          }
          catch (err) {
            res.status(401).json({ message: 'Credenciales no validas' });
          }
          //password:  SHA256(req.body.password).toString()
        }
        else {
          res.status(401).json({ message: 'Credenciales no validas' });
        }
      });
  }
};


exports.employeedelete = [
  [
    check('id').notEmpty().bail().isInt({ min: 1 })
  ],
  (req, res, next) => {
    db.query('update tbl_empleados set id_estado=5 where id_empleado=?', parseInt(req.params.id),
      function (error, results, fields) {
        if (error) {
          res.status(401).json({ message: 'error en conexión a datos ' + error });
          return;
        }
        res.status(200).json(results);
      });

  }]


