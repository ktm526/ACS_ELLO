// controllers/taskController.js
const taskService = require('../services/taskService');
const { successResponse } = require('../utils/responseFormatter');
const Task = require('../models/Task');
const Robot = require('../models/Robot');
const axios = require('axios');

exports.createTask = async (req, res, next) => {
    try {
        const task = await taskService.createTask(req.body);
        res.status(201).json(successResponse(task));
    } catch (err) {
        next(err);
    }
};

exports.getTasks = async (req, res, next) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.json(successResponse(tasks));
    } catch (err) {
        next(err);
    }
};

exports.updateTask = async (req, res, next) => {
    try {
        const updatedTask = await taskService.updateTask(req.params.id, req.body);
        res.json(successResponse(updatedTask));
    } catch (err) {
        next(err);
    }
};

exports.deleteTask = async (req, res, next) => {
    try {
        await taskService.deleteTask(req.params.id);
        res.json(successResponse({ message: "Task deleted" }));
    } catch (err) {
        next(err);
    }
};

exports.startTask = async (req, res, next) => {
    try {
        const task = await taskService.startTask();
        res.status(200).json(successResponse(task));
    } catch (err) {
        next(err);
    }
};

exports.controlTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { command } = req.body;  // command: "pause", "resume", "cancel" 등

        // 태스크와 할당된 로봇 정보 조회
        const task = await Task.findByPk(id);
        if (!task)
            return res.status(404).json({ success: false, message: 'Task not found' });
        if (command === 'cancel' && (task.status === 'pending' || task.status === 'complete')) {
            // 진행 중이 아니면 DB에서 태스크 삭제
            await task.destroy();
            return res.json({ success: true, message: "Task deleted successfully." });
        }

        const robot = await Robot.findOne({ where: { name: task.robot_name } });
        if (!robot)
            return res.status(404).json({ success: false, message: 'Robot not found' });

        // payload의 포맷 수정: 최상위에 method가 포함되어야 함.
        const payload = {
            robot_ip: robot.ip,
            method: command,   // "pause", "resume", "cancel" 등의 커맨드
            task: { id: task.id }
        };

        console.log(`[controlTask] Payload to ioServer:`, payload);

        // 취소 명령 분기 처리:
        if (command === "cancel") {
            if (task.status === "in_progress") {
                // 진행 중인 태스크인 경우, ioServer에 취소 메시지 전송 후 상태 업데이트
                const response = await axios.post(`${process.env.IO_URL}/api/taskMessage`, payload);
                if (response.data && response.data.success) {
                    await task.update({ status: 'canceled', updated_at: new Date() });
                    return res.json({ success: true, message: `Task command ${command} sent.` });
                } else {
                    return res.status(500).json({ success: false, message: 'IO Server rejected the command.' });
                }
            }


        } else {
            // pause 또는 resume 명령 처리
            const response = await axios.post(`${process.env.IO_URL}/api/taskMessage`, payload);
            if (response.data && response.data.success) {
                if (command === "pause") {
                    await task.update({ status: 'paused', updated_at: new Date() });
                } else if (command === "resume") {
                    await task.update({ status: 'in_progress', updated_at: new Date() });
                }
                return res.json({ success: true, message: `Task command ${command} sent.` });
            } else {
                return res.status(500).json({ success: false, message: 'IO Server rejected the command.' });
            }
        }
    } catch (err) {
        console.error(`[controlTask] Error: ${err.message}`);
        next(err);
    }
};

