import React, { useState, useRef, useEffect } from "react";
import "./AMRListItem.css";

// 이미지로 아이콘 불러오기
import TrashIcon from "../../assets/icons/trash.svg";
import ToggleIcon from "../../assets/icons/toggle.svg";

const AMRListItem = ({ icon, name, status, extraInfo, onDelete, onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded((prev) => !prev);

  const extraInfoRef = useRef(null);
  const [extraInfoHeight, setExtraInfoHeight] = useState(0);

  useEffect(() => {
    if (extraInfoRef.current) {
      setExtraInfoHeight(extraInfoRef.current.scrollHeight);
    }
  }, [expanded, extraInfo]);

  // 삭제 버튼 클릭 시 확인 메시지를 띄운 후, onDelete 호출
  const handleDeleteClick = () => {
    if (window.confirm("정말로 삭제하시겠습니까?")) {
      onDelete();
    }
  };

  return (
    <div className={`amr-list-item ${expanded ? "expanded" : ""}`}>
      <div className="amr-item-content">
        <div className="amr-item-left">
          <div className="amr-icon">
            <img src={icon} alt="Item Icon" width="24" height="24" />
          </div>
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
          {extraInfo ? extraInfo : "추가 정보 내용이 여기에 표시됩니다."}
        </div>
      </div>
    </div>
  );
};

export default AMRListItem;
