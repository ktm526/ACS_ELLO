// ioServer.js
const express = require('express');
const http = require('http');
const net = require('net');          // TCP 서버를 위한 모듈
const { Server } = require('socket.io');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const yaml = require('js-yaml');

const app = express();

// ioServer.js (파일 상단 가까운 곳)
const AMR_IP = process.env.AMR_IP || '192.168.0.100';   // 🔹 여기서만 수정
const CMD_PORT = 19304;                                   // 제어 명령 수신 포트


// ----- CORS 미들웨어를 최상단에 등록 -----
app.use(cors()); // 모든 도메인 허용

// ------------------- 파일 필터 및 multer 설정 -------------------
// smap, json, pgm, yaml 확장자를 모두 허용합니다.
const fileFilter = (req, file, cb) => {
    console.log("Received file:", file.originalname);
    const ext = path.extname(file.originalname).toLowerCase();
    console.log("Extracted extension:", ext);
    if (ext === ".smap" || ext === ".json" || ext === ".pgm" || ext === ".yaml" || ext === ".yml") {
        cb(null, true);
    } else {
        cb(new Error("Only .smap, .json, .pgm, and .yaml/.yml files are allowed!"));
    }
};

const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter });

// 기존 유클리드 거리 함수 그대로 사용
function euclideanDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 기존 transformMapData: advancedPointList 형식의 json/smap 파일 처리
 */
function transformMapData(mapJson) {
    let stations = [];
    if (Array.isArray(mapJson.advancedPointList)) {
        stations = mapJson.advancedPointList.map(point => ({
            id: point.instanceName,
            x: point.pos.x,
            y: point.pos.y,
            connections: [],
            property: point.property ? point.property : {}
        }));
    } else {
        throw new Error("advancedPointList is missing or not an array");
    }
    const findStation = id => stations.find(st => st.id.toString() === id.toString());
    let paths = [];
    if (Array.isArray(mapJson.advancedCurveList)) {
        mapJson.advancedCurveList.forEach(curve => {
            const parts = curve.instanceName.split('-');
            if (parts.length !== 2) return;
            const id1 = parts[0];
            const id2 = parts[1];
            const station1 = findStation(id1);
            const station2 = findStation(id2);
            if (!station1 || !station2) return;
            const distance = euclideanDistance(
                { x: station1.x, y: station1.y },
                { x: station2.x, y: station2.y }
            );
            station1.connections.push({ station: id2, distance, property: curve.property || {} });
            station2.connections.push({ station: id1, distance, property: curve.property || {} });
            paths.push({
                start: id1,
                end: id2,
                coordinates: {
                    start: { x: station1.x, y: station1.y },
                    end: { x: station2.x, y: station2.y }
                },
                property: curve.property || {}
            });
        });
    } else {
        console.warn("advancedCurveList is missing or not an array");
    }
    const additionalInfo = {
        header: mapJson.header,
        normalPosList: mapJson.normalPosList,
        advancedLineList: mapJson.advancedLineList
    };
    return {
        name: mapJson.header.mapName || "Unnamed Map",
        station: JSON.stringify({ stations }),
        path: JSON.stringify({ paths }),
        additional_info: JSON.stringify(additionalInfo)
    };
}

/**
 * transformMapDataFromNodesEdges:
 * JSON 파일에 포함된 "nodes"와 "edges"를 station과 path 필드로 변환
 */
function transformMapDataFromNodesEdges(jsonData, yamlData, normalPosList) {
    // station: jsonData.nodes 그대로 사용
    const station = JSON.stringify({ stations: jsonData.nodes });
    // edges: 각 edge에 대해 start, end의 좌표를 매핑
    const paths = jsonData.edges.map(edge => {
        const startNode = jsonData.nodes.find(n => n.id === edge.start);
        const endNode = jsonData.nodes.find(n => n.id === edge.end);
        if (startNode && endNode) {
            return {
                start: edge.start,
                end: edge.end,
                coordinates: {
                    start: { x: startNode.x, y: startNode.y },
                    end: { x: endNode.x, y: endNode.y }
                }
            };
        } else {
            return null;
        }
    }).filter(p => p !== null);
    // 맵 이름: YAML 파일의 header.mapName가 있으면 사용
    const name = (yamlData.header && yamlData.header.mapName) ? yamlData.header.mapName : "Unnamed Map";
    const additional_info = JSON.stringify({ normalPosList: normalPosList });
    return {
        name,
        station,
        path: JSON.stringify({ paths }),
        additional_info
    };
}

/**
 * PGM 파일 파서
 */
function parsePGM(buffer) {
    const headerText = buffer.toString('ascii');
    const lines = headerText.split('\n').filter(line => line[0] !== '#');
    const magic = lines[0].trim();
    if (magic !== 'P5' && magic !== 'P2') {
        throw new Error('Unsupported PGM format');
    }
    const dims = lines[1].trim().split(/\s+/);
    const width = parseInt(dims[0]);
    const height = parseInt(dims[1]);
    const maxVal = parseInt(lines[2].trim());
    let headerLength = 0;
    let headerLines = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 0x0A) { // newline character
            headerLines++;
            if (headerLines === 3) {
                headerLength = i + 1;
                break;
            }
        }
    }
    let pixelData;
    if (magic === 'P5') {
        // Binary format
        pixelData = buffer.slice(headerLength);
    } else {
        // ASCII format
        pixelData = headerText.substring(headerLength).trim().split(/\s+/).map(Number);
    }
    return { width, height, maxVal, pixelData, isBinary: magic === 'P5' };
}

// 파일 업로드 엔드포인트
app.post('/uploadMap', upload.fields([
    { name: 'mapFile', maxCount: 1 },
    { name: 'pgmFile', maxCount: 1 },
    { name: 'yamlFile', maxCount: 1 }
]), async (req, res) => {
    console.log('upload');
    try {
        // Case 1: JSON 파일(mapFile) 업로드 (기존 방식 혹은 nodes/edges 형식에 따른 분기)
        if (req.files && req.files.mapFile) {
            const fileBuffer = req.files.mapFile[0].buffer;
            const fileContent = fileBuffer.toString('utf-8');
            let mapJson;
            try {
                mapJson = JSON.parse(fileContent);
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Invalid JSON in file.' });
            }
            // 만약 JSON에 advancedPointList가 있다면 기존 방식 사용
            if (mapJson.advancedPointList) {
                const transformedData = transformMapData(mapJson);
                console.log("Transformed map data (advanced format):", transformedData);
                const response = await axios.post('http://localhost:3000/api/maps', transformedData);
                console.log("Core server response:", response.data);
                if (response.data && response.data.success) {
                    return res.status(201).json({
                        success: true,
                        message: 'Map uploaded successfully',
                        data: response.data.data
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        message: 'Core server response error',
                        data: response.data
                    });
                }
            }
            // 만약 JSON에 nodes와 edges가 있다면
            else if (mapJson.nodes && mapJson.edges) {
                // 필수: pgmFile와 yamlFile도 함께 업로드되어야 함
                if (!(req.files.pgmFile && req.files.yamlFile)) {
                    return res.status(400).json({ success: false, message: 'PGM and YAML files are required with station/edge JSON file.' });
                }
                // YAML 파일 파싱
                const yamlString = req.files.yamlFile[0].buffer.toString('utf-8');
                let yamlData;
                try {
                    yamlData = yaml.load(yamlString);
                } catch (e) {
                    return res.status(400).json({ success: false, message: 'Invalid YAML file.' });
                }
                // PGM 파일 파싱 및 normalPosList 추출
                let pgmData;
                try {
                    pgmData = parsePGM(req.files.pgmFile[0].buffer);
                } catch (e) {
                    return res.status(400).json({ success: false, message: e.message });
                }
                const normalPosList = [];
                const w = pgmData.width;
                const h = pgmData.height;
                if (pgmData.isBinary) {
                    for (let i = 0; i < h; i++) {
                        for (let j = 0; j < w; j++) {
                            const pixelVal = pgmData.pixelData[j + i * w];
                            if (pixelVal === 0) { // 검은색 픽셀
                                const resolution = parseFloat(yamlData.resolution) || 0.03;
                                const origin = yamlData.origin || [0, 0, 0];
                                const worldX = origin[0] + j * resolution;
                                const worldY = origin[1] + (h - i - 1) * resolution;
                                normalPosList.push({ x: worldX, y: worldY });
                            }
                        }
                    }
                } else {
                    for (let i = 0; i < h; i++) {
                        for (let j = 0; j < w; j++) {
                            const pixelVal = pgmData.pixelData[j + i * w];
                            if (pixelVal === 0) {
                                const resolution = parseFloat(yamlData.resolution) || 0.03;
                                const origin = yamlData.origin || [0, 0, 0];
                                const worldX = origin[0] + j * resolution;
                                const worldY = origin[1] + (h - i - 1) * resolution;
                                normalPosList.push({ x: worldX, y: worldY });
                            }
                        }
                    }
                }
                const transformedData = transformMapDataFromNodesEdges(mapJson, yamlData, normalPosList);
                console.log("Transformed map data (JSON nodes/edges + PGM/YAML):", transformedData);
                const response = await axios.post('http://localhost:3000/api/maps', transformedData);
                console.log("Core server response:", response.data);
                if (response.data && response.data.success) {
                    return res.status(201).json({
                        success: true,
                        message: 'Map uploaded successfully',
                        data: response.data.data
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        message: 'Core server response error',
                        data: response.data
                    });
                }
            } else {
                return res.status(400).json({ success: false, message: 'Invalid JSON file structure.' });
            }
        }
        // Case 2: pgmFile와 yamlFile만 있다면 처리 (PGM+YAML 방식)
        else if (req.files && req.files.pgmFile && req.files.yamlFile) {
            const yamlString = req.files.yamlFile[0].buffer.toString('utf-8');
            let yamlData;
            try {
                yamlData = yaml.load(yamlString);
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Invalid YAML file.' });
            }
            const resolution = parseFloat(yamlData.resolution) || 0.03;
            const origin = yamlData.origin || [0, 0, 0];
            let pgmData;
            try {
                pgmData = parsePGM(req.files.pgmFile[0].buffer);
            } catch (e) {
                return res.status(400).json({ success: false, message: e.message });
            }
            const normalPosList = [];
            const w = pgmData.width;
            const h = pgmData.height;
            if (pgmData.isBinary) {
                for (let i = 0; i < h; i++) {
                    for (let j = 0; j < w; j++) {
                        const pixelVal = pgmData.pixelData[j + i * w];
                        if (pixelVal === 0) {
                            const worldX = origin[0] + j * resolution;
                            const worldY = origin[1] + (h - i - 1) * resolution;
                            normalPosList.push({ x: worldX, y: worldY });
                        }
                    }
                }
            } else {
                for (let i = 0; i < h; i++) {
                    for (let j = 0; j < w; j++) {
                        const pixelVal = pgmData.pixelData[j + i * w];
                        if (pixelVal === 0) {
                            const worldX = origin[0] + j * resolution;
                            const worldY = origin[1] + (h - i - 1) * resolution;
                            normalPosList.push({ x: worldX, y: worldY });
                        }
                    }
                }
            }
            // transformedData: station, path 빈 문자열
            const transformedData = {
                name: (yamlData.header && yamlData.header.mapName) ? yamlData.header.mapName : "Unnamed Map",
                station: "",
                path: "",
                additional_info: JSON.stringify({ normalPosList: normalPosList })
            };
            console.log("Transformed map data (PGM+YAML):", transformedData);
            const response = await axios.post('http://localhost:3000/api/maps', transformedData);
            console.log("Core server response:", response.data);
            if (response.data && response.data.success) {
                return res.status(201).json({
                    success: true,
                    message: 'Map uploaded successfully',
                    data: response.data.data
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Core server response error',
                    data: response.data
                });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported file type or missing files.' });
        }
    } catch (error) {
        console.error('Error in /uploadMap:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ------------------- 전역 미들웨어 등록 -------------------
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

app.get('/', (req, res) => {
    res.send('ioServer is running on port 4000');
});

// ------------------- Socket.IO 설정 -------------------
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// ------------------- TCP 서버 (포트 19301) -------------------
// 각 로봇별 마지막 수신 시간을 저장하는 Map (name -> timestamp)
const robotLastReceived = new Map();

const tcpServer = net.createServer((socket) => {
    // console.log('TCP client connected');

    socket.on('data', async (chunk) => {
        try {
            const rawString = chunk.toString('utf-8');
            const data = JSON.parse(rawString);
            //console.log(data);
            const name = data.vehicle_id || data.robot_id || 'UnknownRobot';
            robotLastReceived.set(name, Date.now());
            const ip = socket.remoteAddress;
            const positionObj = {
                x: data.x || (data.position && data.position.x) || 0,
                y: data.y || (data.position && data.position.y) || 0,
                angle: data.angle || (data.position && data.position.yaw) || 0
            };
            const position = JSON.stringify(positionObj);
            const payload = {
                name,
                position,
                timestamp: new Date(),
                ip,
            };
            //console.log('Sending robot data to core server:', payload);
            await axios.post('http://localhost:3000/api/robots', payload);
        } catch (err) {
            console.error('Error parsing or sending TCP data:', err.message);
        }
    });

    socket.on('close', () => {
        //console.log('TCP client disconnected');
    });
});

tcpServer.listen(19301, () => {
    console.log('TCP server listening on port 19301');
});

setInterval(async () => {
    const now = Date.now();
    for (const [name, lastTime] of robotLastReceived.entries()) {
        if (now - lastTime > 5000) {
            console.log(`No data received from ${name} for 5 seconds. Marking as 연결 끊김.`);
            try {
                await axios.post('http://localhost:3000/api/robots', {
                    name,
                    status: '연결 끊김',
                    timestamp: new Date()
                });
                robotLastReceived.delete(name);
            } catch (err) {
                console.error(`Error updating status for ${name}:`, err.message);
            }
        }
    }
}, 100);

// ─────────────────────────────────────────────
// /ello/taskstart 엔드포인트 추가
// ─────────────────────────────────────────────

app.post('/ello/taskstart', async (req, res) => {
    const { robot_ip, task } = req.body;
    if (!robot_ip || !task) {
        return res.status(400).json({ success: false, message: 'robot_ip and task are required.' });
    }
    // remotePort: 로봇이 명령을 수신할 포트 (여기서는 19304)
    const remotePort = 19304;

    try {
        // task가 문자열이면 객체로 파싱
        let parsedTask = task;
        if (typeof task === 'string') {
            parsedTask = JSON.parse(task);
        }

        // steps 처리: steps 필드는 JSON 문자열 형태로 들어오므로 파싱하여 배열로 만듭니다.
        let stepsArray = [];
        if (parsedTask.steps && typeof parsedTask.steps === 'string') {
            try {
                stepsArray = JSON.parse(parsedTask.steps);
            } catch (e) {
                // 이미 배열이라면 그대로 사용
                stepsArray = parsedTask.steps;
            }
        } else if (Array.isArray(parsedTask.steps)) {
            stepsArray = parsedTask.steps;
        }

        // "경로" 유형의 단계만 추출하고 description을 숫자로 변환하여 사용
        const routeSteps = stepsArray
            .filter(step => step.stepType === "경로")
            .map(step => Number(step.description));

        // routeSteps 배열 확인 (콘솔 출력)
        console.log("전송할 routeSteps:", routeSteps);

        // TCP 클라이언트 연결 생성 및 메시지 전송
        const client = net.createConnection({ host: robot_ip, port: remotePort }, () => {
            console.log(`Connected to robot at ${robot_ip}:${remotePort}`);
            // 숫자 배열을 JSON 문자열로 전송
            client.write(JSON.stringify(routeSteps));
        });

        client.on('data', async (data) => {
            const msg = data.toString('utf-8');
            console.log('Received response from robot:', msg);
            let responseData;
            try {
                responseData = JSON.parse(msg);
            } catch (e) {
                console.error('Invalid JSON received from robot:', e.message);
                client.end();
                return;
            }
            // 예를 들어 responseData가 { task_id: ..., status: 'completed' } 형태라고 가정
            try {
                await axios.post('http://localhost:3000/api/tasks/updateStatus', responseData);
                console.log('Task status updated to core server.');
            } catch (updateErr) {
                console.error('Error updating task status to core server:', updateErr.message);
            }
            client.end();  // 연결 종료
        });

        client.on('error', (err) => {
            console.error('Error in TCP client connection:', err.message);
            res.status(500).json({ success: false, message: err.message });
        });

        client.on('end', () => {
            console.log('Disconnected from robot');
        });

        return res.json({ success: true, message: 'Task command sent to robot.' });
    } catch (err) {
        console.error('Error in /ello/taskstart:', err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});


// ioServer.js ───────────────────────────────────────────────
const NAV_PORT = 19206;
const MSG_GOTARGET_ID = 0x0BEB;      // 3051
const MSG_GOTARGET_RES = 0x32FB;      // 13051
let serialCounter = 1;

// ───── 패킷 유틸 ───────────────────────────
function buildPacket(type, json, serial) {
    const body = Buffer.from(JSON.stringify(json), 'utf8');
    const head = Buffer.alloc(16);
    head.writeUInt8(0x5A, 0);
    head.writeUInt8(0x01, 1);
    head.writeUInt16BE(serial, 2);
    head.writeUInt32BE(body.length, 4);
    head.writeUInt16BE(type, 8);
    return Buffer.concat([head, body]);
}
function parseHeader(buf) {
    return {
        sync: buf.readUInt8(0),
        ver: buf.readUInt8(1),
        serial: buf.readUInt16BE(2),
        len: buf.readUInt32BE(4),
        type: buf.readUInt16BE(8),
    };
}
// ──────────────────────────────────────────

app.post('/api/sendTask', async (req, res) => {
    const robot_ip = req.body.robot_ip || AMR_IP;
    const robot_name = req.body.robot_name || task.robot_name;
    const task = req.body.task;
    if (!task) return res.status(400).json({ success: false, message: 'task is required' });

    // 1) 경로 스텝 추출
    const stepsArr = typeof task.steps === 'string' ? JSON.parse(task.steps) : task.steps;
    const route = stepsArr.filter(s => s.stepType === '경로').map(s => s.description);
    if (!route.length)
        return res.status(400).json({ success: false, message: 'no route steps' });

    // 2) 즉시 OK 응답
    res.json({ success: true });

    // 3) 백그라운드 실행
    runTaskOverTcp(robot_ip, robot_name, task, route).catch(console.error);
});

/* ───────────────────────────────────────────────────────────
   백그라운드: 로봇과 순차 통신
───────────────────────────────────────────────────────────*/
async function runTaskOverTcp(ip, task, routeQueue) {
    const socket = net.createConnection({ host: ip, port: NAV_PORT });
    socket.setTimeout(20_000);

    let buffer = Buffer.alloc(0);
    let idx = 0;

    const sendDestination = () => {
        const dest = routeQueue[idx];
        const serial = serialCounter = (serialCounter + 1) & 0xFFFF;
        const payload = {
            id: dest,
            source_id: idx === 0 ? 'SELF_POSITION' : routeQueue[idx - 1],
            task_id: task.id?.toString(),
            method: 'forward',
            skill_name: 'GotoSpecifiedPose',
        };
        socket.write(buildPacket(MSG_GOTARGET_ID, payload, serial));
    };

    // 최초 전송
    sendDestination();

    socket.on('data', async (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);

        while (buffer.length >= 16) {
            const h = parseHeader(buffer.slice(0, 16));
            if (buffer.length < 16 + h.len) break;
            const packet = buffer.slice(0, 16 + h.len);
            buffer = buffer.slice(16 + h.len);

            if (h.type !== MSG_GOTARGET_RES) continue;         // 다른 응답 skip

            const body = JSON.parse(packet.slice(16).toString('utf8'));
            if (body.ret_code !== 0) return handleError(`robot ret_code ${body.ret_code}`);

            // ── 정상 도달 처리 ──
            idx++;
            const nextDest = routeQueue[idx] || null;

            try {
                await axios.post('http://localhost:3000/api/robots', {
                    name: task.robot_name,
                    destination: nextDest,
                    status: nextDest ? '이동' : '대기',
                    timestamp: new Date(),
                });

                if (!nextDest) {
                    // 모든 목적지 완료
                    await axios.put(`http://localhost:3000/api/tasks/${task.id}`, {
                        status: 'completed',
                        updated_at: new Date(),
                    });
                    socket.end();
                    return;
                }
            } catch (e) {
                return handleError('core update failed: ' + e.message);
            }

            // 다음 목적지 전송
            sendDestination();
        }
    });

    socket.on('error', (e) => handleError('TCP error: ' + e.message));
    socket.on('timeout', () => handleError('TCP timeout'));

    async function handleError(msg) {
        console.error('[sendTask] ' + msg);
        socket.destroy();
        try {
            await Promise.all([
                axios.post('http://localhost:3000/api/robots', {
                    name: task.robot_name,
                    status: '오류',
                    timestamp: new Date(),
                }),
                axios.put(`http://localhost:3000/api/tasks/${task.id}`, {
                    status: '오류',
                    updated_at: new Date(),
                }),
            ]);
        } catch (e) { console.error('[sendTask] fail to mark error:', e.message); }
    }
}




const PORT = 4000;
server.listen(PORT, () => {
    console.log(`ioServer running on port ${PORT}`);
});

module.exports = { app, io };
