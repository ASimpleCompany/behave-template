const jwt = require('jsonwebtoken');

exports.validationTkMidlleware = function (req, res, next) {
  let reporte='0';
  if(req.params.id){
    reporte=req.params.id
  }
  let noauth = ['/api/v1/auth/login','/api/v1/auth/refresh']
  if(noauth.includes(req.originalUrl) || req.originalUrl.indexOf('report') >= 0) {
    next();
  }else{
    let token =''+req.headers.authorization;
    let processtk = token.replace('Bearer ','');
    try {
      jwt.verify(processtk, process.env.JWTSECRET, function(err, decoded) {
        if (err) {
          res.sendStatus(403);
        } else {
          next();
        }
       });
    } catch (err) {
      res.sendStatus(403);
    }
    
  }
}




