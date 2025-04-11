// services/navigationService.js
const axios = require('axios');
const deviceConfig = require('../config/deviceConfig');
const { io } = require('../app');

// 단순 MAPF 경로 계산 함수 (예: 현재 위치 → 시작 위치 → 도착 위치)
function planPath(currentLocation, startLocation, destinationLocation) {
    return [currentLocation, startLocation, destinationLocation];
}

// 로봇에게 단계별 명령을 HTTP로 전송하고 실시간 업데이트 전파
async function guideRobot(robot, task, path) {
    for (let i = 1; i < path.length; i++) {
        const nextNode = path[i];
        try {
            await axios.post(deviceConfig.robotControlServerURL + '/move', {
                robotName: robot.name,
                nextNode: nextNode
            }, { timeout: deviceConfig.timeout });

            // 실시간 업데이트 전파 (Socket.IO)
            io.emit('robotUpdate', {
                robot: robot.name,
                message: `Moving to ${nextNode}`
            });

        } catch (error) {
            console.error("Error guiding robot:", error);
            // 에러 처리 및 태스크 상태 업데이트 로직 추가 가능
        }
    }

    // 경로 완료 후 상태 업데이트
    await robot.update({ status: 'idle' });
    await task.update({ status: 'completed', updated_at: new Date() });

    io.emit('taskUpdate', {
        taskId: task.id,
        status: 'completed'
    });
}

exports.planAndGuideTask = async (robot, task) => {
    const path = planPath(robot.location || 'Start', task.start_location, task.destination_location);
    console.log("Planned path:", path);
    await guideRobot(robot, task, path);
};
