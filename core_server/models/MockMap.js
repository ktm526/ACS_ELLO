// models/MockMap.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MockMap = sequelize.define('MockMap', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    station: {
        // JSON 데이터를 문자열로 저장하거나, 데이터베이스가 지원한다면 JSON 타입을 사용
        type: DataTypes.TEXT,
        allowNull: true
    },
    path: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    additional_info: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'Mock_Maps',
    timestamps: false
});

module.exports = MockMap;
