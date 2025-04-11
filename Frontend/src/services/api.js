// src/services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // 백엔드(core_server) API URL (필요에 따라 수정)
    timeout: 5000,
});

// 예시: 로그인 API 호출
export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

// 다른 API 함수들을 이곳에 추가하세요
export default api;
