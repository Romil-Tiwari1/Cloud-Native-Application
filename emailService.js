require('dotenv').config();
const logToApplication = require('./logger/log');

const mailgun = require('mailgun-js');

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN
});

function sendEmail(to, subject, text) {
  const data = {
    from: process.env.MAILGUN_SENDER,
    to: to,
    subject: subject,
    text: text
  };

  mg.messages().send(data, function (error, body) {
    if (error) {
      logToApplication(`Error sending email: ${error.message}`);
    } else {
      logToApplication(`Email sent: ${JSON.stringify(body)}`);
    }
  });
}

module.exports = sendEmail;
