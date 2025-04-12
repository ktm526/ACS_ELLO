const Map = require('../models/Map');

exports.getAllMaps = async () => {
    return await Map.findAll();
};

exports.createMap = async (data) => {
    return await Map.create(data);
};

exports.updateMap = async (id, data) => {
    const map = await Map.findByPk(id);
    if (!map) throw new Error("Map not found");
    // 업데이트 시점에 last_updated 갱신
    data.last_updated = new Date();
    return await map.update(data);
};

exports.deleteMap = async (id) => {
    const map = await Map.findByPk(id);
    if (!map) throw new Error("Map not found");
    return await map.destroy();
};
