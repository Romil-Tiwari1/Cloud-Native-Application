require('dotenv').config({ path: '/etc/webapp.env', override: true });
const logToApplication = require('./logger/log');
// Imports
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');
const StatsD = require('hot-shots');
const express = require('express');
const assignmentController = require('./controller/assignmentController');
const healthzController = require('./health/healthzController');
const authController = require('./auth/auth');
const { initializeDatabase } = require('./database/database');
const { csvLoader } = require('./utils/csvUtils');
const { checkNoPayload } = require('./health/healthzController');
let server;

// Initialize Express Application
const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
    res.send('Welcome to the Web Application');
});

// Create a write stream for logging in append mode
const logDirectory = process.env.NODE_ENV === 'test' ? path.join(__dirname, 'logs') : '/var/log/webapp';

const accessLogPath = path.join(logDirectory, 'access.log');

// Check if the log directory exists, if not create it
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Check if the access log file exists, if not create it
try {
    fs.accessSync(accessLogPath, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
    fs.closeSync(fs.openSync(accessLogPath, 'w'));
}

const accessLogStream = fs.createWriteStream(accessLogPath, { flags: 'a' });

// Setup morgan to log all requests to access.log
app.use(morgan('combined', { stream: accessLogStream }));

// StatsD client for sending metrics
const statsd = new StatsD();

// Middleware to parse incoming JSON bodies
app.use(express.json());

// Increment a StatsD metric for each API call
app.use((req, res, next) => {
    statsd.increment('api_call', 1, [`method:${req.method}`, `path:${req.path}`]);
    next();
});


app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        const contentType = req.headers['content-type'];
        if (contentType !== 'application/json') {
            return res.status(400).json({ error: 'Content-Type should be application/json' });
        }
    }
    next();
});

// API Health Check
app.all('/healthz', checkNoPayload, healthzController.checkMethod);
app.get('/healthz', checkNoPayload, healthzController.checkDatabase);

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ error: "Malformed JSON" });
    }
    next();
});

// Login User
app.post('/login', authController.login);

// Middleware to authenticate the user
app.use('/v1/assignments', authController.authenticateUser);

// Routes
app.get('/v1/assignments', authController.authenticateUser, assignmentController.getAllAssignments);
app.get('/v1/assignments/:id', authController.authenticateUser, assignmentController.getAssignmentDetails);
app.post('/v1/assignments', authController.authenticateUser, assignmentController.createAssignment);
app.put('/v1/assignments/:id', authController.authenticateUser, assignmentController.updateAssignment);
app.delete('/v1/assignments/:id', authController.authenticateUser, assignmentController.deleteAssignment);
app.patch('/v1/assignments/:id', (req, res) => {
    res.status(405).send({ error: "PATCH method not allowed." });
});

//Start Server Method
const startServer = async () => {
    logToApplication("Start of the application");
    logToApplication(process.env.DB_HOST);
    logToApplication(process.env.DB_USERNAME);
    logToApplication(process.env.DB_NAME);
    logToApplication(`Log Directory: ${logDirectory}`);
    try {
        await initializeDatabase();
        logToApplication("Database Synchronized");
        await csvLoader('opt/users.csv');
        logToApplication("Finished processing CSV");
        server = app.listen(PORT, () => {
            logToApplication(`Server started running on http://localhost:${PORT}`);
        });
    } catch (err) {
        logToApplication('Error:', err);
    }
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}
process.on('exit', () => {
    accessLogStream.close();
});

module.exports = {
    app,
    startServer,
    getServer: () => server
};
