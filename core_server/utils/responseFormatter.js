// utils/responseFormatter.js
exports.successResponse = (data) => {
    return {
        success: true,
        data
    };
};

exports.errorResponse = (message) => {
    return {
        success: false,
        message
    };
};
