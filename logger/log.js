// logger.js
const fs = require('fs');
const path = require('path');

const logDirectory = process.env.NODE_ENV === 'test' ? './logs' : '/var/log/webapp';
const applicationLogPath = path.join(logDirectory, 'application.log');

// Ensure the log directory exists
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Create a write stream in append mode
const appLogStream = fs.createWriteStream(applicationLogPath, { flags: 'a' });

const logToApplication = (message) => {
    const timestamp = new Date().toISOString();
    appLogStream.write(`${timestamp} - ${message}\n`);
};

process.on('exit', () => {
    appLogStream.close();
});

module.exports = logToApplication;
