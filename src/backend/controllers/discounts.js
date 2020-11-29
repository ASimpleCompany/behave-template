const db = require('../config/db');
const {getUserId} = require('../helpers/utils');
const {insertlog} = require('../helpers/logactions');
const { check,param, validationResult } = require('express-validator');
const util = require('util');
const query = util.promisify(db.query).bind(db);

exports.tablefixeddiscounts=(req, res, next) => {
  db.query('select descripcion_deduccion, tdf.monto, concat(ctd.descripcion,\'-\', tce.descripcion) as descripcion, tdf.operacion,\
   tdf.validacion from tbl_descuento_fijos tdf \
   inner join tbl_catalogo_estado tce on tce.id_estado=tdf.id_estado \
   inner join ctl_tipo_descuentopago ctd on tdf.id_tipo_descuento = ctd.id_tipo_descuento ',
    function (error, results, fields) {
      if (error){
        res.status(401).json({message:'error en conección a datos '+error});
        return;
      } 
      res.status(200).json(results);
  });
};
