// controllers/mockRobotController.js
const MockRobot = require('../models/MockRobot');
const { successResponse } = require('../utils/responseFormatter');
const MockMap = require('../models/MockMap'); // MockMap 모델



exports.getMockRobots = async (req, res, next) => {
    try {
        const robots = await MockRobot.findAll();
        res.json(successResponse(robots));
    } catch (error) {
        next(error);
    }
};

exports.createMockRobot = async (req, res, next) => {
    try {
        // 클라이언트에서 전달된 simulated_location은 스테이션 이름입니다.
        const { simulated_location } = req.body;
        if (!simulated_location) {
            throw new Error("simulated_location is required");
        }

        // 우선, 하나의 map 데이터를 가져옵니다. (여러 개라면 조건을 추가하세요.)
        const mapDataArray = await MockMap.findAll();
        if (!mapDataArray || mapDataArray.length === 0) {
            throw new Error("No map data available");
        }
        const mapData = mapDataArray[0];

        // mapData.station은 JSON 문자열로 저장되어 있다고 가정합니다.
        let stationData = {};
        try {
            stationData = JSON.parse(mapData.station);
        } catch (parseError) {
            throw new Error("Error parsing station data from map");
        }

        if (!stationData.stations || stationData.stations.length === 0) {
            throw new Error("No stations available in map data");
        }

        // simulated_location이 해당하는 스테이션을 찾습니다.
        const foundStation = stationData.stations.find(
            (station) => station.id === simulated_location
        );

        if (!foundStation) {
            throw new Error(`Station '${simulated_location}' not found in map data`);
        }

        // 좌표 정보를 하나의 항목(position)으로 JSON 문자열로 저장
        req.body.position = JSON.stringify({ x: foundStation.x, y: foundStation.y });

        // MockRobot 생성
        const newRobot = await MockRobot.create(req.body);
        res.status(201).json(successResponse(newRobot));
    } catch (error) {
        next(error);
    }
};

exports.updateMockRobot = async (req, res, next) => {
    try {
        const robot = await MockRobot.findByPk(req.params.id);
        if (!robot) throw new Error("Mock robot not found");
        const updatedRobot = await robot.update(req.body);
        res.json(successResponse(updatedRobot));
    } catch (error) {
        next(error);
    }
};

exports.deleteMockRobot = async (req, res, next) => {
    try {
        const robot = await MockRobot.findByPk(req.params.id);
        if (!robot) throw new Error("Mock robot not found");
        await robot.destroy();
        res.json(successResponse({ message: "Mock robot deleted" }));
    } catch (error) {
        next(error);
    }
};
