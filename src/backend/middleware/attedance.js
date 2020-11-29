const path = require('path');

exports.uploadFile = function (req, res, next) {

    if (req.files === null) {
        return res.status(400).json({ msg: 'Por favor Ingrese el archivo attendance' })
    } else {
        const file = req.files.file;

        file.mv(`./helpers/${file.name}`, err => {
            if (err) {
                res.status(500).send(err)
            } else {
                next();
            }
        })
    }
}


