// models/Log.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Log = sequelize.define('Log', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    endpoint: {
        type: DataTypes.STRING
    },
    method: {
        type: DataTypes.STRING
    },
    response_data: {
        type: DataTypes.TEXT
    },
    request_data: {
        type: DataTypes.TEXT
    },
    status_code: {
        type: DataTypes.INTEGER
    },
    response_time: {
        type: DataTypes.DATE
    },
    request_time: {
        type: DataTypes.DATE
    },
    error_message: {
        type: DataTypes.TEXT
    },
    additional_info: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'Logs',
    timestamps: false
});

module.exports = Log;
