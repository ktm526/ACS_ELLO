// controllers/authController.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { successResponse } = require('../utils/responseFormatter');

// 단순 데모용 로그인: 실제로는 사용자 검증이 필요함
exports.login = async (req, res, next) => {
    try {
        const { username } = req.body;
        const token = jwt.sign({ username }, config.JWT_SECRET, { expiresIn: '1h' });
        res.json(successResponse({ token }));
    } catch (err) {
        next(err);
    }
};
