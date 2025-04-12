// controllers/mockTaskController.js
const MockTask = require('../models/MockTask');
const { successResponse } = require('../utils/responseFormatter');

exports.getMockTasks = async (req, res, next) => {
    try {
        const tasks = await MockTask.findAll();
        res.json(successResponse(tasks));
    } catch (error) {
        next(error);
    }
};

exports.createMockTask = async (req, res, next) => {
    try {
        const newTask = await MockTask.create(req.body);
        res.status(201).json(successResponse(newTask));
    } catch (error) {
        next(error);
    }
};

exports.updateMockTask = async (req, res, next) => {
    try {
        const task = await MockTask.findByPk(req.params.id);
        if (!task) throw new Error("Mock task not found");
        const updatedTask = await task.update(req.body);
        res.json(successResponse(updatedTask));
    } catch (error) {
        next(error);
    }
};

exports.deleteMockTask = async (req, res, next) => {
    try {
        const task = await MockTask.findByPk(req.params.id);
        if (!task) throw new Error("Mock task not found");
        await task.destroy();
        res.json(successResponse({ message: "Mock task deleted" }));
    } catch (error) {
        next(error);
    }
};
