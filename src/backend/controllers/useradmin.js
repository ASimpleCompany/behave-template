const jwt = require('jsonwebtoken');
const db = require('../config/db');
//const {validateAdminiostrative, getUserId} = require('../helpers/utils')
const {insertlog} = require('../helpers/logactions');

const SHA256 = require("crypto-js/sha256");
const { check,param, validationResult } = require('express-validator');

exports.createuser=[
    [
      check('nombre').notEmpty().bail().isString({min:0}),
      check('apellido').notEmpty().bail().isString({min:0}),
      check('nombre_usuario').notEmpty().bail().isString({min:3}),
      check('estado').notEmpty().bail().isInt({min:1}),
      check('contrasena').notEmpty(),
      check('rol').notEmpty().bail().isInt({min:1})
    ],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
  
      
      let data=[
        req.body.nombre,req.body.apellido,req.body.genero,req.body.nombre_usuario,
        SHA256(req.body.contrasena).toString(),parseInt(req.body.estado),parseInt(req.body.rol)
      ];
      
      db.query('INSERT INTO tbl_usuarios_admin \
            (nombre, apellido, genero, nombre_usuario, contrasena, \
            id_estado, id_rol) VALUES(?, ?, ?, ?, ?, ?, ?)', data,
        function (error, results, fields) {
          if (error){
            res.status(401).json({message:error.sqlMessage,errno: error.errno});
            return;
          }
          res.status(200).json({message:'usuario creado.',id:results.insertId,database:results});
          insertlog('tbl_usuarios_admin','inserta',results.insertId,0);
      });

    }
  ];

 exports.usertable=(req, res, next) => {

    db.query('SELECT id, nombre, apellido, genero, fecha_creacion,\
     fecha_modificacion, nombre_usuario,  id_estado, id_rol \
     FROM tbl_usuarios_admin', 
      function (error, results, fields) {
        if (error){
          res.status(401).json({message:'error en conección a datos '+error});
          return;
        } 
        return res.status(200).json(results);
    });

  };


  exports.userstats=(req, res, next) => {

    db.query('select (select COUNT(*) from tbl_usuarios_admin) as total, \
    (select COUNT(*) from tbl_usuarios_admin where id_rol = 1) as admin, \
    (select COUNT(*) from tbl_usuarios_admin where id_rol = 2) as gestor, \
    (select COUNT(*) from tbl_usuarios_admin where id_rol = 3) as lector', 
      function (error, results, fields) {
        if (error){
          res.status(401).json({message:'error en conección a datos '+error});
          return;
        } 
        return res.status(200).json(results);
    });

  };

  exports.useractivities=(req, res, next) => {
    db.query('SELECT tabla, accion, identabla, concat(ua.nombre,\' \', ua.apellido) as usuario, \
    DATE_FORMAT(tl.fecha_creacion,"%d-%m-%Y %k:%S") as fecha_creacion  FROM tbl_logs tl \
    inner join tbl_usuarios_admin ua on ua.id=tl.id_usuario_admin order by fecha_creacion desc limit 500', 
      function (error, results, fields) {
        if (error){
          res.status(401).json({message:'error en conección a datos '+error});
          return;
        } 
        return res.status(200).json(results);
    });
  };

  exports.updateuser=[
    [
      check('nombre').notEmpty().bail().isString({min:0}),
      check('apellido').notEmpty().bail().isString({min:0}),
      check('nombre_usuario').notEmpty().bail().isString({min:3}),
      check('estado').isInt(),
      check('rol').isInt()
    ],
    (req, res, next) => {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
     
      let data=[
        req.body.nombre,req.body.apellido,req.body.nombre_usuario,
        parseInt(req.body.estado),parseInt(req.body.rol),
        parseInt(req.params.id)
      ];
      
      db.query('update tbl_usuarios_admin \
            set nombre=?, apellido=?, nombre_usuario=?, \
            id_estado=?, id_rol=? where id=?', data,
        function (error, results, fields) {
          if (error){
            res.status(401).json({message:error.sqlMessage,errno: error.errno});
            return;
          }
          res.status(200).json({message:'usuario actualizado.',id:results.insertId,database:results});
          insertlog('tbl_usuarios_admin','inserta',results.insertId,0);
      });
    }
  ];

  exports.userselect=[
    [
      check('id').notEmpty().bail().isInt({min:1})
    ],

    (req, res, next) => {
    //db.connect();
    db.query('SELECT id, nombre, apellido, genero, fecha_creacion,\
     fecha_modificacion, nombre_usuario, id_estado, id_rol \
     FROM tbl_usuarios_admin where id=?',parseInt(req.params.id), 
      function (error, results, fields) {
        if (error){
          return res.status(401).json({message:'error en conección a datos '+error});
        } 
        return res.status(200).json(results);
    });
  }]



  exports.userdelete=[
    [
      check('id').notEmpty().bail().isInt({min:1})
    ],

    (req, res, next) => {
    //db.connect();
    db.query('delete from tbl_usuarios_admin where id=?',parseInt(req.params.id), 
      function (error, results, fields) {
        if (error){
          res.status(401).json({message:'error en conección a datos '+error});
          return;
        } 
        res.status(200).json(results);
    });
    //db.end();
  }]



/* *********************************************************************************************************
 * *********************************************************************************************************
 * *********************************************************************************************************
*/


  exports.userpermisions=(req, res, next) => {
    //db.connect();
    db.query('SELECT  \
    rol.descripcion as user , \
    per.nombre_permiso, \
    modulo.descripcion as modulos \
    FROM  \
    tbl_roles rol \
    INNER JOIN tbl_permisos per ON \
    rol.id_rol = per.id_rol  \
    INNER JOIN tbl_modulos modulo ON \
    per.id_modulo = modulo.id_modulo \
    WHERE rol.id_rol = ?', parseInt(req.params.id), 
      function (error, results, fields) {
        if (error){
          res.status(401).json({message:'error en conección a datos '+error});
          return;
        } 
        let user = {
          descripcion: results[0].user,
          funcionalidades: [],
          modulos:[],
          nav:[],
          sidebars: [{
            inicio: [],
            recursohumano:[],
            planilla: [],
            administracion: [],
           },
          ],
          paths: [ 
            {  ref: 'modulos' , refnav: 'inicio' , descripcion: 'Inicio' , path: '/' , icon: 'fa fa-home'},
            {  ref: 'modulos' , refnav: 'recurso humano' , descripcion: 'recursos humanos' , path: '/employee' , icon: 'mdi mdi-account-group'},
            {  ref: 'modulos' , refnav: 'planilla'  ,descripcion: 'planillas' , path: '/payroll' , icon: 'fa fa-book'},
            {  ref: 'modulos', refnav: 'administracion' , descripcion: 'administración' , path: '/admin' , icon: 'mdi mdi-clipboard-account'},
            {  ref: 'recurso humano',  descripcion: 'inicio' , path: '/employee' , icon: 'fa fa-home'},
            {  ref: 'recurso humano' , descripcion: 'colaboradores Activos' , path: '/employee/table' , icon: 'fa fa-user' },
            {  ref: 'recurso humano' , descripcion: 'colaboradores Inactivos' , path: '/employee/table/inactive' , icon: 'fa fa-user-o' },
            {  ref: 'recurso humano' , descripcion: 'colaboradores Liquidados' , path: '/employee/table/ended' , icon: 'fa fa-user-times' },
            {  ref: 'recurso humano',  descripcion: 'horarios' , path: '/employee/schedule/table' , icon: 'fa fa-clock-o' },
            {  ref: 'recurso humano',   descripcion: 'departamentos', path: '/employee/department/table', icon:'fa fa-th-large'},
            {  ref: 'planilla',  descripcion: 'planillas', path: '/planilla'},
            {  ref: 'planilla', descripcion: 'reportes', path: '/reportes'},
            {  ref: 'planilla',  descripcion: 'descuentos', path: '/descuentos'},
            {  ref: 'planilla', descripcion: 'marcaciones', path: '/employee/schedule/table'},
            {  ref: 'administracion',  descripcion: 'inicio' , path: '/admin' , icon: 'fa fa-home'},
            {  ref: 'administracion' ,descripcion: 'usuarios', path: '/admin/table' , icon: 'mdi mdi-account-multiple' },
            {  ref: 'administracion' ,   descripcion: 'actividades', path: '/admin/activities' , icon: 'fa fa-eye'}
          ]
        }

        user.funcionalidades.push("inicio")

        results.forEach( element => { 
         
          if ( !user.funcionalidades.includes(element.nombre_permiso)) {
            user.funcionalidades.push(element.nombre_permiso)
          }
          
           user.modulos.push(element.modulos)
        });

        user.funcionalidades.forEach( element => {
         
          for (var index = 0; index < user.paths.length; index++) {
          
             if (  user.paths[index].ref == element.toString()) {
                   let val = user.paths[index].ref.replace(/\s/g, '');
                   user.sidebars[0][val].push(user.paths[index])
             }

             if (  user.paths[index].refnav == element.toString()) {
                 user.nav.push(user.paths[index]);
             }
            
          }
        });

        user.paths = []
        res.status(200).json( user);
    });
    //db.end();
  };



exports.obtaintoken = [
    [
        check('username').notEmpty().bail().isString({min:4}),
        check('password').notEmpty().bail().isString({min:4}),
    ],
    (req, res, next) => {
      
      const query = 'SELECT usu.id, usu.nombre, usu.apellido, rol.id_rol, rol.descripcion FROM tbl_usuarios_admin usu \
            INNER join tbl_roles rol on rol.id_rol = usu.id_rol \
            INNER JOIN tbl_permisos per ON rol.id_rol = per.id_rol \
            where usu.contrasena = ? and usu.nombre_usuario=  ? and id_estado = 1'
      const user = db.query( query, [SHA256(req.body.password).toString(), req.body.username ] , 
      
        function (error, results, fields) {
          if (error) {
            return res.status(401).json({message:'Credenciales no validas'+ error});
          } 
          try{
            if (results.length>0) {
              let usuario = {}      
              usuario.id          = results[0].id;
              usuario.nombre      = results[0].nombre;
              usuario.apellido    = results[0].apellido;
              usuario.id_rol      = results[0].id_rol;
              usuario.descrol     = results[0].descripcion;
              try {
                  var token = jwt.sign(usuario, process.env.JWTSECRET ,{ expiresIn: '5h' });
                  var tokenrf = jwt.sign( usuario , process.env.JWTSECRETRF,{algorithm:'HS384', expiresIn: '1d' });
                  res.status(200).json({ access: token, refresh: tokenrf  });
              }catch(err){
                  res.status(401).json({message:'Credenciales no validas '+err});
              }
            }else{
              res.status(401).json({message:'Credenciales no validas'});
            }
          }catch(e){
            res.status(401).json({message:e.message});
          }
          
         }); 
  
     // db.end();
        
    }
];
  
  
exports.refreshtoken = (req, res, next) => {
    
    if (req.body.refreshToken) {
        var refreshToken = req.body.refreshToken
        try {
            var decoded = jwt.verify(refreshToken, process.env.JWTSECRETRF);

            const query = 'SELECT usu.id, usu.nombre, usu.apellido, rol.id_rol, rol.descripcion FROM tbl_usuarios_admin usu \
                INNER join tbl_roles rol on rol.id_rol = usu.id_rol \
                INNER JOIN tbl_permisos per ON rol.id_rol = per.id_rol \
                where usu.id= ?'
            const user = db.query(query, [decoded.id] , 
        
            function (error, results, fields) {
            if (error) {
                res.status(401).json({message:'Credenciales no validas'});
            } 
            if (results.length) {
                let usuario = {}      
                usuario.id          = results[0].id;
                usuario.nombre      = results[0].nombre;
                usuario.apellido    = results[0].apellido;
                usuario.id_rol         = results[0].id_rol;
                usuario.descrol    = results[0].descripcion;
                try {
                    var token = jwt.sign(usuario, process.env.JWTSECRET ,{ expiresIn: '1h' });
                    var tokenrf = jwt.sign( usuario , process.env.JWTSECRETRF,{algorithm:'HS384', expiresIn: '1d' });
                    res.status(200).json({ access: token, refresh: tokenrf});
                }
                catch(err){
                    res.status(401).json({message:'Credenciales no validas'+err});
                }
            }else{
                res.status(401).json({message:'Credenciales no validas'});
            }
            }); 
        } catch(err) {
            res.status(401).json({message:'Token Invalido o expirado 2'});
        }
    } else {
        res.status(401).json({message:'Token Invalido o expirado 2'});
    }
  };
  
  
  exports.updatepassword=[
    [
      check('contrasena').notEmpty().isLength({ min: 8 }),
    ],
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      let data=[SHA256(req.body.contrasena).toString(), req.params.id];
      db.query('UPDATE tbl_usuarios_admin SET contrasena=? WHERE id=?', data,
        function (error, results, fields) {
          if (error){
            res.status(401).json({message:error.sqlMessage,errno: error.errno});
            return;
          } 
          res.status(200).json({message:'contraseña actualizada',id:req.params.id,database:results});
          insertlog('tbl_usuarios_admin','cambia contraseña',req.params.id,0);
      });
    }
  ];

