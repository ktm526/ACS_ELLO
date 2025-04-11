// src/pages/TaskModal.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import axios from "axios";
import "./TaskModal.css";
import { AppContext } from "../../context/AppContext";

export default function TaskModal({ onClose, onAddTask }) {
  const { stationList } = useContext(AppContext); // [{id,x,y}, …]
  const [normalPos, setNormalPos] = useState([]); // 추가 정보(선택)
  const [paths, setPaths] = useState([]); // [{start,end,coordinates}]
  const canvasRef = useRef(null);

  /* mini‑map 그리기 ---------------------------------------------- */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !stationList.length) return;
    const ctx = cv.getContext("2d");
    const W = 180,
      H = 180;
    cv.width = W;
    cv.height = H;
    ctx.clearRect(0, 0, W, H);

    /* bbox 계산 */
    const xs = stationList.map((s) => s.x);
    const ys = stationList.map((s) => s.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    const tf = (x, y) => ({
      x: ((x - minX) / spanX) * (W - 20) + 10,
      y: H - (((y - minY) / spanY) * (H - 20) + 10),
    });

    /* normalPosList (회색 점) */
    ctx.fillStyle = "#b0b0b0";
    normalPos.forEach((p) => {
      const { x, y } = tf(p.x, p.y);
      ctx.fillRect(x, y, 1, 1);
    });

    /* paths (연한 빨간 선) */
    ctx.strokeStyle = "#ff6b6b";
    ctx.lineWidth = 1;
    paths.forEach((p) => {
      const s = tf(p.coordinates.start.x, p.coordinates.start.y);
      const e = tf(p.coordinates.end.x, p.coordinates.end.y);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
    });

    /* stations (진한 파랑 원) */
    ctx.fillStyle = "#007aff";
    stationList.forEach((s) => {
      const { x, y } = tf(s.x, s.y);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [stationList, normalPos, paths]);

  /* -------------------------------------------------------------- */
  const [newTask, setNewTask] = useState({
    robot_name: "",
    task_type: "navigation",
    status: "pending",
    priority: "m",
    additional_info: "",
    repeat: false,
  });
  const [steps, setSteps] = useState([]);

  const addRoute = () =>
    setSteps((p) => [...p, { stepType: "경로", description: "" }]);
  const addWork = () =>
    setSteps((p) => [...p, { stepType: "작업", description: "" }]);

  const handleStepChange = (idx, value) =>
    setSteps((p) =>
      p.map((s, i) => (i === idx ? { ...s, description: value } : s))
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API = import.meta.env.VITE_CORE_BASE_URL; // Vite

      const res = await axios.post(`${API}/api/tasks`, {
        ...newTask,
        steps: JSON.stringify(steps),
      });
      if (res.data?.data) onAddTask(res.data.data);
    } catch (err) {
      console.error("add task error", err);
    }
  };

  /* -------------------------------------------------------------- UI */
  return (
    <div className="modal-overlay">
      <div className="modal wide">
        <h3>새 Task</h3>

        <div className="modal-body">
          {/* mini‑map */}
          <canvas ref={canvasRef} />

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="task-form">
            <label>
              로봇 이름
              <input
                value={newTask.robot_name}
                onChange={(e) =>
                  setNewTask({ ...newTask, robot_name: e.target.value })
                }
              />
            </label>

            <label>
              우선도 (s/h/m/l)
              <input
                value={newTask.priority}
                onChange={(e) =>
                  setNewTask({ ...newTask, priority: e.target.value })
                }
              />
            </label>

            <div className="step-area">
              <div className="step-head">
                <span>Steps</span>
                <button type="button" onClick={addRoute}>
                  + 경로
                </button>
                <button type="button" onClick={addWork}>
                  + 작업
                </button>
              </div>

              {steps.map((s, i) => (
                <div key={i} className="step-row">
                  <select
                    value={s.description}
                    onChange={(e) => handleStepChange(i, e.target.value)}
                  >
                    <option value="">스테이션 선택</option>
                    {stationList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.id}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <label>
              추가 정보
              <input
                value={newTask.additional_info}
                onChange={(e) =>
                  setNewTask({ ...newTask, additional_info: e.target.value })
                }
              />
            </label>
            {/* 반복 여부 체크박스 */}
            <label>
              반복 여부
              <input
                type="checkbox"
                checked={newTask.repeat}
                onChange={(e) =>
                  setNewTask({ ...newTask, repeat: e.target.checked })
                }
              />
            </label>

            <div className="modal-actions">
              <button type="button" onClick={onClose}>
                취소
              </button>
              <button type="submit">추가</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
