import React, { useState, useRef, useEffect } from "react";
import "./TaskListItem.css";
import TrashIcon from "../../assets/icons/trash.svg";
import ToggleIcon from "../../assets/icons/toggle.svg";

const TaskListItem = ({ task, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((prev) => !prev);

  const extraInfoRef = useRef(null);
  const [extraInfoHeight, setExtraInfoHeight] = useState(0);

  useEffect(() => {
    if (extraInfoRef.current) {
      setExtraInfoHeight(extraInfoRef.current.scrollHeight);
    }
  }, [expanded, task.additional_info, task.steps]);

  // 제목: steps 배열이 존재하면 첫 waypoint와 마지막 waypoint를 사용, 없으면 start_location과 destination_location
  let titleText = "";
  if (task.steps) {
    try {
      const steps = JSON.parse(task.steps);
      const first = steps[0]?.waypoint || "";
      const last = steps[steps.length - 1]?.waypoint || "";
      titleText = `Task ${task.id}: ${first} - ${last}`;
    } catch (e) {
      titleText = `Task ${task.id}: ${task.start_location} - ${task.destination_location}`;
    }
  } else {
    titleText = `Task ${task.id}: ${task.start_location} - ${task.destination_location}`;
  }

  const handleDeleteClick = () => {
    if (window.confirm(`정말로 Task ${task.id}를 삭제하시겠습니까?`)) {
      onDelete(task.id);
    }
  };

  return (
    <div className={`task-list-item ${expanded ? "expanded" : ""}`}>
      <div className="task-item-content">
        {/* 왼쪽 영역: 제목과 상태 */}
        <div className="task-item-left">
          <div className="task-main">{titleText}</div>
          <div className="task-status">{task.status}</div>
        </div>
        {/* 오른쪽 영역: 할당된 로봇명, 삭제 버튼, 토글 버튼 */}
        <div className="task-item-right">
          <div className="assigned-robot">
            {task.robot_name ? task.robot_name : "미할당"}
          </div>
          <button className="delete-button" onClick={handleDeleteClick}>
            <img src={TrashIcon} alt="Delete" width="20" height="20" />
          </button>
          <button className="toggle-button" onClick={toggleExpanded}>
            <span className={`toggle-icon ${expanded ? "rotated" : ""}`}>
              <img src={ToggleIcon} alt="Toggle" width="16" height="16" />
            </span>
          </button>
        </div>
      </div>
      <div
        className="task-extra-info-wrapper"
        style={{ maxHeight: expanded ? `${extraInfoHeight}px` : "0px" }}
        ref={extraInfoRef}
      >
        <div className="task-extra-info">
          <p>
            <strong>Task Type:</strong> {task.task_type}
          </p>
          <p>
            <strong>Priority:</strong> {task.priority}
          </p>
          <p>
            <strong>Additional Info:</strong> {task.additional_info || "없음"}
          </p>
          {task.steps && (
            <p>
              <strong>Steps:</strong> {task.steps}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskListItem;
