require('dotenv').config({ path: 'config/.env' });

const express = require('express');
const bodyParser = require('body-parser')
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
//const upload      = multer();
const fileUpload = require('express-fileupload');
const app = express();

const { validationTkMidlleware } = require('./middleware/auth');
const employee = require('./routes/employee');
const contracts = require('./routes/contract');
const salary = require('./routes/salary');
const modules       = require('./routes/home');
const auth          = require('./routes/auth');
const user          = require('./routes/users');
const departments   = require('./routes/departments');
const ocupation     = require('./routes/ocupation');
const schedule      = require('./routes/schedule');
const commitment    = require('./routes/commitments');
const attendance    = require('./routes/attendance');
const incapacities  = require('./routes/incapacities');
const vacations     = require('./routes/vacations');
const vacationsAdvance     = require('./routes/vacationsAdvance');
const payroll       = require('./routes/payroll');
const discounts     = require('./routes/discounts');
const payrolldeatil = require('./routes/payrolldetail');
const absent        = require('./routes/attendanceManual');


app.use(cors());
app.use(helmet());

//app.use(morgan('dev'));
//swagger(app);
// Dev login middleware

const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
// for parsing multipart/form-data
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(express.static('public'));

app.use(validationTkMidlleware);

//Mount routers
let defaultrout = '/api/v1/';
app.use(defaultrout + 'auth', auth);
app.use(defaultrout + 'home', modules);
app.use(defaultrout + 'employee', employee);
app.use(defaultrout + 'salary', salary);
app.use(defaultrout + 'contract', contracts);
app.use(defaultrout + 'user', user);
app.use(defaultrout + 'department', departments);
app.use(defaultrout + 'ocupation', ocupation);
app.use(defaultrout + 'schedule', schedule);
app.use(defaultrout + 'incapacities', incapacities);
app.use(defaultrout + 'commitment', commitment);
app.use(defaultrout + 'vacation', vacations);
app.use(defaultrout + 'vacationadvance', vacationsAdvance);
app.use(defaultrout + 'payroll', payroll);
app.use(defaultrout + 'absent', absent);
app.use(defaultrout + 'detailpayroll', payrolldeatil);
app.use(defaultrout + 'discounts', discounts);
app.use(defaultrout + 'upload/attendance', attendance);
app.use('/static',express.static('public'));
app.use('/static',express.static('public'));
app.listen(PORT, console.log(`Server runing in ${process.env.NODE_ENV} mode on port ${PORT}`));


module.exports = app