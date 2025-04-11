// routes/mockRobotRoutes.js
const express = require('express');
const router = express.Router();
const mockRobotController = require('../controllers/mockRobotController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, mockRobotController.getMockRobots);
router.post('/', authMiddleware, mockRobotController.createMockRobot);
router.put('/:id', authMiddleware, mockRobotController.updateMockRobot);
router.delete('/:id', authMiddleware, mockRobotController.deleteMockRobot);

module.exports = router;
