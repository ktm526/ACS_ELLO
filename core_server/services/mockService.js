// services/mockService.js

const MockTask = require('../models/MockTask');
const MockRobot = require('../models/MockRobot');
const MockMap = require('../models/MockMap');
const { Op } = require('sequelize');

// 상수들
const PRIORITY_VALUES = { s: 4, h: 3, m: 2, l: 1 };
const ROBOT_STATE = { IDLE: '대기', MOVING: '이동', WORKING: '작업' };
const TASK_STATE = { PENDING: 'pending', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' };

// 이동 관련 설정
const MOVE_SPEED = 5;       // 한 스텝 당 이동 거리 (픽셀 단위)
const MOVE_THRESHOLD = 5;   // 도착 임계값 (픽셀)
const INTERVAL_TIME = 100;  // 업데이트 간격 (ms)

//─────────────────────────────────────────────
// 유틸 함수
//─────────────────────────────────────────────

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function euclideanDistance(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * BFS로 경로 탐색.
 * @param {string} start - 시작 노드 id
 * @param {string} goal - 목표 노드 id
 * @param {Object} stationData - { stations: [ { id, x, y, connections: [ { station, distance } ] } ] }
 * @returns {Array<string>|null} - 시작부터 목표까지의 노드 id 배열 (경로가 없으면 null)
 */
function bfsPath(start, goal, stationData) {
    if (start === goal) return [start];
    start = start.toString();
    goal = goal.toString();

    const queue = [start];
    const visited = new Set([start]);
    const parent = {};

    while (queue.length > 0) {
        const cur = queue.shift();
        if (cur === goal) {
            const path = [];
            let tmp = goal;
            while (tmp !== undefined) {
                path.unshift(tmp);
                tmp = parent[tmp];
            }
            return path;
        }
        const stationObj = stationData.stations.find(s => s.id.toString() === cur);
        if (stationObj && stationObj.connections) {
            for (const conn of stationObj.connections) {
                const nxt = conn.station.toString();
                if (!visited.has(nxt)) {
                    visited.add(nxt);
                    parent[nxt] = cur;
                    queue.push(nxt);
                }
            }
        }
    }
    return null;
}

/**
 * 현재 위치(currentPos)에서 targetPos까지 선형 보간하여 이동하는 함수.
 * DB에 로봇의 position을 업데이트하면서 목표에 도달할 때까지 반복합니다.
 */
async function moveRobotToTarget(robot, targetPos, currentPos, speed = MOVE_SPEED, threshold = MOVE_THRESHOLD, intervalTime = INTERVAL_TIME) {
    return new Promise(resolve => {
        const timer = setInterval(async () => {
            const dist = euclideanDistance(currentPos, targetPos);
            if (dist <= threshold) {
                currentPos.x = targetPos.x;
                currentPos.y = targetPos.y;
                clearInterval(timer);
                resolve();
            } else {
                const dx = targetPos.x - currentPos.x;
                const dy = targetPos.y - currentPos.y;
                const norm = Math.sqrt(dx * dx + dy * dy);
                currentPos.x += (dx / norm) * speed;
                currentPos.y += (dy / norm) * speed;
            }
            // 업데이트 로봇의 위치
            robot.position = JSON.stringify(currentPos);
            await robot.save();
            console.log(`Robot ${robot.id} moving: current position = ${JSON.stringify(currentPos)}`);
        }, intervalTime);
    });
}

/**
 * pending 태스크를 대기 중인 로봇에 할당합니다.
 * 태스크의 steps(JSON 문자열)에서 첫 번째 waypoint를 읽어, 그 값을 로봇의 destination으로 설정합니다.
 */
async function assignPendingTasksToFreeRobots() {
    try {
        const pendingTasks = await MockTask.findAll({ where: { status: TASK_STATE.PENDING } });
        if (!pendingTasks || pendingTasks.length === 0) {
            console.log("No pending tasks to assign.");
            return { success: true, message: "No pending tasks" };
        }
        // 우선순위 내림차순 정렬
        const sortedTasks = pendingTasks.sort(
            (a, b) => (PRIORITY_VALUES[b.priority] || 0) - (PRIORITY_VALUES[a.priority] || 0)
        );
        const freeRobots = await MockRobot.findAll({ where: { simulated_status: ROBOT_STATE.IDLE } });
        let assigned = 0;
        for (let i = 0; i < sortedTasks.length && i < freeRobots.length; i++) {
            const task = sortedTasks[i];
            const robot = freeRobots[i];
            task.robot_name = robot.name;
            task.status = TASK_STATE.IN_PROGRESS;
            robot.simulated_status = ROBOT_STATE.MOVING;
            // steps는 JSON 문자열; 첫 번째 항목의 waypoint가 로봇의 첫 destination
            let steps;
            try {
                steps = JSON.parse(task.steps);
            } catch (e) {
                console.log(`Task ${task.id} steps parsing error: ${e.message}`);
                continue;
            }
            if (!Array.isArray(steps) || steps.length === 0 || !steps[0].waypoint) {
                console.log(`Task ${task.id} does not have a valid first waypoint.`);
                continue;
            }
            // 첫 번째 waypoint를 현재 태스크의 destination으로 설정
            robot.destination = steps[0].waypoint;
            await Promise.all([task.save(), robot.save()]);
            assigned++;
            console.log(`Assigned task ${task.id} to robot ${robot.name} (ID:${robot.id}). Destination set to ${robot.destination}`);
        }
        return { success: true, message: `Assigned ${assigned} tasks`, count: assigned };
    } catch (error) {
        console.error("assignPendingTasksToFreeRobots error:", error);
        return { success: false, message: error.message };
    }
}

/**
 * 태스크 시뮬레이션: 로봇이 할당된 태스크의 steps를 순차적으로 수행합니다.
 * 각 waypoint 단계에서는 현재 위치에서 해당 waypoint까지 BFS 경로를 구하고, 경로상의 각 노드를 따라 보간 이동합니다.
 * instruction 단계에서는 콘솔에 메시지를 출력하고 5초 대기합니다.
 */
async function simulateTaskForRobot(robot, task, stationData) {
    let steps;
    try {
        steps = JSON.parse(task.steps);
    } catch (error) {
        console.log(`Task ${task.id} steps parsing error: ${error.message}`);
        return;
    }
    if (!Array.isArray(steps) || steps.length === 0) {
        console.log(`Task ${task.id} does not have valid steps.`);
        return;
    }
    console.log(`Robot ${robot.id} starting task ${task.id} with steps: ${JSON.stringify(steps)}`);

    // 초기 위치 설정: robot.position 없으면, 현재 simulated_location에 해당하는 스테이션 좌표 사용
    let currentPos = {};
    const currentStation = stationData.stations.find(s => s.id.toString() === robot.simulated_location.toString());
    if (!currentStation) {
        console.log(`Robot ${robot.id} current station ${robot.simulated_location} not found.`);
        return;
    }
    if (!robot.position) {
        currentPos = { x: currentStation.x, y: currentStation.y };
        robot.position = JSON.stringify(currentPos);
        await robot.save();
    } else {
        try {
            currentPos = JSON.parse(robot.position);
        } catch (e) {
            currentPos = { x: currentStation.x, y: currentStation.y };
        }
    }

    // 각 step를 순차적으로 실행
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.waypoint) {
            console.log(`Step ${i + 1}: Robot ${robot.id} moving to waypoint ${step.waypoint}`);
            // 이 step의 목적지를 설정: destination은 이 waypoint
            robot.destination = step.waypoint;
            await robot.save();

            // 도착할 때까지 반복: robot.simulated_location과 destination이 다르면 이동
            while (robot.simulated_location.toString() !== robot.destination.toString()) {
                // BFS 경로 계산: 현재 simulated_location에서 destination까지
                const path = bfsPath(robot.simulated_location, robot.destination, stationData);
                if (!path || path.length < 2) {
                    console.log(`Task ${task.id}: No valid path from ${robot.simulated_location} to ${robot.destination}`);
                    break;
                }
                // 다음 즉시 노드는 path[1]
                const nextNode = path[1];
                console.log(`Robot ${robot.id} path: ${path.join(' -> ')}, next immediate node: ${nextNode}`);
                // 다음 노드로 이동하도록 next_location을 설정 (단, 여기서는 next_location은 임시 변수로만 사용)
                robot.next_location = nextNode;
                await robot.save();
                // 이동: 현재 위치(currentPos)에서 다음 노드에 해당하는 스테이션 좌표로 이동
                const nextStation = stationData.stations.find(s => s.id.toString() === nextNode.toString());
                if (!nextStation) {
                    console.log(`Robot ${robot.id}: Station ${nextNode} not found.`);
                    break;
                }
                const targetPos = { x: nextStation.x, y: nextStation.y };
                console.log(`Robot ${robot.id} moving from ${JSON.stringify(currentPos)} to station ${nextStation.id} at ${JSON.stringify(targetPos)}`);
                await moveRobotToTarget(robot, targetPos, currentPos);
                // 이동 완료: 업데이트 currentPos, simulated_location, clear next_location
                currentPos = { x: nextStation.x, y: nextStation.y };
                robot.simulated_location = nextStation.id;
                robot.position = JSON.stringify(currentPos);
                robot.next_location = null;
                await robot.save();
            }
            console.log(`Robot ${robot.id} reached waypoint ${step.waypoint}`);
        } else if (step.instruction) {
            console.log(`Step ${i + 1}: Robot ${robot.id} executing instruction: "${step.instruction}"`);
            // 실행 단계: 단순히 메시지 출력 후 5초 대기
            await sleep(5000);
        } else {
            console.log(`Step ${i + 1}: Unknown step type in task ${task.id}`);
        }
    }

    // 태스크 완료 처리
    task.status = TASK_STATE.COMPLETED;
    await task.save();
    robot.simulated_status = ROBOT_STATE.IDLE;
    robot.destination = null;
    await robot.save();
    console.log(`Robot ${robot.id} completed task ${task.id}`);
    return true;
}

/**
 * 로봇 하나에 대해 할당된 태스크를 실행합니다.
 */
async function runFullTaskForOneRobot(robotId, stationData) {
    try {
        const robot = await MockRobot.findByPk(robotId);
        if (!robot) {
            console.log(`Robot ${robotId} not found.`);
            return;
        }
        const task = await MockTask.findOne({ where: { robot_name: robot.name, status: TASK_STATE.IN_PROGRESS } });
        if (!task) {
            console.log(`No active task for robot ${robot.id}`);
            return;
        }
        console.log(`#### Robot ${robot.id} begins task simulation for Task ${task.id} ####`);
        await simulateTaskForRobot(robot, task, stationData);
    } catch (error) {
        console.error(`Error in runFullTaskForOneRobot for robot ${robotId}:`, error);
    }
}

/**
 * 모든 활성 로봇에 대해 태스크 시뮬레이션을 시작합니다.
 */
async function startAllRobotMovements() {
    try {
        const { stationData } = await parseMapData();
        const activeRobots = await MockRobot.findAll({ where: { simulated_status: { [Op.ne]: ROBOT_STATE.IDLE } } });
        console.log(`Starting simulation for ${activeRobots.length} active robot(s).`);
        for (const robot of activeRobots) {
            runFullTaskForOneRobot(robot.id, stationData);
            await sleep(500);
        }
        return { success: true, count: activeRobots.length };
    } catch (error) {
        console.error("startAllRobotMovements error:", error);
        return { success: false, message: error.message };
    }
}

/**
 * 맵 데이터 파싱: 첫 번째 맵과 station 정보를 파싱합니다.
 */
async function parseMapData() {
    const arr = await MockMap.findAll();
    if (!arr || arr.length === 0) {
        throw new Error("No map data found");
    }
    const mapData = arr[0];
    let stationData;
    try {
        stationData = JSON.parse(mapData.station);
    } catch (e) {
        throw new Error("Error parsing station JSON");
    }
    if (!stationData.stations || stationData.stations.length === 0) {
        throw new Error("No station data available");
    }
    return { mapData, stationData };
}

/**
 * 전체 시뮬레이션: pending 태스크를 할당한 후, 모든 로봇의 태스크 시뮬레이션을 반복 실행합니다.
 */
async function runSimulationUntilAllTasksComplete(maxIterations = 100, interval = 2000) {
    try {
        let iterations = 0;
        let allTasksCompleted = false;
        const results = [];
        while (!allTasksCompleted && iterations < maxIterations) {
            iterations++;
            console.log(`Simulation iteration ${iterations}/${maxIterations}`);
            const assignResult = await assignPendingTasksToFreeRobots();
            console.log(assignResult.message);
            const moveResult = await startAllRobotMovements();
            results.push({ iteration: iterations, assign: assignResult, move: moveResult });
            const tasks = await MockTask.findAll();
            const pendingTasks = tasks.filter(t => t.status !== TASK_STATE.COMPLETED);
            if (pendingTasks.length === 0) {
                console.log("All tasks completed successfully.");
                allTasksCompleted = true;
                break;
            }
            console.log(`${pendingTasks.length} tasks still pending or in progress.`);
            await sleep(interval);
        }
        return {
            success: allTasksCompleted,
            iterationsRun: iterations,
            reachedMaxIterations: iterations >= maxIterations,
            results,
            message: allTasksCompleted
                ? "All tasks completed successfully"
                : `Stopped after ${iterations} iterations with some tasks incomplete`
        };
    } catch (error) {
        console.error("runSimulationUntilAllTasksComplete error:", error);
        return { success: false, message: error.message };
    }
}

module.exports = {
    assignPendingTasksToFreeRobots,
    simulateTaskForRobot,
    runSimulationUntilAllTasksComplete
};
