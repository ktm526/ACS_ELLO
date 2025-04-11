// src/components/ResponsiveSidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./ResponsiveSidebar.css";

// (예시) 아이콘 임포트 – 실제 경로와 파일명에 맞게 수정하세요.
import DashboardIcon from "../assets/icons/dashboard.svg";
import MapSettingsIcon from "../assets/icons/map-settings.svg";
import SimulationIcon from "../assets/icons/simulation.svg";
import LogsIcon from "../assets/icons/logs.svg";
import SettingsIcon from "../assets/icons/settings.svg";
import LogoutIcon from "../assets/icons/logout.svg";
import imroboticsLogo from "../assets/imrobotics_logo.png";
import motomindLogo from "../assets/motomind_logo.png";

const ResponsiveSidebar = ({ onCollapseChange }) => {
  const [menuOpen, setMenuOpen] = useState(false); // 모바일 메뉴 상태
  const [isCollapsed, setIsCollapsed] = useState(false); // 데스크탑 사이드바 collapse 상태
  const location = useLocation();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // 전체 사이드바 클릭 시 collapse 토글하고 상위에 전달
  const handleSidebarClick = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onCollapseChange) {
      onCollapseChange(newCollapsed);
    }
  };

  return (
    <>
      {/* 모바일 상단 네비게이션 */}
      <div className="mobile-navbar">
        <button className="hamburger" onClick={toggleMenu}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <div className="mobile-logo">
          <img src={motomindLogo} alt="Logo" className="mobile-logo-img" />
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      <nav className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li>
            <Link to="/" onClick={closeMenu}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/map-settings" onClick={closeMenu}>
              Map Settings
            </Link>
          </li>
          <li>
            <Link to="/simulation" onClick={closeMenu}>
              Simulation
            </Link>
          </li>
          <li>
            <Link to="/logs" onClick={closeMenu}>
              Logs
            </Link>
          </li>
          <li>
            <Link to="/settings" onClick={closeMenu}>
              Settings
            </Link>
          </li>
        </ul>
        <button className="logout-button" onClick={closeMenu}>
          Logout
        </button>
      </nav>

      {/* 데스크탑용 좌측 사이드바 */}
      <aside
        className={`desktop-sidebar ${isCollapsed ? "collapsed" : ""}`}
        onClick={handleSidebarClick} // 전체 영역 클릭 시 collapse 토글
      >
        {/* 로고 영역: 항상 상단 – 내부 클릭은 이벤트 전파 차단 */}
        <div className="sidebar-logo">
          <img src={motomindLogo} alt="Logo" className="logo-img" />
        </div>
        {/* 인터랙티브 영역: 메뉴와 로그아웃 버튼 */}
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <ul>
              <li>
                <Link
                  to="/"
                  onClick={(e) => e.stopPropagation()}
                  className={location.pathname === "/" ? "active" : ""}
                >
                  <img
                    src={DashboardIcon}
                    alt="대시보드"
                    className="menu-icon"
                  />
                  <span className="menu-text">{!isCollapsed && "메인"}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/map-settings"
                  onClick={(e) => e.stopPropagation()}
                  className={
                    location.pathname === "/map-settings" ? "active" : ""
                  }
                >
                  <img
                    src={MapSettingsIcon}
                    alt="Map Settings"
                    className="menu-icon"
                  />
                  <span className="menu-text">{!isCollapsed && "맵 설정"}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/simulation"
                  onClick={(e) => e.stopPropagation()}
                  className={
                    location.pathname === "/simulation" ? "active" : ""
                  }
                >
                  <img
                    src={SimulationIcon}
                    alt="Simulation"
                    className="menu-icon"
                  />
                  <span className="menu-text">
                    {!isCollapsed && "시뮬레이션"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/logs"
                  onClick={(e) => e.stopPropagation()}
                  className={location.pathname === "/logs" ? "active" : ""}
                >
                  <img src={LogsIcon} alt="Logs" className="menu-icon" />
                  <span className="menu-text">{!isCollapsed && "로그"}</span>
                </Link>
              </li>
              {/* <li>
                <Link
                  to="/settings"
                  onClick={(e) => e.stopPropagation()}
                  className={location.pathname === "/settings" ? "active" : ""}
                >
                  <img
                    src={SettingsIcon}
                    alt="Settings"
                    className="menu-icon"
                  />
                  <span className="menu-text">{!isCollapsed && "설정"}</span>
                </Link>
              </li> */}
            </ul>
          </nav>
          {/* <div className="sidebar-footer">
            <button
              className="logout-button"
              onClick={(e) => {
                e.stopPropagation();
                // 로그아웃 처리 함수 추가
              }}
            >
              <img src={LogoutIcon} alt="Logout" className="menu-icon" />
              <span className="menu-text">{!isCollapsed && "Logout"}</span>
            </button>
          </div> */}
        </div>
      </aside>
    </>
  );
};

export default ResponsiveSidebar;
