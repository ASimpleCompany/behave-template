const db = require('../config/db');
const { getUserId, validateAdminiostrative } = require('../helpers/utils')
const util = require('util');
const query = util.promisify(db.query).bind(db);


exports.inpuestosfijos = async (id_codigoplanilla, descuentofijo, empleado, id_planilla, id_nomina, extra = 0) => {
  let sqldetalle = 'INSERT INTO tbl_detalle_planilla(id_nomina,id_tipo_descuento,id_empleado,id_codigoplanilla,id_planilla,monto) VALUES (?,?,?,?,?,?)';
  //let totalplanilla=await query('select get_planilladata(?,\'CR\') as creditos',[id_planilla]);
  await query('delete from tbl_detalle_planilla where id_planilla=? and id_tipo_descuento in (2,4,11)', [id_planilla]);
  for (const descuento of descuentofijo) {
    let monto = 0;
    let datosdetalle = [];
    let operacion = descuento.operacion.replace(/{salario}/gi, empleado.salario_quin)
      .replace(/{deduccion}/gi, descuento.monto)
      .replace(/{mensula}/gi, empleado.salario_quin * 2);
    let validacion = descuento.validacion.replace(/{salario}/gi, empleado.salario_quin)
      .replace(/{mensula}/gi, empleado.salario_quin * 2)
      .replace(/{deduccion}/gi, descuento.monto);
    datosdetalle = [id_nomina, descuento.id_tipo_descuento, empleado.id_empleado, id_codigoplanilla, id_planilla];

    if (validacion === '') {
      monto = eval(operacion);
      datosdetalle.push(monto);
      await query(sqldetalle, datosdetalle);
    } else {
      if (eval(validacion)) {
        monto = eval(operacion);
        datosdetalle.push(monto);
        await query(sqldetalle, datosdetalle);
      }
    }
  }
}



exports.creadecimo = async (decimo, empleado, descuentofijo, idcodigoplanilla, id_nomina,idplanilla=0) => {
  let sqldetalle = 'INSERT INTO tbl_detalle_planilla(id_nomina,id_tipo_descuento,id_empleado,id_codigoplanilla,id_planilla,monto) VALUES (?,?,?,?,?,?)';
  /*
  * Crea Planill para colaborador
  */
  let operaciondecimo = eval(decimo[0].operacion.replace(/{mensual}/gi, empleado.mensual).replace(/{deduccion}/gi, decimo[0].monto));

  let id_planilla = idplanilla;
  if(id_planilla===0){
    let planilladata = [empleado.mensual, empleado.salario, operaciondecimo, empleado.id_empleado, id_nomina,
      idcodigoplanilla, empleado.id_contrato, empleado.hora];
    let planilla = await query('INSERT INTO tbl_planillas(total_ingresos,salario_mensual_pactado,salario_quincenal_neto, id_empleado, \
      id_nomina, id_codigoplanilla,id_contrato,salario_hora) VALUES (?,?,?,?,?,?,?,?)', planilladata);
    id_planilla = planilla.insertId;
  }
  /*
  * Insertar creditos para colaborador
  */
  let datosdetalle = [parseInt(id_nomina), 13, empleado.id_empleado, idcodigoplanilla, id_planilla, operaciondecimo];
  await query(sqldetalle, datosdetalle);

  /*
  * Insertar todos los descuentos fijos
  */
  for (const descuento of descuentofijo) {
    let monto = 0;
    let datosdetalle = [];
    if (descuento.id_tipo_descuento === 11) {
      empleado.mensual = empleado.salario
    } else {
      empleado.mensual = operaciondecimo;
    }

    let operacion = descuento.operacion.replace(/{salario}/gi, empleado.mensual)
      .replace(/{mensula}/gi, empleado.mensual)
      .replace(/{deduccion}/gi, descuento.monto);

    let validacion = descuento.validacion.replace(/{salario}/gi, empleado.mensual)
      .replace(/{mensula}/gi, empleado.mensual)
      .replace(/{deduccion}/gi, descuento.monto);
    datosdetalle = [id_nomina, descuento.id_tipo_descuento, empleado.id_empleado, idcodigoplanilla, id_planilla];
    if (validacion === '') {
      monto = eval(operacion);
      datosdetalle.push(monto);
      await query(sqldetalle, datosdetalle);
    } else {
      if (eval(validacion)) {
        monto = eval(operacion);
        if (descuento.id_tipo_descuento === 11) {
          monto = (monto * 2) / 3;
        }
        datosdetalle.push(monto);
        await query(sqldetalle, datosdetalle);
      }
    }
  }
}



/**
 * TODO 
 * Mejorar funcionalidades de pago de vacaciones
 * @param {*} empleado 
 * @param {*} descuentofijo 
 * @param {*} id_nomina 
 * @param {*} idplanilla 
 */

exports.createVacations = async (empleado, descuentofijo, id_nomina,idplanilla=0) => {

  let sqldetalle = 'INSERT INTO tbl_detalle_planilla(id_nomina,id_tipo_descuento,id_empleado,id_codigoplanilla,id_planilla,monto) VALUES (?,?,?,?,?,?)';
  let quincenainicial=0;
  /*
  * Crea Planill para colaborador
  */
  let montoacalcular = 0;
  if (empleado.cantidaddias === 30) {
    montoacalcular = empleado.salario_quin*2;
  } else if (empleado.cantidaddias === 15) {
    montoacalcular = empleado.salario_quin;
  }else{
    quincenainicial=empleado.salario_quin;
    montoacalcular = empleado.cantidaddias*((empleado.salario_quin*2)/30)
  }

  let id_planilla = idplanilla;
  empleado.salario_quin=montoacalcular;

  if(id_planilla===0){
    let planilladata = [empleado.mensual, empleado.salario_quin, empleado.id_empleado, id_nomina, 53, empleado.id_contrato, empleado.hora];
    let planilla = await query('INSERT INTO tbl_planillas(salario_mensual_pactado,salario_quincenal_neto,\
             id_empleado, id_nomina, id_codigoplanilla,id_contrato,salario_hora) VALUES (?,?,?,?,?,?,?)', planilladata);
    id_planilla = planilla.insertId;
  }

  /*start
  * Insertar creditos para colaborador
  */
  let datosdetalle = [id_nomina, 12, empleado.id_empleado, 53, id_planilla, empleado.salario_quin];
  await query(sqldetalle, datosdetalle);
  /*
   * carga vacaciones adelantadas
   */
  if(empleado.vacadelantado>0){
    datosdetalle = [id_nomina, 18, empleado.id_empleado, 53, id_planilla, empleado.vacadelantado];
    await query(sqldetalle, datosdetalle);
    montoacalcular = montoacalcular - empleado.vacadelantado;
  }

  /*
  * Insertar todos los descuentos fijos
  */
  for (const descuento of descuentofijo) {
    let monto = 0;
    let datosdetalle = [];
    //reemplaza valores para poder calcular de impuestos y deducciones
    let quincena=montoacalcular;
    if (descuento.id_tipo_descuento === 11 && empleado.cantidaddias === 30) {       
      quincena = quincena / 2;                                              //la formula de impuesto sobre la renta valida quincena
    }else if (descuento.id_tipo_descuento === 11 && (empleado.cantidaddias != 30 || empleado.cantidaddias != 15)) {       
      quincena = quincenainicial*2;                                         //calcuar la cantidad de días si son 15 o 30
    }

    let operacion = descuento.operacion.replace(/{salario}/gi, quincena)
      .replace(/{mensula}/gi, empleado.mensual)
      .replace(/{deduccion}/gi, descuento.monto);
    //reemplaza valores para validar impuestos
    let validacion = descuento.validacion.replace(/{salario}/gi, montoacalcular)
      .replace(/{mensula}/gi, empleado.mensual)
      .replace(/{deduccion}/gi, descuento.monto);
    datosdetalle = [id_nomina, descuento.id_tipo_descuento, empleado.id_empleado, 53, id_planilla];
    
    if (validacion === '') {
      monto = eval(operacion);
      datosdetalle.push(monto);
      await query(sqldetalle, datosdetalle);
    } else {
      if (eval(validacion)) {
        console.log(operacion);
        monto = eval(operacion);
        if (descuento.id_tipo_descuento === 11 && empleado.cantidaddias === 30) {       
          monto = monto*2;  
        }else if (descuento.id_tipo_descuento === 11 && (empleado.cantidaddias != 30 || empleado.cantidaddias != 15)) {       
          monto = (monto/30)*empleado.cantidaddias; // para calcular la cantidad de impuesto a pagar por día
        }
        datosdetalle.push(monto);
        await query(sqldetalle, datosdetalle);
      }
    }
  }

  /*
  * Insertar todos los descuentos directos
  */
  let directos = await query('SELECT id_descuento_directo, montototal, monto_letra_quincenal, montoactual, montoactual-monto_letra_quincenal as last FROM tbl_descuento_directo WHERE id_empleado = ? and id_estado=6', [empleado.id_empleado]);
  sqldetalle = 'INSERT INTO tbl_detalle_planilla(id_descuento_directo,id_nomina,id_tipo_descuento,id_empleado,id_codigoplanilla,id_planilla,monto) VALUES (?,?,?,?,?,?,?)';

  if (empleado.cantidaddias === 15) {
    empleado.mensual = empleado.salario_quin;
  }

  for (const directo of directos) {
    let datosdetalle = [];
    if (directo.last <= 0) {
      datosdetalle = [directo.id_descuento_directo, id_nomina, 1, empleado.id_empleado, 53, id_planilla, directo.montoactual];
    } else {
      datosdetalle = [directo.id_descuento_directo, id_nomina, 1, empleado.id_empleado, 53, id_planilla, directo.monto_letra_quincenal];
    }
    await query(sqldetalle, datosdetalle);
  }

  return [id_planilla]
}
