const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Map = sequelize.define('Map', {
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
        type: DataTypes.JSON, // JSON 타입 사용 (내부적으로 TEXT로 처리됨)
        allowNull: true
    },
    path: {
        type: DataTypes.JSON,
        allowNull: true
    },
    additional_info: {
        type: DataTypes.TEXT
    },
    // 최근 업데이트 날짜 필드 추가
    last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'Maps',
    timestamps: false // Sequelize의 자동 타임스탬프를 사용하지 않으므로 false로 설정
});

module.exports = Map;
