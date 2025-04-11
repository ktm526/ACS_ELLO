// services/taskAllocator.js
// ───────────────────────────────────────────────────────────
const axios = require('axios');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const Task = require('../models/Task');
const Robot = require('../models/Robot');

// ────────────────────── 상수 ──────────────────────
const IO_SERVER_URL = `${process.env.IO_URL}/api/sendTask`;
const IO_TIMEOUT_MS = 20_000;   // 20 초
const LOOP_DELAY_MS = 500;      // 0.5 초
const COMPLETED_TTL = 60_000;   // 1 분

// priority 정렬용 CASE 식 (s → h → m → l)
const PRIORITY_ORDER = sequelize.literal(
    "CASE " +
    "WHEN priority='s' THEN 1 " +
    "WHEN priority='h' THEN 2 " +
    "WHEN priority='m' THEN 3 " +
    "WHEN priority='l' THEN 4 " +
    "ELSE 5 END"
);

// ────────────────────── 유틸 ──────────────────────
function extractFirstRoute(stepsField) {
    try {
        const arr = typeof stepsField === 'string' ? JSON.parse(stepsField) : stepsField;
        const first = Array.isArray(arr) ? arr.find(s => s.stepType === '경로') : null;
        return first ? first.description : null;
    } catch {
        return null;
    }
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ────────────────────── 초기 정리 작업 ──────────────────────
async function resetStuckSendingTasks() {
    try {
        const [cnt] = await Task.update(
            { status: 'pending', updated_at: new Date() },
            { where: { status: 'sending' } }
        );
        if (cnt) console.log(`[Allocator] reset ${cnt} stuck tasks to 'pending'`);
    } catch (err) {
        console.error('[Allocator] error resetting sending tasks:', err.message);
    }
}

// ────────────────────── 완료 태스크 청소 ──────────────────────
async function deleteExpiredCompletedTasks() {
    try {
        const threshold = new Date(Date.now() - COMPLETED_TTL);
        const deleted = await Task.destroy({
            where: {
                status: 'completed',
                updated_at: { [Op.lt]: threshold },
            },
        });
        if (deleted) {
            console.log(`[Allocator] deleted ${deleted} completed tasks (>1 min old)`);
        }
    } catch (err) {
        console.error('[Allocator] error deleting completed tasks:', err.message);
    }
}

// ────────────────────── 단일 할당 시도 ──────────────────────
async function allocateOnce() {
    // DB 트랜잭션 & 레코드 잠금으로 중복 할당 방지
    return sequelize.transaction(async (t) => {
        // 1. idle 로봇
        const robot = await Robot.findOne({
            where: { status: '대기' },
            order: [['timestamp', 'ASC']],
            lock: t.LOCK.UPDATE,
            transaction: t,
        });
        if (!robot) return null;

        // 2. 우선순위 + 생성순 pending 태스크
        const task = await Task.findOne({
            where: { status: 'pending' },
            order: [[PRIORITY_ORDER, 'ASC'], ['created_at', 'ASC']],
            lock: t.LOCK.UPDATE,
            transaction: t,
        });
        if (!task) return null;

        // 3. sending 으로 선표시
        await task.update(
            { status: 'sending', updated_at: new Date() },
            { transaction: t }
        );

        return { robot, task };
    });
}

// ────────────────────── ioServer 전송 & 후처리 ──────────────────────
async function handleAllocation({ robot, task }) {
    const payload = { robot_ip: robot.ip, robot_name: robot.name, task };

    try {
        const ioResp = await axios.post(IO_SERVER_URL, payload, { timeout: IO_TIMEOUT_MS });

        if (ioResp.data && ioResp.data.success) {
            // 성공: 로봇·태스크 업데이트
            const destination = extractFirstRoute(task.steps);
            await Promise.all([
                robot.update({ status: '이동', destination }),
                task.update({
                    status: 'in_progress',
                    robot_name: robot.name,
                    updated_at: new Date(),
                }),
            ]);
        } else {
            // 실패 응답 → pending 복귀
            await task.update({ status: 'pending', updated_at: new Date() });
        }
    } catch (err) {
        // 타임아웃·네트워크 오류 포함
        console.error('[Allocator] sendTask error:', err.message);
        await task.update({ status: 'pending', updated_at: new Date() });
    }
}

// ────────────────────── 메인 루프 ──────────────────────
async function runAllocatorLoop() {
    await resetStuckSendingTasks();

    // 무한 루프
    while (true) {
        try {
            await deleteExpiredCompletedTasks();

            const result = await allocateOnce();
            if (result) {
                await handleAllocation(result);
            }
        } catch (err) {
            console.error('[Allocator] loop error:', err.message);
        }

        await sleep(LOOP_DELAY_MS);
    }
}

module.exports = { runAllocatorLoop };
