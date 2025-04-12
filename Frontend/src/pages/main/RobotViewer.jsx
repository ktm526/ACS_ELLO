import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RobotViewer.css";

// 헤더 아이콘 (필요에 따라 다른 아이콘으로 변경 가능)
import ListIcon from "../../assets/icons/list.svg";
// mock_robot에서 사용한 AMRListItem 컴포넌트를 재사용합니다.
import AMRListItem from "./AMRListItem";

const RobotViewer = () => {
  const [robots, setRobots] = useState([]);

  useEffect(() => {
    // 50ms 간격으로 Core Server의 /api/robots 엔드포인트를 폴링합니다.
    const interval = setInterval(async () => {
      try {
        const API = import.meta.env.VITE_CORE_BASE_URL; // Vite

        const response = await axios.get(`${API}/api/robots`);
        if (response.data && response.data.data) {
          console.log(response.data);
          setRobots(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching robot data:", error);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id) => {
    // DELETE /api/robots/:id 엔드포인트 호출
    const API = import.meta.env.VITE_CORE_BASE_URL; // Vite

    axios
      .delete(`${API}/api/robots/${id}`)
      .then((res) => {
        console.log("Deleted robot", res.data);
        // 삭제한 로봇은 현 상태에서 제거합니다.
        setRobots((prev) => prev.filter((robot) => robot.id !== id));
      })
      .catch((err) => console.error("Delete robot error:", err));
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <div className="header-left">
          <img
            className="header-icon"
            src={ListIcon}
            alt="List Icon"
            width="16"
            height="16"
          />
          <h2>AMR 정보</h2>
        </div>
        {/* 추가 버튼 제거 */}
      </div>
      <div className="list-items">
        {robots.length > 0 ? (
          robots.map((robot) => (
            <AMRListItem
              key={robot.id}
              // 실제 상황에 따라 로봇 전용 아이콘으로 변경 가능
              icon={ListIcon}
              name={robot.name}
              status={robot.status}
              extraInfo={`Position: ${robot.position} | IP: ${robot.ip}`}
              onDelete={() => handleDelete(robot.id)}
            />
          ))
        ) : (
          <p>No robot data available.</p>
        )}
      </div>
    </div>
  );
};

export default RobotViewer;
