// routes/logRoutes.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, logController.getLogs);

module.exports = router;
