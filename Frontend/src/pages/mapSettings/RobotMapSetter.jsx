// src/pages/Log/RobotMapSetter.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RobotMapSetter.css";
import ListIcon from "../../assets/icons/list.svg";

export default function RobotMapSetter() {
  /* 로봇 목록 */
  const [robots, setRobots] = useState([]);
  const [expanded, setExpanded] = useState({}); // name -> {loading,data}
  const API = import.meta.env.VITE_CORE_BASE_URL; // Vite
  const IO_API = import.meta.env.VITE_IO_BASE_URL;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/api/robots`);
        if (res.data?.data) setRobots(res.data.data);
      } catch (e) {
        console.error("robots fetch error", e);
      }
    };
    fetch();
    const id = setInterval(fetch, 3_000); // 3초 주기 갱신
    return () => clearInterval(id);
  }, []);

  /* 토글 클릭 */
  const toggle = async (r) => {
    if (expanded[r.name]) {
      setExpanded((prev) => ({ ...prev, [r.name]: undefined }));
      return;
    }
    setExpanded((prev) => ({ ...prev, [r.name]: { loading: true } }));
    try {
      const res = await axios.get(
        `${IO_API}/api/robot/${encodeURIComponent(r.name)}/maps`
      );
      setExpanded((prev) => ({
        ...prev,
        [r.name]: { loading: false, data: res.data.data },
      }));
    } catch (e) {
      setExpanded((prev) => ({
        ...prev,
        [r.name]: { loading: false, error: e.message },
      }));
    }
  };

  /* UI */
  return (
    <div className="robot-map-setter-container">
      <div className="list-header">
        <div className="header-left">
          <img src={ListIcon} alt="" width={16} height={16} />
          <h2>로봇 맵 파일</h2>
        </div>
      </div>

      <ul className="robot-list">
        {robots.map((r) => (
          <li key={r.name} className="robot-item">
            <button
              className="toggle-btn"
              onClick={() => toggle(r)}
              title="맵 목록 보기"
            >
              {expanded[r.name] ? "▾" : "▸"}
            </button>
            <span className="robot-name">{r.name}</span>

            {/* 확장 영역 */}
            {expanded[r.name] && (
              <div className="map-panel">
                {expanded[r.name].loading && <p>loading…</p>}
                {expanded[r.name].error && (
                  <p className="error">{expanded[r.name].error}</p>
                )}
                {expanded[r.name].data && (
                  <ul>
                    {expanded[r.name].data.maps.map((m) => (
                      <li
                        key={m}
                        className={
                          m === expanded[r.name].data.current_map
                            ? "current-map"
                            : ""
                        }
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
