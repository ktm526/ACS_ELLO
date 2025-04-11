// services/taskService.js
const Task = require('../models/Task');
const Robot = require('../models/Robot');
const navigationService = require('./navigationService');
const axios = require('axios');


exports.getAllTasks = async () => {
    return await Task.findAll();
};

exports.createTask = async (data) => {
    // 외부에서 전달받은 데이터를 그대로 DB에 생성
    const task = await Task.create(data);
    return task;
};


// services/taskService.js 내 updateTask 함수 예시:
exports.updateTask = async (id, data) => {
    const task = await Task.findByPk(id);
    if (!task) throw new Error("Task not found");
    data.updated_at = new Date();
    const updatedTask = await task.update(data);

    // 완료 상태이고 반복 가능할 경우 새 태스크 생성
    if (updatedTask.status === 'completed' && updatedTask.repeat) {
        // 필요에 따라 created_at과 updated_at은 자동 갱신됨
        const newTask = await Task.create({
            robot_name: updatedTask.robot_name,
            task_type: updatedTask.task_type,
            steps: updatedTask.steps,
            status: 'pending',  // 새 태스크는 다시 대기 상태로 시작
            priority: updatedTask.priority,
            repeat: updatedTask.repeat,
            additional_info: updatedTask.additional_info,
        });
        console.log(`반복 태스크 생성됨 (원태스크 id: ${updatedTask.id}, 새 태스크 id: ${newTask.id})`);
    }

    return updatedTask;
};


exports.deleteTask = async (id) => {
    const task = await Task.findByPk(id);
    if (!task) throw new Error("Task not found");
    return await task.destroy();
};

exports.startTask = async () => {
    console.log('starttask')
    // 1. 가장 오래된 pending 태스크 찾기 (예: created_at ASC)
    const task = await Task.findOne({
        where: { status: 'pending' },
        order: [['created_at', 'ASC']]
    });
    if (!task) throw new Error("No pending task found");
    console.log("no task")

    // 2. 태스크에 할당된 로봇 이름으로 로봇 데이터 조회 (Robot 모델이 있다고 가정)
    const robot = await Robot.findOne({ where: { name: task.robot_name } });
    if (!robot) throw new Error(`Robot ${task.robot_name} not found`);

    // 3. IO 서버로 전송할 payload 구성
    const payload = {
        robot_ip: robot.ip,  // 로봇의 ip
        task: {
            id: task.id,
            task_type: task.task_type,
            steps: task.steps,
            status: task.status,
            priority: task.priority,
            repeat: task.repeat,
            additional_info: task.additional_info,
        }
    };

    console.log(payload)
    // 4. IO 서버 /ello/taskstart 엔드포인트에 payload 전송 (예: axios.post)
    const response = await axios.post(`${process.env.IO_URL}/ello/taskstart`, payload);
    // IO 서버 응답 처리 – 예: 태스크 완료 알림이면, 후속 처리를 진행
    if (response.data && response.data.success) {
        // 필요 시 task의 상태를 업데이트할 수 있음.
        return task;
    } else {
        console.log('Failed to start task via IO server.')
        throw new Error('Failed to start task via IO server.');
    }
};
