// src/context/AppContext.jsx
import React, { createContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  /* 기존 전역 상태 -------------------------------------------------- */
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");

  /* 새로 추가: 현재 선택된 맵의 스테이션 목록 ------------------------ */
  const [stationList, setStationList] = useState([]); // [{id,x,y,...}, ...]

  /* 유틸 함수들 ------------------------------------------------------ */
  const login = (userData) => setUser(userData);
  const logout = () => setUser(null);
  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const contextValue = {
    /* 기존 */
    user,
    theme,
    login,
    logout,
    toggleTheme,
    /* 추가 */
    stationList,
    setStationList,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
