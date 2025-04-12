// routes/robotRoutes.js
const express = require('express');
const router = express.Router();
const robotController = require('../controllers/robotController');

// GET /api/robots: 모든 로봇 조회
router.get('/', robotController.getRobots);

// POST /api/robots: 로봇 정보 upsert (업데이트 또는 생성)
router.post('/', robotController.createOrUpdateRobot);

// DELETE /api/robots/:id: 로봇 삭제
router.delete('/:id', robotController.deleteRobot);

module.exports = router;
