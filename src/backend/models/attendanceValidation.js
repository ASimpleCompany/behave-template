const moment = require('moment');
const util = require('util');
const db = require('../config/db');
const { start } = require('repl');
const { end } = require('../config/db');
const { strict } = require('assert');
const query = util.promisify(db.query).bind(db);

//** Buscar tardanzas */
exports.checkLateCheckIn = (arr) => {
    arr.map(e => {
        let { id_empleado, fecha_marcacion, hora_entrada } = e

        db.query('SELECT th.hora_inicio_jornada as hora_contrato FROM tbl_contratos tc INNER JOIN tbl_horarios th ON tc.id_horario = th.id_horario WHERE tc.id_empleado = ?', id_empleado,
            async function (err, rows, fields) {
                if (err) return

                //Scenario:
                //--ta------tb---> +oo
                let ta = moment(`'${rows[0].hora_contrato}'`, 'HH:mm:ss') //hora en contrato => ta = 08:00
                let tb = moment(`'${hora_entrada}'`, 'HH:mm:ss')          //hora en reloj    => tb = 08:11 

                if (ta.isBefore(tb)) {
                    let t = Math.abs(tb.diff(ta, 'minutes'))
                    await query('INSERT INTO tbl_validacion (fecha_marcacion , tiempo_tardanza, tipo_validacion, id_empleado ) VALUES(?,?,?,?)', [fecha_marcacion, t, 1, id_empleado])
                }
            })
    })
}


//** Buscar salidas tempranas */
exports.checkearlyOut = (arr) => {
    arr.map(e => {
        let { id_empleado, fecha_marcacion, hora_salida } = e

        db.query('SELECT th.hora_fin_hornada as hora_contrato FROM tbl_contratos tc INNER JOIN tbl_horarios th ON tc.id_horario = th.id_horario WHERE tc.id_empleado = ?', id_empleado,
            async function (err, rows, fields) {
                if (err) return

                //Scenario:
                //--tb------ta---> +oo  
                let ta = moment(`'${rows[0].hora_contrato}'`, 'HH:mm:ss') //hora en contrato => ta = 16:00
                let tb = moment(`'${hora_salida}'`, 'HH:mm:ss')           //hora en reloj    => tb = 15:45

                if (ta.isAfter(tb)) {
                    let t = Math.abs(tb.diff(ta, 'minutes'))
                    await query('INSERT INTO tbl_validacion (fecha_marcacion , tiempo_salida_temprana, tipo_validacion, id_empleado ) VALUES(?,?,?,?)', [fecha_marcacion, t, 2, id_empleado])
                }
            })
    })
}


//** Buscar ausencias */
exports.checkAttendance = async ( starDate, endDate ) => {
    var start = moment("2020-01-10", "YYYY-MM-DD");
    var end = moment("2020-02-15", "YYYY-MM-DD");

    let ausencias = await query("SELECT ausencia.fecha , ausencia.id_empleado \
                                FROM ( \
                                select selected_date as fecha   , fechas.id_empleado , fecha_marcacion from (select selected_date, weekday(selected_date) as weekd, te.id_empleado from tbl_empleados te, \
                                (select adddate('2020-01-01',t4.i*10000 + t3.i*1000 + t2.i*100 + t1.i*10 + t0.i) selected_date from \
                                (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t0, \
                                (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t1, \
                                (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t2, \
                                (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t3, \
                                (select 0 i union select 1 union select 2 union select 3 union select 4 union select 5 union select 6 union select 7 union select 8 union select 9) t4) v \
                                where selected_date between '2020-01-15' and '2020-01-30') fechas \
                                left join tbl_marcacion tm on fechas.id_empleado=tm.id_empleado and fechas.selected_date= tm.fecha_marcacion \
                                left join ( SELECT dia_lunes as horas,0 as weekd, tc.id_empleado FROM tbl_horarios th inner join tbl_contratos tc on th.id_horario = tc.id_horario WHERE tc.id_estado=6 union all \
                                SELECT dia_martes as horas,	1 as weekd, tc.id_empleado FROM tbl_horarios th inner join tbl_contratos tc on th.id_horario = tc.id_horario WHERE tc.id_estado=6 union all \
                                SELECT dia_miercoles as horas,2 as weekd,tc.id_empleado FROM tbl_horarios th inner join tbl_contratos tc on th.id_horario = tc.id_horario WHERE tc.id_estado=6 union all \
                                SELECT dia_jueves as horas,	3 as weekd, tc.id_empleado FROM tbl_horarios th inner join tbl_contratos tc on th.id_horario = tc.id_horario WHERE tc.id_estado=6 union all \
                                SELECT dia_viernes as horas,4 as weekd, tc.id_empleado FROM tbl_horarios th inner join tbl_contratos tc on th.id_horario = tc.id_horario WHERE tc.id_estado=6 union all \
                                SELECT dia_sabado as horas,	5 as weekd, tc.id_empleado FROM tbl_horarios th inner join tbl_contratos tc on th.id_horario = tc.id_horario WHERE tc.id_estado=6 union all \
                                SELECT dia_domingo as horas,6 as weekd, tc.id_empleado FROM tbl_horarios th inner join tbl_contratos tc on th.id_horario = tc.id_horario WHERE tc.id_estado=6) \
                                horario on fechas.id_empleado=horario.id_empleado and horario.weekd=fechas.weekd \
                                WHERE horas > 0 \
                                order by fechas.id_empleado, fechas.selected_date ) ausencia \
                                WHERE  ausencia.fecha_marcacion is null ")
    
    if ( ausencias.length > 0) {
            for (const ausencia of ausencias) {
            const aus = await query(" INSERT INTO planilla.tbl_validacion \
                             (fecha_marcacion,  es_ausente, fecha_creacion,  id_empleado,  tipo_validacion)\
                                VALUES( ?,   1, CURRENT_TIMESTAMP,  ? , 3 )", [ausencia.fecha , ausencia.id_empleado ])
            
          }

        }

};


   
  
  
//** Buscar dia de incapacidad */
exports.checkSickDay = (arr) => {

}

//** Buscar sobretiempo */
exports.checkOvertime = (arr) => {
    arr.map(e => {
        let { id_empleado, fecha_marcacion, hora_salida } = e

        db.query('SELECT th.hora_fin_hornada as hora_contrato FROM tbl_contratos tc INNER JOIN tbl_horarios th ON tc.id_horario = th.id_horario WHERE tc.id_empleado = ?', id_empleado,
            async function (err, rows, fields) {
                if (err) return

                //Scenario:
                //--ta------tb + 60 ---> +oo
                let ta = moment(`'${rows[0].hora_contrato}'`, 'HH:mm:ss') //hora en contrato => hc => ta = 16:00
                let tb = moment(`'${hora_salida}'`, 'HH:mm:ss')           //hora en reloj    => hr => tb = 16:15

                if (ta.isBefore(tb)) {
                    let t = Math.abs(tb.diff(ta, 'minutes'))

                    //? if overtime is beyond 60 minutes, then:
                    if (t > 0) {
                        await query('INSERT INTO tbl_validacion (fecha_marcacion, tiempo_sobretiempo, id_empleado, tipo_validacion ) VALUES(?,?,?,?)', [fecha_marcacion, t, id_empleado, 4])
                    }
                }
            })
    })
}


//** Buscar cantidad de marcaciones */
exports.checkRecords = (arr) => {

}