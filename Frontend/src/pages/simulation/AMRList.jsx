// src/pages/simulation/AMRList.jsx
import React, { useState } from "react";
import "./AMRList.css";
import AMRListItem from "./AMRListItem";
import ListIcon from "../../assets/icons/list.svg";
import AMRIcon from "../../assets/icons/amr.svg";
import PlusIcon from "../../assets/icons/plus.svg";
import apiClient from "../../utils/apiClient";

const AMRList = ({ amrItems, setAmrItems }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRobot, setNewRobot] = useState({
    name: "",
    simulated_status: "대기",
    simulated_mode: "auto",
    simulated_location: "",
    additional_info: "",
  });

  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    apiClient
      .post("/mock/robots", newRobot)
      .then((res) => {
        console.log("Added new robot", res.data);
        setIsModalOpen(false);
        setNewRobot({
          name: "",
          simulated_status: "대기",
          simulated_mode: "auto",
          simulated_location: "",
          additional_info: "",
        });
      })
      .catch((err) => console.error("Add new robot error:", err));
  };

  const handleDelete = (id) => {
    apiClient
      .delete(`/mock/robots/${id}`)
      .then((res) => {
        console.log("Deleted robot", res.data);
        setAmrItems((prev) => prev.filter((item) => item.id !== id));
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
            width="24"
            height="24"
          />
          <h2>AMR 목록</h2>
        </div>
        <div className="header-right">
          <button className="plus-button" onClick={handleAddNew}>
            <img
              className="plus-icon"
              src={PlusIcon}
              alt="Plus Icon"
              width="24"
              height="24"
            />
          </button>
        </div>
      </div>
      <div className="list-items">
        {amrItems.map((item) => (
          <AMRListItem
            key={item.id}
            icon={AMRIcon}
            name={item.name}
            status={item.simulated_status}
            extraInfo={item.additional_info}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>새 Mock Robot 추가</h3>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label>이름</label>
                <input
                  type="text"
                  value={newRobot.name}
                  onChange={(e) =>
                    setNewRobot({ ...newRobot, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  상태 (대기, 이동, 정지, 충전, 오류, 비상정지, 보류)
                </label>
                <input
                  type="text"
                  value={newRobot.simulated_status}
                  onChange={(e) =>
                    setNewRobot({
                      ...newRobot,
                      simulated_status: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>모드</label>
                <input
                  type="text"
                  value={newRobot.simulated_mode}
                  onChange={(e) =>
                    setNewRobot({
                      ...newRobot,
                      simulated_mode: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>위치</label>
                <input
                  type="text"
                  value={newRobot.simulated_location}
                  onChange={(e) =>
                    setNewRobot({
                      ...newRobot,
                      simulated_location: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>추가 정보</label>
                <input
                  type="text"
                  value={newRobot.additional_info}
                  onChange={(e) =>
                    setNewRobot({
                      ...newRobot,
                      additional_info: e.target.value,
                    })
                  }
                />
              </div>
              <div className="modal-actions">
                <button type="submit">추가</button>
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AMRList;
