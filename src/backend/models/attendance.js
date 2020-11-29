const path = require('path');
const moment = require('moment')
const excelToJson = require('convert-excel-to-json')
const db = require('../config/db')
const attendanceValidation = require('./attendanceValidation')

const util = require('util');
const query = util.promisify(db.query).bind(db);


exports.postAttendance = (filename, startDate, endDate) => {
    console.log(filename)
    main(filename, startDate, endDate)
    return
};

function main(filename, startDate, endDate) {
    db.query('SELECT id_empleado , num_colaborador  FROM tbl_empleados',
        function (err, rows, fields) {
            if (err) return

            const id_num_colaborador = rows.map(e => {
                return {
                    'id_empleado': e.id_empleado,
                    'num_colaborador': e.num_colaborador,
                }
            })
            console.log(id_num_colaborador);
            processAttendance(id_num_colaborador, filename, startDate, endDate)
        })
}

function processAttendance(id_num_colaborador, filename, startDate, endDate) {

    let colab_set = id_num_colaborador.map(e => { return e.num_colaborador })

    const filePath = path.join(__dirname, `../${filename}`);

    let data = excelToJson({
        sourceFile: filePath,
        columnToKey: {
            B: 'empleado',
            C: 'nss',
            D: 'nombre',
            E: 'hora',
            F: 'estado'
        }
    })

    let results = []
    data = data.hoja1.filter(f_filterById)

    while (data.length >= 2) {

        let num_colaborador = data[0].empleado

        if (colab_set.includes(num_colaborador)) {
            console.log(`ok`)

            let fecha_1 = f_dateConverter(data[0].hora.slice(0, 10))
            let fecha_2 = f_dateConverter(data[1].hora.slice(0, 10))
            let nombre = data[0].nombre
            let fecha_marcacion = fecha_1
            let hora_entrada = f_momentConverter(data[0].hora.slice(10), data[0].hora.slice(-4))
            let hora_salida = f_momentConverter(data[1].hora.slice(10), data[1].hora.slice(-4))
            let id_empleado = f_id_num_colaborador(id_num_colaborador, num_colaborador)

            if (fecha_1 === fecha_2) {
                results.push(f_jsonFormatter(id_empleado, num_colaborador, nombre, fecha_marcacion, hora_entrada, hora_salida))
                data.shift()
                data.shift()
            } else if (data.length >= 2 && fecha_1 !== fecha_2) {
                results.push(f_missingJsonformatter(id_empleado, num_colaborador, nombre, fecha_marcacion, hora_entrada))
                data.shift()
            }

        } else {
            console.log(`here`)
            data.shift()
        }
    }

    if (data.length > 0) {

        let num_colaborador = data[0].empleado

        if (colab_set.includes(num_colaborador)) {
            console.log(`ok`)

            let id_empleado = f_id_num_colaborador(id_num_colaborador, num_colaborador)
            let nombre = data[0].nombre
            let fecha_marcacion = f_dateConverter(data[0].hora.slice(0, 10))
            let hora_entrada = f_momentConverter(data[0].hora.slice(10), data[0].hora.slice(-4))

            results.push(f_missingJsonformatter(id_empleado, num_colaborador, nombre, fecha_marcacion, hora_entrada))
            data.shift()

        } else {
            console.log(`here`)
            data.shift()
        }
    }

    (function (arr) {
        arr.map((e) => {
            if (e.hora_salida === null) {
                query('INSERT INTO tbl_marcacion (id_empleado, num_colaborador, fecha_marcacion, hora_entrada, hora_salida) VALUES (?, ?, ?, ?, null)', [e.id_empleado, e.num_colaborador, e.fecha_marcacion, e.hora_entrada])
            } else {
                query('INSERT INTO tbl_marcacion (id_empleado, num_colaborador, fecha_marcacion, hora_entrada, hora_salida) VALUES (?, ?, ?, ?, ?)', [e.id_empleado, e.num_colaborador, e.fecha_marcacion, e.hora_entrada, e.hora_salida])
            }
        })

    })(results);

    (async (arr) => {
        await attendanceValidation.checkLateCheckIn(arr)
        await attendanceValidation.checkAttendance(startDate, endDate);
        //await attendanceValidation.checkearlyOut(arr)
        //await attendanceValidation.checkAbsence(test)
        //await attendanceValidation.checkSickDay(test)
        //await attendanceValidation.checkOvertime(arr)
        //await attendanceValidation.checkRecords(test)
    })(results);


    
}

function f_filterById(item) {
    if (Number.isInteger(item.empleado)) {
        return true
    } else if (typeof (item.empleado === 'string')) {
        return false
    }
}

function f_dateConverter(date) {
    date = date.split('/')
    date = `${date[2]}-${date[0]}-${date[1]}`
    return date
}

function f_momentConverter(time, ante_post_meridiem) {
    if (ante_post_meridiem === 'a.m.') {
        return moment(`${time}:00 AM`, "h:mm:ss A").format("HH:mm:ss")
    } else if (ante_post_meridiem === 'p.m.') {
        return moment(`${time}:00 PM`, "h:mm:ss A").format("HH:mm:ss")
    }
}

function f_jsonFormatter(id_empleado, num_colaborador, nombre, fecha_marcacion, hora_entrada, hora_salida) {
    return {
        'id_empleado': id_empleado,
        'num_colaborador': num_colaborador,
        'nombre': nombre,
        'fecha_marcacion': fecha_marcacion,
        'hora_entrada': hora_entrada,
        'hora_salida': hora_salida,
    }
}

function f_missingJsonformatter(id_empleado, num_colaborador, nombre, fecha_marcacion, hora) {
    return {
        'id_empleado': id_empleado,
        'num_colaborador': num_colaborador,
        'nombre': nombre,
        'fecha_marcacion': fecha_marcacion,
        'hora_entrada': hora,
        'hora_salida': null,
    }
}

function f_id_num_colaborador(obj, num_colaborador) {
    const id_empleado = obj[obj.findIndex((e) => e.num_colaborador === num_colaborador)].id_empleado
    return id_empleado
}