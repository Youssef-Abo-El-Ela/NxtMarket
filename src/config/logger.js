const fs = require('fs');
const path = require('path');
const {createLogger , format , transports} = require('winston');
const { combine, timestamp, printf } = format;
const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const requestStream = fs.createWriteStream(path.join(logDir, 'requests.log'), { flags: 'a' });
const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new transports.File({ filename: path.join(logDir, 'app.log') })
  ]
});

module.exports = { logger, requestStream };
