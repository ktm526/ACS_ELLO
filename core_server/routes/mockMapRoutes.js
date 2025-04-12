// routes/mockMapRoutes.js
const express = require('express');
const router = express.Router();
const mockMapController = require('../controllers/mockMapController');
const authMiddleware = require('../middleware/authMiddleware');

// 예: GET, POST, PUT, DELETE 엔드포인트
router.get('/', authMiddleware, mockMapController.getMockMaps);
router.post('/', authMiddleware, mockMapController.createMockMap);
router.put('/:id', authMiddleware, mockMapController.updateMockMap);
router.delete('/:id', authMiddleware, mockMapController.deleteMockMap);

module.exports = router;
