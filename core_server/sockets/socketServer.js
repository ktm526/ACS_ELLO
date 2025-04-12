// sockets/socketServer.js
exports.initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });

        // 추가적인 소켓 이벤트 핸들러를 이곳에 등록할 수 있음
    });
};
