const db = require('../config/db');
// @desc   Get all users Modules 
// @router Get /api/v1/home
// @access  Private

exports.getModulesUser = (req, res, next) => {
    //Logic to get the functionalaties
    res.status(200).json({ success: true, msg: 'Todas las funcionalidades' });
 };