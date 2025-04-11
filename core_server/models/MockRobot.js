// models/MockRobot.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MockRobot = sequelize.define('MockRobot', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    simulated_status: {
        type: DataTypes.ENUM,
        values: ["대기", "이동", "정지", "충전", "오류", "비상정지", "보류"],
        defaultValue: "대기",
    },
    simulated_mode: {
        type: DataTypes.STRING,
        defaultValue: "auto",
    },
    simulated_timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    simulated_location: {
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
    // 추가: 좌표 정보를 하나의 항목(position)으로 저장 (JSON 문자열)
    position: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'Mock_Robots',
    timestamps: false,
});

module.exports = MockRobot;
