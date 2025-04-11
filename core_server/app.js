// app.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/db');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { initSocket } = require('./sockets/socketServer');
const config = require('./config/config');
const cors = require('cors');
require('dotenv').config();

const app = express();

const requestLogger = require('./middleware/requestLogger');
app.use(requestLogger)

// 내장 JSON 파서에 limit 옵션을 적용하여 요청 본문 크기를 늘림
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.use(cors());

// RESTful API 라우트 등록 (/api)
app.use('/api', routes);

// 전역 에러 핸들러 등록
app.use(errorHandler);

// HTTP 서버와 Socket.IO 서버 생성
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

// Socket.IO 초기화
initSocket(io);

const PORT = config.PORT || 3000;

// DB 동기화 후 서버 시작
sequelize.sync({ alter: true })
    .then(() => {
        console.log("Database synced");
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
        const { runAllocatorLoop } = require('./services/taskAllocator');
        runAllocatorLoop();
    })
    .catch((err) => {
        console.error("Database sync error:", err);
    });

module.exports = { app, io };
