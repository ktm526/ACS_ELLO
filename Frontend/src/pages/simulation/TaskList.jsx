// src/pages/simulation/monitoring/TaskList.jsx
import React, { useState, useEffect } from "react";
import apiClient from "../../utils/apiClient";
import TaskListItem from "./TaskListItem";
import "./TaskList.css";

import ListIcon from "../../assets/icons/list.svg";
import PlusIcon from "../../assets/icons/plus.svg";

const TaskList = ({ taskItems, setTaskItems }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    robot_name: "",
    task_type: "",
    // steps는 JSON 배열 문자열 형식으로 입력 (예시)
    steps:
      '[{"waypoint": "A"}, {"waypoint": "B"}, {"instruction": "Pick up item"}, {"waypoint": "C"}]',
    status: "pending",
    priority: "m", // 우선도: s, h, m, l
    additional_info: "",
  });

  // 최초 마운트 시 태스크 목록을 불러옵니다.
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    apiClient
      .get("/mock/tasks")
      .then((res) => {
        if (res.data && res.data.data) {
          setTaskItems(res.data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch tasks:", err));
  };

  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();

    // steps 필드가 올바른 JSON 배열인지 검증
    try {
      const parsed = JSON.parse(newTask.steps);
      if (!Array.isArray(parsed)) {
        alert("Steps must be a JSON array.");
        return;
      }
    } catch (error) {
      console.error("Invalid JSON in steps:", error);
      alert("Steps field must be a valid JSON array.");
      return;
    }

    apiClient
      .post("/mock/tasks", newTask)
      .then((res) => {
        console.log("Added new task", res.data);
        setTaskItems([...taskItems, res.data.data]);
        setIsModalOpen(false);
        // 초기화
        setNewTask({
          robot_name: "",
          task_type: "",
          steps:
            '[{"waypoint": "A"}, {"waypoint": "B"}, {"instruction": "Pick up item"}, {"waypoint": "C"}]',
          status: "pending",
          priority: "m",
          additional_info: "",
        });
      })
      .catch((err) => console.error("Add new task error:", err));
  };

  const handleDelete = (id) => {
    apiClient
      .delete(`/mock/tasks/${id}`)
      .then((res) => {
        console.log("Deleted task", res.data);
        setTaskItems(taskItems.filter((item) => item.id !== id));
      })
      .catch((err) => console.error("Delete task error:", err));
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
          <h2>작업 목록</h2>
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
        {taskItems.map((item) => (
          <TaskListItem key={item.id} task={item} onDelete={handleDelete} />
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>새 Mock Task 추가</h3>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label>로봇 이름 (선택)</label>
                <input
                  type="text"
                  value={newTask.robot_name}
                  onChange={(e) =>
                    setNewTask({ ...newTask, robot_name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>작업 유형</label>
                <input
                  type="text"
                  value={newTask.task_type}
                  onChange={(e) =>
                    setNewTask({ ...newTask, task_type: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Steps (JSON 배열 형식)
                  <br />
                  <small>
                    예시: [&#123;"waypoint": "A"&#125;, &#123;"waypoint":
                    "B"&#125;, &#123;"instruction": "Pick up item"&#125;,
                    &#123;"waypoint": "C"&#125;]
                  </small>
                </label>
                <input
                  type="text"
                  value={newTask.steps}
                  onChange={(e) =>
                    setNewTask({ ...newTask, steps: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>우선도 (s, h, m, l)</label>
                <input
                  type="text"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>추가 정보</label>
                <input
                  type="text"
                  value={newTask.additional_info}
                  onChange={(e) =>
                    setNewTask({ ...newTask, additional_info: e.target.value })
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

export default TaskList;
