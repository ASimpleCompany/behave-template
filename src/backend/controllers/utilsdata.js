
const db = require('../config/db');
const util = require('util');


exports.toaprove = (req, res, next) => {
  db.query('select * from vw_pendientes',
    function (error, results, fields) {
      if (error) {
        res.status(401).json({ message: 'error en conección a datos ' + error });
        return;
      }
      res.status(200).json(results);
    });
}