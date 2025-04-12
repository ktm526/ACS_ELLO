// controllers/robotController.js
const robotService = require('../services/robotService');
const { successResponse } = require('../utils/responseFormatter');

exports.getRobots = async (req, res, next) => {
    try {
        const robots = await robotService.getAllRobots();
        res.json(successResponse(robots));
    } catch (err) {
        next(err);
    }
};

exports.createOrUpdateRobot = async (req, res, next) => {
    try {
        // POST 요청 시, name을 기준으로 upsert 처리합니다.
        const robot = await robotService.upsertRobot(req.body);
        res.status(200).json(successResponse(robot));
    } catch (err) {
        next(err);
    }
};

exports.deleteRobot = async (req, res, next) => {
    try {
        await robotService.deleteRobot(req.params.id);
        res.json(successResponse({ message: "Robot deleted" }));
    } catch (err) {
        next(err);
    }
};
