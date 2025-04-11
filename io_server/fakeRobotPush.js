// fakeRobotPush.js
// -----------------------------------------------------------
// 사용법:
//   node fakeRobotPush.js --name=AMR01 --host=127.0.0.1 --interval=1000
// -----------------------------------------------------------
const net = require('net');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
    .option('name', { type: 'string', default: 'AMR_FAKE_2' })
    .option('host', { type: 'string', default: '127.0.0.1' })
    .option('port', { type: 'number', default: 19301 })
    .option('interval', { type: 'number', default: 1000, describe: 'ms' })
    .argv;

const { name, host, port, interval } = argv;

function buildPacket(jsonObj, msgType = 0x0001) {
    const body = Buffer.from(JSON.stringify(jsonObj), 'utf8');
    const header = Buffer.alloc(16);
    header.writeUInt8(0x5A, 0);          // sync
    header.writeUInt8(0x01, 1);          // version
    header.writeUInt16BE(1, 2);         // serial number (고정)
    header.writeUInt32BE(body.length, 4); // data length
    header.writeUInt16BE(msgType, 8);     // message type (아무 값이나 OK)
    // reserved 6바이트는 0으로
    return Buffer.concat([header, body]);
}

let x = 0, y = 0, angle = 0;
const socket = net.createConnection({ host, port }, () => {
    console.log(`✅  Connected to ${host}:${port} as "${name}"`);

    setInterval(() => {
        // 가짜 위치 업데이트
        // x += 0.1;
        //y += 0.05;
        angle += 0.1;

        const payload = {
            vehicle_id: name,
            x, y, angle,
            speed: 0.5,
            battery: 85
        };

        const packet = buildPacket(payload);
        socket.write(packet);
        process.stdout.write('.');   // heartbeat 표시
    }, interval);
});

socket.on('error', (e) => console.error('\n❌  TCP error:', e.message));
socket.on('close', () => console.log('\nℹ️  Connection closed'));
