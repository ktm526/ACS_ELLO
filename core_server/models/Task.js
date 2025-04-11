// models/Task.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    robot_name: {
        type: DataTypes.STRING,
        allowNull: true,  // 로봇 이름은 선택사항
    },
    task_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    steps: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',  // JSON 문자열 형태로 각 단계 정보를 저장 (ex: '[{...}, {...}]')
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
    repeat: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
    tableName: 'Tasks',
    timestamps: false,
});

module.exports = Task;
