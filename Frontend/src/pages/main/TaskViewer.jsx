import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TaskViewer.css";

import ListIcon from "../../assets/icons/list.svg";
import PlusIcon from "../../assets/icons/plus.svg";
import RunIcon from "../../assets/icons/run.svg";

import TaskListItem from "./TaskListItem";
import TaskModal from "./TaskModal";

const TaskViewer = () => {
  const [tasks, setTasks] = useState([]);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1초마다 태스크 목록 폴링
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const API = import.meta.env.VITE_CORE_BASE_URL; // Vite
        const res = await axios.get(`${API}/api/tasks`);

        if (res.data && res.data.data) {
          setTasks(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 1000);
    return () => clearInterval(interval);
  }, []);

  // 상세 토글
  const handleToggle = (id) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 삭제
  const handleDelete = async (id) => {
    try {
      const API = import.meta.env.VITE_CORE_BASE_URL; // Vite

      await axios.delete(`${API}/api/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // 모달에서 새 태스크 추가 콜백
  const handleAddTask = (newTask) => {
    setTasks((prev) => [...prev, newTask]);
    setIsModalOpen(false);
  };

  return (
    <div className="list-container">
      {/* 헤더 */}
      <div className="list-header">
        <div className="header-left">
          <img
            className="header-icon"
            src={ListIcon}
            alt="List Icon"
            width="24"
            height="24"
          />
          <h2>태스크 목록</h2>
        </div>
        <div className="header-right">
          <button
            className="plus-button"
            onClick={() => setIsModalOpen(true)}
            title="새 Task 추가"
          >
            <img src={PlusIcon} alt="Add Task" width="20" height="20" />
          </button>
        </div>
      </div>

      {/* 리스트 */}
      <div className="list-items">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            // 타이틀 생성: steps 파싱, 없으면 start/destination 사용
            let title = `Task ${task.id}`;
            if (task.steps) {
              try {
                const steps = JSON.parse(task.steps);
                const first = steps[0]?.description || "";
                const last = steps[steps.length - 1]?.description || "";
                title = `Task ${task.id}: ${first} → ${last}`;
              } catch {}
            }
            return (
              <TaskListItem
                key={task.id}
                icon={RunIcon}
                name={title}
                status={task.status}
                expanded={!!expandedTasks[task.id]}
                onToggle={() => handleToggle(task.id)}
                onDelete={() => handleDelete(task.id)}
                task={task}
                details={
                  <div>
                    <p>
                      <strong>Task Type:</strong> {task.task_type}
                    </p>
                    <p>
                      <strong>Priority:</strong> {task.priority}
                    </p>
                    <p>
                      <strong>Repeat:</strong>{" "}
                      {task.repeat ? "반복" : "반복 없음"}
                    </p>
                    <p>
                      <strong>Additional Info:</strong>{" "}
                      {task.additional_info || "없음"}
                    </p>
                    {task.steps && (
                      <p>
                        <strong>Steps:</strong> {task.steps}
                      </p>
                    )}
                  </div>
                }
              />
            );
          })
        ) : (
          <p className="empty-text">No task data available.</p>
        )}
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <TaskModal
          onClose={() => setIsModalOpen(false)}
          onAddTask={handleAddTask}
        />
      )}
    </div>
  );
};

export default TaskViewer;
