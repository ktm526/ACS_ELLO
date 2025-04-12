// src/utils/apiClient.js
import axios from "axios";

const API = import.meta.env.VITE_CORE_BASE_URL; // Vite

const apiClient = axios.create({
    baseURL: `${API}/api`,
});

export default apiClient;
