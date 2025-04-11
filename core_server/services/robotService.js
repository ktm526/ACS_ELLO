const Robot = require('../models/Robot');

exports.upsertRobot = async (data) => {
    // 먼저 name을 기준으로 기존 로봇 데이터를 조회합니다.
    const existing = await Robot.findOne({ where: { name: data.name } });
    if (existing) {
        // 이미 존재하면 업데이트
        return await existing.update(data);
    } else {
        // 존재하지 않으면 새로 생성
        return await Robot.create(data);
    }
};

exports.getAllRobots = async () => {
    return await Robot.findAll();
};

exports.deleteRobot = async (id) => {
    const robot = await Robot.findByPk(id);
    if (!robot) throw new Error("Robot not found");
    return await robot.destroy();
};
