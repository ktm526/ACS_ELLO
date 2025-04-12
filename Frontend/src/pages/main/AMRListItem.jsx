import React, { useState, useRef, useEffect } from "react";
import "./AMRListItem.css";
import TrashIcon from "../../assets/icons/trash.svg";
import ToggleIcon from "../../assets/icons/toggle.svg";

const AMRListItem = ({ name, status, extraInfo, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((prev) => !prev);

  const extraInfoRef = useRef(null);
  const [extraInfoHeight, setExtraInfoHeight] = useState(0);

  useEffect(() => {
    if (extraInfoRef.current) {
      setExtraInfoHeight(extraInfoRef.current.scrollHeight);
    }
  }, [expanded, extraInfo]);

  const handleDeleteClick = () => {
    if (window.confirm("정말로 삭제하시겠습니까?")) {
      onDelete();
    }
  };
  const statusColor = (status) => {
    switch (status) {
      case "연결 끊김":
        return "#EC6A5E"; // 빨강
      case "오류":
        return "#EC6A5E"; // 빨강
      case "정지":
        return "#FDBC2C"; // 노랑
      case "이동":
        return "#78B756"; // 초록
      case "대기":
        return "#192BB4"; // 파랑
      default:
        return "#4a4a4a"; // 진한 회색
    }
  };

  return (
    <div className={`amr-list-item ${expanded ? "expanded" : ""}`}>
      <div className="amr-item-content">
        <div className="amr-item-left">
          <div
            className="amr-status-dot"
            style={{ backgroundColor: statusColor(status) }}
          />
          <div className="amr-info">
            <div className="amr-name">{name}</div>
            <div className="amr-status">{status}</div>
          </div>
        </div>
        <div className="amr-item-right">
          <button className="delete-button" onClick={handleDeleteClick}>
            <img src={TrashIcon} alt="Trash Icon" width="20" height="20" />
          </button>
          <button className="toggle-button" onClick={toggleExpanded}>
            <span className={`toggle-icon ${expanded ? "rotated" : ""}`}>
              <img src={ToggleIcon} alt="Toggle Icon" width="16" height="16" />
            </span>
          </button>
        </div>
      </div>
      <div
        className="amr-extra-info-wrapper"
        style={{ maxHeight: expanded ? `${extraInfoHeight}px` : "0px" }}
        ref={extraInfoRef}
      >
        <div className="amr-extra-info">
          {extraInfo || "추가 정보 내용이 여기에 표시됩니다."}
        </div>
      </div>
    </div>
  );
};

export default AMRListItem;
