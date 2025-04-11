// controllers/taskController.js
const taskService = require('../services/taskService');
const { successResponse } = require('../utils/responseFormatter');

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

