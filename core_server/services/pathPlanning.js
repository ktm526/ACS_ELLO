// pathPlanning.js

/**
 * 간단한 BFS로 start→end 경로 배열을 구하는 내부 함수
 */
function bfsPath(stations, startId, endId) {
    if (startId.toString() === endId.toString()) {
        return [startId];
    }

    const queue = [];
    const visited = new Set();
    const parent = {};

    queue.push(startId);
    visited.add(startId.toString());

    while (queue.length > 0) {
        const current = queue.shift();
        if (current.toString() === endId.toString()) {
            break;
        }

        const stationObj = stations.find(s => s.id.toString() === current.toString());
        if (stationObj && stationObj.connections) {
            for (const conn of stationObj.connections) {
                const neighbor = conn.station;
                const neighborStr = neighbor.toString();
                if (!visited.has(neighborStr)) {
                    visited.add(neighborStr);
                    parent[neighborStr] = current;
                    queue.push(neighbor);
                }
            }
        }
    }

    if (!visited.has(endId.toString())) {
        // 경로 없음
        return [];
    }

    // parent 정보로 경로 복원
    const path = [];
    let node = endId;
    while (node !== undefined) {
        path.unshift(node);
        node = parent[node.toString()];
    }
    return path; // ex) ["C","B","D","F"]
}

/**
 * 로봇 배열 + stationData를 입력받아,
 * 각 로봇의 "현재 위치(simulated_location) → 목적지(destination)" 경로를
 * 객체 형태로 반환:
 * { [robot.id]: [node1, node2, ...], ... }
 */
function getAllRobotPaths(robots, stationData) {
    const { stations } = stationData;
    const results = {};

    for (const robot of robots) {
        if (!robot.destination) {
            // 목적지가 없는 로봇 → 경로 없음
            results[robot.id] = [];
            continue;
        }
        const pathArr = bfsPath(stations, robot.simulated_location, robot.destination);
        results[robot.id] = pathArr;
    }

    return results;
}

module.exports = {
    getAllRobotPaths
};
