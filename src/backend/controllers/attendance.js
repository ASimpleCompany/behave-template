const attendance = require('../models/attendance');
const { checkAttendance } = require('../models/attendanceValidation');


exports.createAttendance = async (req, res) => {
  
    try {
        if (!req.files) {
            return res.status(500).send({ msg: "file is not found" })
        }
        else {
            //console.log(req.files)
            const myFile = req.files.file;
            let filename = `files/${myFile.name}`;
            await myFile.mv(filename, function (err) {
                if (err) {
                    console.log(err)
                    return res.status(500).send({ msg: "Error occured" });
                }
                // returing the response with file path and name
            });
           
            await attendance.postAttendance(filename ,  req.body.startDate ,  req.body.endDate )

            res.status(200).json({ 'response': 'ok' })
        }
        
    } catch (error) {
        res.status(500).json(`controllers/attendance: ${error}`)
    }
}