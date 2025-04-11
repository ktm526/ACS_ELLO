import React, { useRef, useEffect, useState } from "react";
import "./TaskListItem.css";
import TrashIcon from "../../assets/icons/trash.svg";
import ToggleIcon from "../../assets/icons/toggle.svg";

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

  useEffect(() => {
    if (wrapperRef.current) {
      setHeight(wrapperRef.current.scrollHeight);
    }
  }, [expanded, details]);

  const handleDelete = () => {
    if (window.confirm(`정말로 "${name}"을(를) 삭제하시겠습니까?`)) {
      onDelete();
    }
  };

  return (
    <div className={`task-list-item ${expanded ? "expanded" : ""}`}>
      <div className="task-item-content">
        {/* 왼쪽: 아이콘 + 이름/상태 */}
        <div className="task-item-left">
          {/* <div className="task-icon">
            <img src={icon} alt="Item Icon" width="24" height="24" />
          </div> */}
          <div className="task-main">{name}</div>
          <div className="task-status">{status}</div>
        </div>

        {/* 오른쪽: 삭제 / 토글 */}
        <div className="task-item-right">
          <div className="assigned-robot">
            {task.robot_name ? task.robot_name : "미할당"}
          </div>
          <button className="delete-button" onClick={handleDelete}>
            <img src={TrashIcon} alt="Delete" width="20" height="20" />
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
