const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
require('dotenv').config({ path: 'config/.env' })

exports.getUserId=(req)=>{
    try {
        let token =''+req.headers.authorization;
        let processtk = token.replace('Bearer ','');
        let data= jwt.verify(processtk, process.env.JWTSECRET, function(err, decoded) {
           return decoded;
        });
        return data.id;
    } catch (err) {
        return 0;
    }
}


exports.validateAdminiostrative=(req, res)=>{
    try {
        let token =''+req.headers.authorization;
        let processtk = token.replace('Bearer ','');
        let data= jwt.verify(processtk, process.env.JWTSECRET, function(err, decoded) {
           return decoded;
        });
        if(data.id_rol===1){
            return true;
        }else{
            return false;
        }
    } catch (err) {
        return false;
    }
}


exports.formValidations=(req, res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) { 
        return res.status(422).json({ errors: errors.array() });
    }
}