// src/pages/simulation/Simulation.jsx
import React, { useState, useEffect } from "react";
import "./Simulation.css";
import Monitoring from "./monitoring/Monitoring";
import AMRList from "./AMRList";
import TaskList from "./TaskList";
import apiClient from "../../utils/apiClient";

const Simulation = () => {
  const [mapData, setMapData] = useState(null);
  const [amrItems, setAmrItems] = useState([]);
  const [taskItems, setTaskItems] = useState([]);

  // 맵 데이터 가져오기 (예시: 첫 번째 맵 데이터)
  useEffect(() => {
    apiClient
      .get("/mock/maps")
      .then((res) => {
        if (res.data && res.data.data && res.data.data.length > 0) {
          setMapData(res.data.data[0]);
        }
      })
      .catch((err) => console.error("Failed to fetch map data:", err));
  }, []);

  // AMR 데이터 가져오기
  useEffect(() => {
    const fetchAMRData = () => {
      apiClient
        .get("/mock/robots")
        .then((res) => {
          if (res.data && res.data.data) {
            setAmrItems(res.data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch AMR data:", err));
    };
    fetchAMRData();
    const interval = setInterval(fetchAMRData, 100);
    return () => clearInterval(interval);
  }, []);

  // 태스크 데이터 가져오기
  useEffect(() => {
    const fetchTaskData = () => {
      apiClient
        .get("/mock/tasks")
        .then((res) => {
          if (res.data && res.data.data) {
            setTaskItems(res.data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch Task data:", err));
    };
    fetchTaskData();
    const interval = setInterval(fetchTaskData, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="simulation-container">
      <div className="left-container">
        {/* Monitoring 컴포넌트는 mapData를 받아서 MapCanvas 등 내부에서 사용 */}
        <Monitoring mapData={mapData} amrItems={amrItems} />
      </div>
      <div className="right-container">
        <div className="top-container">
          {/* AMRList는 amrItems와 상태 업데이트 함수를 props로 받음 */}
          <AMRList amrItems={amrItems} setAmrItems={setAmrItems} />
        </div>
        <div className="bottom-container">
          {/* TaskList는 taskItems와 상태 업데이트 함수를 props로 받음 */}
          <TaskList taskItems={taskItems} setTaskItems={setTaskItems} />
        </div>
      </div>
    </div>
  );
};

export default Simulation;
