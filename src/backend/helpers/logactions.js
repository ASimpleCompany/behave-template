const db = require('../config/db');

exports.insertlog=function (table,accion,id,idusuario){
      let data=[table,accion,parseInt(id),parseInt(idusuario)];
      db.query('INSERT INTO tbl_logs (tabla, accion, identabla, id_usuario_admin) VALUES(?,?,?,?)', data);
}