// src/pages/simulation/monitoring/Monitoring.jsx
import React from "react";
import "./Monitoring.css";
import MapCanvas from "./MapCanvas";
import apiClient from "../../../utils/apiClient";
import MapIcon from "../../../assets/icons/map-settings.svg";

const Monitoring = ({ mapData, amrItems }) => {
  // "시작" 버튼을 누르면 할당 API를 호출
  const handleStart = async () => {
    try {
      const res = await apiClient.post("/mock/tasks/assignAndSimulateAll");
      console.log("Assignment result:", res.data);
      // 필요시 성공 메시지 표시 또는 상태 업데이트 처리
      alert(res.data.message);
    } catch (error) {
      console.error("Assignment error:", error);
      alert("Task assignment failed.");
    }
  };

  return (
    <div className="monitoring">
      <div className="monitoring-header">
        <div className="header-left">
          <img src={MapIcon} alt="List" width={16} height={16} />

          <h2>모니터링</h2>
        </div>
        <div className="header-right">
          <button className="action-button start-button" onClick={handleStart}>
            <svg className="button-icon" viewBox="0 0 24 24">
              <polygon points="8,5 19,12 8,19" fill="#fff" />
            </svg>
            시작
          </button>
          <button className="action-button refresh-button">
            <svg className="button-icon" viewBox="0 0 24 24">
              <path
                d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 .34-.03.67-.08 1h2.02c.05-.33.06-.66.06-1 0-4.42-3.58-8-8-8z"
                fill="#fff"
              />
            </svg>
            새로고침
          </button>
        </div>
      </div>
      <div className="monitoring-canvas">
        <MapCanvas mapData={mapData} amrItems={amrItems} />
      </div>
    </div>
  );
};

export default Monitoring;
