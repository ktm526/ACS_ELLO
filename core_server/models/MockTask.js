// models/MockTask.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MockTask = sequelize.define('MockTask', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    robot_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    task_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // 새로운 필드: steps (각 단계는 waypoint 또는 instruction 객체)
    steps: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '' // 기본값 지정

        // 예시 값:
        // '[{"waypoint": "A"}, {"waypoint": "B"}, {"instruction": "Pick up item"}, {"waypoint": "C"}]'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
    },
    priority: {
        type: DataTypes.ENUM,
        values: ["s", "h", "m", "l"],
        allowNull: false,
        defaultValue: "m",
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    additional_info: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'Mock_Tasks',
    timestamps: false,
});

module.exports = MockTask;
