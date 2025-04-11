// models/Robot.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Robot = sequelize.define('Robot', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: { // vehicle_id를 name으로 사용
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: { // 상태 ENUM, '연결 끊김' 추가
        type: DataTypes.STRING,
        // values: ["대기", "이동", "정지", "충전", "오류", "비상정지", "보류", "연결 끊김"],
        defaultValue: "대기",
    },
    mode: { // 모드
        type: DataTypes.STRING,
        defaultValue: "auto",
    },
    timestamp: { // 타임스탬프
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    location: {
        type: DataTypes.STRING,
    },
    next_location: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    destination: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    task_step: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    additional_info: {
        type: DataTypes.TEXT,
    },
    // 좌표 정보를 하나의 항목(position)으로 저장 (JSON 문자열)
    position: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // 새 필드: 로봇의 IP 주소
    ip: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'Robots',
    timestamps: false,
});

module.exports = Robot;
