import React, { useRef, useEffect, useState } from "react";
import "./TaskListItem.css";
import TrashIcon from "../../assets/icons/trash.svg";
import ToggleIcon from "../../assets/icons/toggle.svg";
import RunIcon from "../../assets/icons/run.svg";
import axios from "axios";

const TaskListItem = ({
  icon,
  name,
  status,
  expanded,
  onToggle,
  onDelete,
  task,
  details,
}) => {
  const wrapperRef = useRef(null);
  const [height, setHeight] = useState(0);

  // 로컬 상태: 재생/일시정지 상태 (단순 토글 예시; 필요에 따라 상태값 연동)
  const [isRunning, setIsRunning] = useState(status === "in_progress");

  useEffect(() => {
    if (wrapperRef.current) {
      setHeight(wrapperRef.current.scrollHeight);
    }
  }, [expanded, details]);

  // 재생/일시정지 버튼 클릭 핸들러
  const handleTogglePlayPause = async () => {
    try {
      const API = import.meta.env.VITE_CORE_BASE_URL; // Core 서버 기본 URL
      // 단순 예시: 현재 running 상태면 "pause", 아니면 "resume"
      const command = isRunning ? "pause" : "resume";
      await axios.post(`${API}/api/tasks/${task.id}/control`, { command });
      setIsRunning(!isRunning);
      alert(`Task ${task.id} ${command} 명령이 전송되었습니다.`);
    } catch (err) {
      console.error(
        `Error sending play/pause command for task ${task.id}:`,
        err
      );
      alert("명령 전송에 실패했습니다.");
    }
  };

  // 취소 버튼 클릭 핸들러
  const handleCancelTask = async () => {
    try {
      const API = import.meta.env.VITE_CORE_BASE_URL;
      await axios.post(`${API}/api/tasks/${task.id}/control`, {
        command: "cancel",
      });
      alert(`Task ${task.id} 취소 명령이 전송되었습니다.`);
    } catch (err) {
      console.error(`Error sending cancel command for task ${task.id}:`, err);
      alert("취소 명령 전송에 실패했습니다.");
    }
  };

  // 삭제 버튼 (기존)
  const handleDelete = () => {
    if (window.confirm(`정말로 "${name}"을(를) 삭제하시겠습니까?`)) {
      onDelete();
    }
  };

  return (
    <div className={`task-list-item ${expanded ? "expanded" : ""}`}>
      <div className="task-item-content">
        {/* 왼쪽: 아이콘 + 이름/상태 */}
        <button
          className="control-button"
          onClick={handleTogglePlayPause}
          title="재생/일시정지"
        >
          <img src={RunIcon} alt="Run/Pause" width="20" height="20" />
        </button>

        <div className="task-item-left">
          <div className="task-main">{name}</div>
          <div className="task-status">{status}</div>
        </div>
        {/* 오른쪽: 삭제, 토글, 재생/일시정지, 취소 버튼 */}
        <div className="task-item-right">
          <div className="assigned-robot">
            {task.robot_name ? task.robot_name : "미할당"}
          </div>

          <button
            className="control-button"
            onClick={handleCancelTask}
            title="취소"
          >
            <img src={TrashIcon} alt="Cancel" width="20" height="20" />
          </button>
          <button className="toggle-button" onClick={onToggle}>
            <span className={`toggle-icon ${expanded ? "rotated" : ""}`}>
              <img src={ToggleIcon} alt="Toggle" width="16" height="16" />
            </span>
          </button>
        </div>
      </div>

      {/* 확장된 상세영역 */}
      <div
        className="task-extra-info-wrapper"
        style={{ maxHeight: expanded ? `${height}px` : "0px" }}
        ref={wrapperRef}
      >
        <div className="task-extra-info">{details}</div>
      </div>
    </div>
  );
};

export default TaskListItem;
