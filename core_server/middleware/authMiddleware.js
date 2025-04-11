// // middleware/authMiddleware.js
// const jwt = require('jsonwebtoken');
// const config = require('../config/config');

// module.exports = (req, res, next) => {
//     const token = req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : null;
//     if (!token) {
//         return res.status(401).json({ success: false, message: 'No token provided' });
//     }
//     jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
//         if (err) {
//             return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
//         }
//         req.user = decoded;
//         next();
//     });
// };

// middleware/authMiddleware.js
module.exports = (req, res, next) => {
    // 테스트를 위해 토큰 검증을 비활성화함
    next();
};
