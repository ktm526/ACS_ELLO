// fakeRobotClient.js
const net = require('net');

// TCP 서버에 연결 (서버 주소와 포트에 맞게 수정)
const client = new net.Socket();
client.connect(19301, '127.0.0.1', () => {
    console.log('Connected to TCP server on port 19301');

    // 1초마다 가짜 로봇 데이터 전송
    setInterval(() => {
        // 가짜 데이터 생성
        const fakeData = {
            x: parseFloat((Math.random() * 10).toFixed(2)),              // 0 ~ 10 m 범위
            y: parseFloat((Math.random() * 10).toFixed(2)),              // 0 ~ 10 m 범위
            angle: parseFloat((Math.random() * 2 * Math.PI).toFixed(2)),   // 0 ~ 2π rad
            status: "대기",
            vehicle_id: "RobotA1"                                        // 테스트용 로봇 ID
        };

        // JSON 문자열로 변환 후 전송 (종료 문자 포함)
        const dataString = JSON.stringify(fakeData);
        console.log("Sending:", dataString);
        client.write(dataString + "\n");
    }, 1000); // 1000ms(1초) 간격
});

// 서버로부터 데이터 수신 시 처리 (필요에 따라)
client.on('data', (data) => {
    console.log('Received from server:', data.toString());
});

// 연결 종료 시 처리
client.on('close', () => {
    console.log('Connection closed');
});

// 에러 핸들링
client.on('error', (err) => {
    console.error('Error:', err.message);
});
