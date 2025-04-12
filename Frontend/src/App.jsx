import React, { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import ResponsiveSidebar from "./components/ResponsiveSidebar";
import { AppProvider } from "./context/AppContext";
import "./styles/global.css";

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // 창 크기 변화 감지
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 창 크기나 sidebarCollapsed 상태가 바뀔 때 CSS 변수 업데이트
  useEffect(() => {
    if (window.innerWidth >= 768) {
      document.documentElement.style.setProperty(
        "--current-sidebar-width",
        sidebarCollapsed
          ? "var(--sidebar-collapsed-width)"
          : "var(--sidebar-width)"
      );
    } else {
      document.documentElement.style.setProperty(
        "--current-sidebar-width",
        "0px"
      );
    }
  }, [windowWidth, sidebarCollapsed]);

  return (
    <AppProvider>
      <BrowserRouter>
        <ResponsiveSidebar onCollapseChange={setSidebarCollapsed} />
        <main
          className="main-container"
          style={{
            marginLeft:
              window.innerWidth >= 768 ? "var(--current-sidebar-width)" : "0px",
            transition: "margin-left 0.3s ease",
          }}
        >
          <AppRoutes />
        </main>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
