// controllers/mockMapController.js
const MockMap = require('../models/MockMap');
const { successResponse } = require('../utils/responseFormatter');

exports.getMockMaps = async (req, res, next) => {
    try {
        const maps = await MockMap.findAll();
        res.json(successResponse(maps));
    } catch (error) {
        next(error);
    }
};

exports.createMockMap = async (req, res, next) => {
    try {
        // 클라이언트가 보낸 station, path는 JSON 객체일 수 있으므로 문자열로 변환하거나 그대로 저장할 수 있음.
        const newMap = await MockMap.create(req.body);
        res.status(201).json(successResponse(newMap));
    } catch (error) {
        next(error);
    }
};

exports.updateMockMap = async (req, res, next) => {
    try {
        const map = await MockMap.findByPk(req.params.id);
        if (!map) throw new Error("Mock map not found");
        const updatedMap = await map.update(req.body);
        res.json(successResponse(updatedMap));
    } catch (error) {
        next(error);
    }
};

exports.deleteMockMap = async (req, res, next) => {
    try {
        const map = await MockMap.findByPk(req.params.id);
        if (!map) throw new Error("Mock map not found");
        await map.destroy();
        res.json(successResponse({ message: "Mock map deleted" }));
    } catch (error) {
        next(error);
    }
};
