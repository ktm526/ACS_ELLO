// controllers/logController.js
const logService = require('../services/logService');
const { successResponse } = require('../utils/responseFormatter');

exports.getLogs = async (req, res, next) => {
    try {
        const logs = await logService.getLogs();
        res.json(successResponse(logs));
    } catch (err) {
        next(err);
    }
};
