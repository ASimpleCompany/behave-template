
const db = require('../config/db');
const { insertlog } = require('../helpers/logactions');
const {getUserId} = require('../helpers/utils')
const { check, param, validationResult } = require('express-validator');
const util = require('util');
const query = util.promisify(db.query).bind(db);


exports.getIncapacities = (req, res, next) => {
    try {
        db.query('SELECT ti.id_estado,ti.id_incapacidad,ti.id_empleado,ti.id_contrato, ti.descripcion, get_employeedata(ti.id_empleado,\'INCAPA\') as disponibles, DATE_FORMAT(ti.fecha_incapacidad,"%d-%m-%Y") as fecha_incapacidad, DATE_FORMAT(ti.fecha_culmina,"%d-%m-%Y") as fecha_culmina,\
        ti.codigo_incapacidad,ti.cantidad_empleador,ti.cantidad_empleado,ti.ano, te.descripcion as estado FROM tbl_incapacidades ti inner join tbl_catalogo_estado te on te.id_estado=ti.id_estado   WHERE id_incapacidad = ? ', req.params.id,
            function (error, results, fields) {
                if (error) {
                    return res.status(401).json({ message: 'error en conexión db:' + error });
                }
                return res.status(200).json(results);
            });
    } catch (error) {
        return res.status(401).json({ message: 'error: ' + error });
    }
};


exports.createIncapacities =[
    [
      check('id_empleado').notEmpty().isInt(),
      check('id_contrato').notEmpty().isInt(),
      check('fecha_incapacidad').custom((value) => {
        if (value==='' || value==='Invalid date'){
          return false;  
        }else{
          return true;
        }
      }),
      check('fecha_culmina').custom((value) => {
        if (value==='' || value==='Invalid date'){
          return false;  
        }else{
          return true;
        }
      }),
      check('codigo_incapacidad').notEmpty(),
      check('descripcion').notEmpty(),
      check('id_codigoplanilla').notEmpty(),
      check('ano').notEmpty()
    ],async (req, res, next) => {

    try {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array()});
        }
        
        let { id_empleado,fecha_incapacidad,codigo_incapacidad,descripcion,
            fecha_culmina,id_contrato,id_codigoplanilla,ano} = req.body
        
        const moment = require('moment');
        const c = new Date(fecha_incapacidad);
        const d = new Date(fecha_culmina);

        let a = moment(c);
        let b = moment(d);
        let cantidaddias=b.diff(a, 'days')+1;
        
        if (cantidaddias<=0){
           return res.status(401).json({ message: 'La cantidad de días dese ser mayor a cero.' });
        }

        let incapadisponible = await query('select get_employeedata(?,\'INCAPA\') as total', [id_empleado]);
        let disponible=parseInt(incapadisponible[0].total)-cantidaddias;
        let totalemp=0;
        let totalempleador=0;

        if(disponible<=0){
            totalemp=disponible*-1;
            totalempleador=incapadisponible[0].total;
        }else{
            totalempleador=cantidaddias
        }
        
        let data = [parseInt(id_empleado),
            fecha_incapacidad,
            fecha_culmina,
            codigo_incapacidad,
            descripcion,
            parseInt(id_contrato),
            totalemp,
            totalempleador,
            id_codigoplanilla,
            ano
        ]

        db.query('INSERT INTO tbl_incapacidades (id_empleado, fecha_incapacidad, fecha_culmina, codigo_incapacidad, descripcion, \
            id_contrato, cantidad_empleado,cantidad_empleador,id_codigoplanilla,ano,id_estado) VALUES(?,?, ?, ?, ?, ?, ?,?,?,?,7)', data,
            function (error, results, fields) {
                if (error) {
                    return res.status(401).json({ message: 'error en conexión db:' + error });
                }
                return res.status(200).json(req.body);
            }
        )
    } catch (error) {
        
        return res.status(401).json({ message: 'error: ' + error })
    }
}]



exports.updateIncapacities =[
    [
      //check('id_empleado').notEmpty().isInt(),
      check('id_contrato').notEmpty().isInt(),
      check('fecha_incapacidad').custom((value) => {
        if (value==='' || value==='Invalid date'){
          return false;  
        }else{
          return true;
        }
      }),
      check('fecha_culmina').custom((value) => {
        if (value==='' || value==='Invalid date'){
          return false;  
        }else{
          return true;
        }
      }),
      check('codigo_incapacidad').notEmpty(),
      check('descripcion').notEmpty(),
      check('id_codigoplanilla').notEmpty(),
      check('ano').notEmpty()
    ],async (req, res, next) => {

    try {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array()});
        }
        
        let { id_empleado,fecha_incapacidad,codigo_incapacidad,descripcion,
            fecha_culmina,id_contrato,id_codigoplanilla,ano} = req.body
        
        const moment = require('moment');
        const c = new Date(fecha_incapacidad);
        const d = new Date(fecha_culmina);

        let a = moment(c);
        let b = moment(d);
        let cantidaddias=b.diff(a, 'days')+1;
        
        if (cantidaddias<=0){
           return res.status(401).json({ message: 'La cantidad de días dese ser mayor a cero.' });
        }

        let incapadisponible = await query('select get_employeedata(?,\'INCAPA\') as total', [id_empleado]);
        
        let disponible=parseInt(incapadisponible[0].total)-cantidaddias;
        let totalemp=0;
        let totalempleador=0;

        if(disponible<=0){
            totalemp=disponible*-1;
            totalempleador=incapadisponible[0].total;
        }else{
            totalempleador=cantidaddias
        }
        
        let data = [
            fecha_incapacidad,
            fecha_culmina,
            codigo_incapacidad,
            descripcion,
            parseInt(id_contrato),
            totalemp,
            totalempleador,
            id_codigoplanilla,
            ano,
            req.params.id
        ]

        db.query('update tbl_incapacidades set fecha_incapacidad=?, fecha_culmina=?, codigo_incapacidad=?, descripcion=?, \
            id_contrato=?, cantidad_empleado=?,cantidad_empleador=?,id_codigoplanilla=?,ano=? where id_incapacidad=? and id_estado=7', data,
            function (error, results, fields) {
                if (error) {
                    return res.status(401).json({ message: 'error en conexión db:' + error });
                }
                return res.status(200).json(req.body);
            }
        )
    } catch (error) {
        
        res.status(401).json({ message: 'error: ' + error })
    }
}]



exports.aproveincapacity=[
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
            let compromiso = await query('SELECT id_estado, id_empleado FROM tbl_incapacidades where id_incapacidad = ?', [parseInt(req.params.id)]);
            
            if(compromiso[0].id_estado===7  && req.body.accion==='true'){
                estado = 6;
                await query('call update_inca_emp(?)', [parseInt(req.params.id)]);
            }else if(compromiso[0].id_estado===7  && req.body.accion==='false'){
                estado = 8;
            }

            /*else if(compromiso[0].id_estado===6){
                estado = 11;
            }else if(compromiso[0].id_estado===11 && req.body.accion==='true'){
                estado = 10;
            }else if(compromiso[0].id_estado===11 && req.body.accion==='false'){
                estado = 6;
            }*/
            
            let data=[estado, parseInt(req.params.id)];
        
            db.query('update tbl_incapacidades set id_estado=? where id_incapacidad=?', data,
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


exports.deleteIncapacities = (req, res, next) => {
    try {
        db.query('DELETE FROM tbl_incapacidades WHERE id_incapacidad = ?', req.params.id,
            function (error, results, fields) {
                if (error) {
                    res.status(401).json({ message: 'error en conexión db:' + error })
                    return
                }
                res.status(200).json(results)
            });
    } catch (error) {
        res.status(401).json({ message: 'error: ' + error })
    }
}