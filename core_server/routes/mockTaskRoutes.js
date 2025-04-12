// routes/mockTaskRoutes.js
const express = require('express');
const router = express.Router();
const mockTaskController = require('../controllers/mockTaskController');
const authMiddleware = require('../middleware/authMiddleware');

// 새 서비스 로직을 반영한 시뮬레이션 함수 불러오기
const { runSimulationUntilAllTasksComplete } = require('../services/mockService');

// Task CRUD 엔드포인트
router.get('/', authMiddleware, mockTaskController.getMockTasks);
router.post('/', authMiddleware, mockTaskController.createMockTask);
router.put('/:id', authMiddleware, mockTaskController.updateMockTask);
router.delete('/:id', authMiddleware, mockTaskController.deleteMockTask);

/**
 * 할당 및 시뮬레이션 엔드포인트:
 * 한 번 호출하면 모든 태스크가 COMPLETED 될 때까지 할당, 이동, 작업을 자동 반복합니다.
 */
router.post('/assignAndSimulateAll', authMiddleware, async (req, res, next) => {
    try {
        const result = await runSimulationUntilAllTasksComplete();
        res.json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
