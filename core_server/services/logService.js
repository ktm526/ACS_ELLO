// services/logService.js
const Log = require('../models/Log');

exports.getLogs = async () => {
    return await Log.findAll();
};

exports.createLog = async (logData) => {
    return await Log.create(logData);
};
