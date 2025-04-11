// config/deviceConfig.js
module.exports = {
    robotControlServerURL: process.env.IO_URL || 'http://localhost:4000/api/robot',
    timeout: 5000
};
