// routes/mapRoutes.js
const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, mapController.getMaps);
router.post('/', authMiddleware, mapController.createMap);
router.put('/:id', authMiddleware, mapController.updateMap);
router.delete('/:id', authMiddleware, mapController.deleteMap);

module.exports = router;
