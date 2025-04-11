// routes/index.js
const express = require('express');
const router = express.Router();
const robotRoutes = require('./robotRoutes');
const taskRoutes = require('./taskRoutes');
const mapRoutes = require('./mapRoutes');
const logRoutes = require('./logRoutes');
const authRoutes = require('./authRoutes'); // 선택 사항
const mockRobotRoutes = require('./mockRobotRoutes');
const mockTaskRoutes = require('./mockTaskRoutes');
const mockMapRoutes = require('./mockMapRoutes');


router.use('/robots', robotRoutes);
router.use('/tasks', taskRoutes);
router.use('/maps', mapRoutes);
router.use('/logs', logRoutes);
router.use('/auth', authRoutes);
router.use('/mock/robots', mockRobotRoutes);
router.use('/mock/tasks', mockTaskRoutes);
router.use('/mock/maps', mockMapRoutes);

module.exports = router;
