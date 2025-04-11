// utils/httpClient.js
const axios = require('axios');
const deviceConfig = require('../config/deviceConfig');

exports.sendCommand = async (endpoint, data) => {
    try {
        const response = await axios.post(deviceConfig.robotControlServerURL + endpoint, data, {
            timeout: deviceConfig.timeout
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
