const db = require('../config/db');


/* TODO Mejorar query para que inculla decimos donde corresponde
**  -decimos
**  -vacaciones
*/

exports.homeStats = (req, res, next) => {
  db.query('select ifnull(sum(tr.neto_a_pagar),0) as monto from ctl_codigoplanilla cc\
  left join (select ano,tn.id_nomina,tp.neto_a_pagar,tp.id_codigoplanilla from tbl_nomina tn\
  left join tbl_planillas tp  on tn.id_nomina = tp.id_nomina \
  where ano = YEAR (now()) and id_estado = 6) tr on tr.id_codigoplanilla = cc.id_codigoplanilla \
  where cc.mes is not null  group by cc.mes order by cc.mes asc',
    function (error, results, fields) {
      if (error) {
       
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
};

exports.pendingView = (req, res, next) => {
  db.query('SELECT * FROM vw_pendientes vp',
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
};

exports.pendingstatsemployee = (req, res, next) => {
  db.query('select get_homedata(0,"TOTALDOCENTES") as totdocentes,get_homedata(0,"TOTALADMINS") as totadmins ',
    function (error, results, fields) {
      if (error) {
        return res.status(401).json({ message: 'error en conexión a datos ' + error });
      }
      return res.status(200).json(results);
    });
};