// controllers/mapController.js
const mapService = require('../services/mapService');
const { successResponse } = require('../utils/responseFormatter');

exports.getMaps = async (req, res, next) => {
    try {
        const maps = await mapService.getAllMaps();
        res.json(successResponse(maps));
    } catch (err) {
        next(err);
    }
};

exports.createMap = async (req, res, next) => {
    try {
        const map = await mapService.createMap(req.body);
        res.status(201).json(successResponse(map));
    } catch (err) {
        next(err);
    }
};

exports.updateMap = async (req, res, next) => {
    try {
        const updatedMap = await mapService.updateMap(req.params.id, req.body);
        res.json(successResponse(updatedMap));
    } catch (err) {
        next(err);
    }
};

exports.deleteMap = async (req, res, next) => {
    try {
        await mapService.deleteMap(req.params.id);
        res.json(successResponse({ message: "Map deleted" }));
    } catch (err) {
        next(err);
    }
};
