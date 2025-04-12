// src/routes/AppRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Main from "../pages/main/Main";
import MapSettings from "../pages/mapSettings/MapSettings";
import Simulation from "../pages/simulation/Simulation";
import LogViewer from "../pages/Log/LogViewer"; // 🔹 새 로그 페이지

import Settings from "../pages/Settings";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Main />} />
      <Route path="/map-settings" element={<MapSettings />} />
      <Route path="/simulation" element={<Simulation />} />
      <Route path="/logs" element={<LogViewer />} /> {/* 🔹 추가 */}
      <Route path="/settings" element={<Settings />} />
      {/* 존재하지 않는 경로는 메인 페이지로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
