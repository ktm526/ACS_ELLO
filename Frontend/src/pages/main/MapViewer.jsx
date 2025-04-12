// src/pages/MapViewer.jsx
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  Fragment,
  useContext,
} from "react";
import axios from "axios";
import "./MapViewer.css";

import { AppContext } from "../../context/AppContext";

import MapIcon from "../../assets/icons/map-settings.svg";
import SettingsIcon from "../../assets/icons/settings.svg";
import RobotIcon from "../../assets/arrow.png";

const DEFAULT_SIZE_MM = { width: 540, height: 620 };

const MapViewer = () => {
  const { setStationList } = useContext(AppContext); // 🔹

  /* ---------------- 맵 목록 ---------------- */
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [loadingMaps, setLoadingMaps] = useState(true);

  /* ---------------- 로봇 ---------------- */
  const [robotData, setRobotData] = useState([]);

  /* ---------------- 캔버스/뷰포트 ---------------- */
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 500, y: 300 });
  const [scaleFactor, setScaleFactor] = useState(100);

  /* ---------------- 아이콘 크기/설정 ---------------- */
  const [iconSizeMM, setIconSizeMM] = useState(DEFAULT_SIZE_MM);
  const [showSettings, setShowSettings] = useState(false);

  /* ---------------- 로봇 이미지 프리로드 ---------------- */
  const [robotImage, setRobotImage] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.src = RobotIcon;
    img.onload = () => setRobotImage(img);
  }, []);

  /* stationList 를 전역으로 공유 ------------------------------- */
  useEffect(() => {
    if (!selectedMap?.station) return;
    try {
      const s = JSON.parse(selectedMap.station || "{}");
      if (Array.isArray(s.stations)) setStationList(s.stations);
    } catch {
      /* ignore */
    }
  }, [selectedMap, setStationList]);

  /* ---------------- 맵 목록 로드 ---------------- */
  useEffect(() => {
    let API = import.meta.env.VITE_CORE_BASE_URL; // Vite
    axios
      .get(`${API}/api/maps`)
      .then((res) => {
        if (res.data?.data?.length) {
          setMaps(res.data.data);
          setSelectedMap(res.data.data[0]);
        }
      })
      .catch((e) => console.error("fetch maps error:", e))
      .finally(() => setLoadingMaps(false));
  }, []);

  /* ---------------- 로봇 폴링 ---------------- */
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        let API = import.meta.env.VITE_CORE_BASE_URL; // Vite
        const res = await axios.get(`${API}/api/robots`);

        if (res.data?.data) setRobotData(res.data.data);
      } catch (e) {
        console.error("robot poll error:", e);
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  /* ---------------- 캔버스 DPI 대응 ---------------- */
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasRef.current.width = rect.width * dpr;
    canvasRef.current.height = rect.height * dpr;
    canvasRef.current.style.width = `${rect.width}px`;
    canvasRef.current.style.height = `${rect.height}px`;
    const ctx = canvasRef.current.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);
  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  /* ---------------- 맵 선택 시 scaleFactor 초기화 ---------------- */
  useEffect(() => {
    if (!containerRef.current || !selectedMap?.additional_info) return;
    try {
      const addInfo = JSON.parse(selectedMap.additional_info);
      if (addInfo.header?.minPos && addInfo.header?.maxPos) {
        const midX = (addInfo.header.minPos.x + addInfo.header.maxPos.x) / 2;
        const midY = (addInfo.header.minPos.y + addInfo.header.maxPos.y) / 2;
        const rect = containerRef.current.getBoundingClientRect();
        const sf = addInfo.header.resolution
          ? 1 / addInfo.header.resolution
          : 1;
        setScaleFactor(sf);
        setOffset({
          x: rect.width / 2 - midX * sf,
          y: rect.height / 2 - midY * sf,
        });
        setScale(100);
      }
    } catch (e) {
      console.error("header parse error:", e);
    }
  }, [selectedMap]);

  /* ---------------- 좌표 변환 ---------------- */
  const transform = (x, y) => {
    const h = containerRef.current?.getBoundingClientRect().height || 600;
    return {
      x: x * scaleFactor * scale + offset.x,
      y: h - (y * scaleFactor * scale + offset.y),
    };
  };

  /* ------------------------------------------------------------------
   *  인터랙션용 메모리(스테이션/로봇 hitbox 저장)
   * ------------------------------------------------------------------ */
  const stationRectsRef = useRef([]); // {id, x,y,w,h,labelPos}
  const robotRectsRef = useRef([]); // {name,x,y,w,h}

  /* ---------------- 캔버스 그리기 ---------------- */
  const drawCanvas = () => {
    if (!canvasRef.current || !selectedMap) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let stationData = {},
      pathData = {};
    try {
      stationData =
        selectedMap.station?.trim() !== ""
          ? JSON.parse(selectedMap.station)
          : {};
      pathData =
        selectedMap.path?.trim() !== "" ? JSON.parse(selectedMap.path) : {};
    } catch (e) {
      console.error("map json parse error:", e);
      return;
    }
    try {
      const addInfo = JSON.parse(selectedMap.additional_info || "{}");
      if (Array.isArray(addInfo.normalPosList)) {
        ctx.fillStyle = "#000";
        addInfo.normalPosList.forEach((pt) => {
          const p = transform(pt.x, pt.y);
          ctx.fillRect(p.x, p.y, 1, 1);
        });
      }
    } catch (e) {
      console.error("normalPosList parse error:", e);
    }

    /* --- 경로 (빨간선) --- */
    if (Array.isArray(pathData.paths)) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#ff0000";
      ctx.setLineDash([]);
      pathData.paths.forEach((p) => {
        const { start, end } = p.coordinates || {};
        if (!start || !end) return;
        const s = transform(start.x, start.y);
        const e = transform(end.x, end.y);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
      });
    }

    stationRectsRef.current = [];
    /* --- 스테이션 --- */
    const stSizePx = {
      w: (iconSizeMM.width / 1000) * scaleFactor * scale,
      h: (iconSizeMM.height / 1000) * scaleFactor * scale,
    };
    if (Array.isArray(stationData.stations)) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFA500";
      ctx.fillStyle = "#FFA500";
      ctx.font = `${12}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      stationData.stations.forEach((st) => {
        const p = transform(st.x, st.y);
        /* 네모 */
        // ctx.strokeRect(
        //   p.x - stSizePx.w / 2,
        //   p.y - stSizePx.h / 2,
        //   stSizePx.w,
        //   stSizePx.h
        // );
        /* 중앙 원 */
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.min(stSizePx.w, stSizePx.h) / 6, 0, Math.PI * 2);
        ctx.fill();

        /* 이름 라벨 */
        const labelY = p.y + stSizePx.h / 4;
        ctx.fillStyle = "#333";
        ctx.fillText(String(st.id ?? st.name ?? ""), p.x, labelY);

        /* hitbox 저장 */
        stationRectsRef.current.push({
          id: st.id ?? st.name,
          x: p.x - stSizePx.w / 2,
          y: p.y - stSizePx.h / 2,
          w: stSizePx.w,
          h: stSizePx.h,
          label: st.id ?? st.name,
        });
        ctx.fillStyle = "#FFA500";
      });
    }

    robotRectsRef.current = [];
    /* --- 로봇 --- */
    if (!robotImage) return;
    robotData.forEach((r) => {
      let posObj = { x: 0, y: 0, angle: 0 };
      try {
        posObj =
          typeof r.position === "string" ? JSON.parse(r.position) : r.position;
      } catch {}
      const p = transform(posObj.x, posObj.y);
      const sizePx = {
        w: (iconSizeMM.width / 1000) * scaleFactor * scale,
        h: (iconSizeMM.height / 1000) * scaleFactor * scale,
      };
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(-posObj.angle + Math.PI / 2);
      ctx.drawImage(
        robotImage,
        -sizePx.w / 2,
        -sizePx.h / 2,
        sizePx.w,
        sizePx.h
      );
      ctx.restore();

      /* 목적지 점선 */
      if (r.destination && Array.isArray(stationData.stations)) {
        const dest = stationData.stations.find(
          (s) =>
            String(s.id) === String(r.destination) || s.name === r.destination
        );
        if (dest) {
          const dp = transform(dest.x, dest.y);
          ctx.save();
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = "#192BB4";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(dp.x, dp.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      robotRectsRef.current.push({
        name: r.name,
        x: p.x - sizePx.w / 2,
        y: p.y - sizePx.h / 2,
        w: sizePx.w,
        h: sizePx.h,
      });
    });
  };

  useEffect(drawCanvas, [
    selectedMap,
    scale,
    offset,
    scaleFactor,
    robotData,
    iconSizeMM,
    robotImage,
  ]);

  /* ------------------------------------------------------------------
   *  마우스 인터랙션
   * ------------------------------------------------------------------ */
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const getMouse = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      // left
      setIsDragging(true);
      setLastMouse(getMouse(e));
    }
  };
  const handleMouseMove = (e) => {
    const pos = getMouse(e);
    /* 드래그 */
    if (isDragging) {
      const dx = pos.x - lastMouse.x;
      const dy = pos.y - lastMouse.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y - dy }));
      setLastMouse(pos);
    }
    /* 로봇 툴팁 */
    const hit = robotRectsRef.current.find(
      (r) =>
        pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h
    );
    if (hit)
      setRobotTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        name: hit.name,
      });
    else setRobotTooltip((t) => ({ ...t, visible: false }));
  };
  const endDrag = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const pos = getMouse(e);
    const factor = 1.1;
    let ns = e.deltaY < 0 ? scale * factor : scale / factor;
    ns = Math.max(0.1, Math.min(ns, 80));
    const rect = containerRef.current.getBoundingClientRect();
    const h = rect.height;
    const ratio = ns / scale;
    setScale(ns);
    setOffset((prev) => ({
      x: prev.x * ratio + pos.x * (1 - ratio),
      y: prev.y * ratio + (h - pos.y) * (1 - ratio),
    }));
  };

  /* ------------------------------------------------------------------
   *  로봇 툴팁 상태
   * ------------------------------------------------------------------ */
  const [robotTooltip, setRobotTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    name: "",
  });

  /* ------------------------------------------------------------------
   *  스테이션 컨텍스트 메뉴
   * ------------------------------------------------------------------ */
  const [ctxMenu, setCtxMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    station: null,
  });

  +useEffect(() => {
    if (!ctxMenu.visible) return;

    const hide = () => setCtxMenu((prev) => ({ ...prev, visible: false }));
    window.addEventListener("click", hide, { once: true });
    return () => window.removeEventListener("click", hide);
  }, [ctxMenu.visible]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    const pos = getMouse(e);
    const hit = stationRectsRef.current.find(
      (st) =>
        pos.x >= st.x &&
        pos.x <= st.x + st.w &&
        pos.y >= st.y &&
        pos.y <= st.y + st.h
    );
    if (hit) {
      setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, station: hit });
    } else {
      setCtxMenu({ ...ctxMenu, visible: false });
    }
  };

  const createMoveTask = async () => {
    if (!ctxMenu.station) return;
    try {
      let API = import.meta.env.VITE_CORE_BASE_URL;

      await axios.post(`${API}/api/tasks`, {
        task_type: "navigation",
        steps: JSON.stringify([
          { stepType: "경로", description: String(ctxMenu.station.id) },
        ]),
        priority: "h",
        status: "pending",
      });
      alert("태스크가 추가되었습니다");
    } catch (e) {
      console.error("create task error:", e);
      alert("태스크 생성 실패");
    } finally {
      setCtxMenu({ ...ctxMenu, visible: false });
    }
  };

  /* ------------------------------------------------------------------
   *  UI
   * ------------------------------------------------------------------ */
  return (
    <div className="map-viewer" onContextMenu={(e) => e.preventDefault()}>
      {/* ---------- 헤더 ---------- */}
      <div className="list-header">
        <div className="header-left">
          <img src={MapIcon} alt="List" width={16} height={16} />
          <h2>모니터링</h2>
        </div>
        <div className="header-right">
          <button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
          >
            <img src={SettingsIcon} alt="Settings" width={16} height={16} />
          </button>
          <select
            className="map-selector"
            onChange={(e) =>
              setSelectedMap(maps.find((m) => m.id === Number(e.target.value)))
            }
            value={selectedMap?.id || ""}
          >
            {maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------- 캔버스 ---------- */}
      <div
        className="canvas-container"
        ref={containerRef}
        style={{ width: "100%", height: "100%", border: "1px solid #ccc" }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
          style={{
            width: "100%",
            height: "100%",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        />
      </div>

      {/* ---------- 로봇 툴팁 ---------- */}
      {robotTooltip.visible && (
        <div
          className="tooltip"
          style={{ left: robotTooltip.x + 10, top: robotTooltip.y + 10 }}
        >
          {robotTooltip.name}
        </div>
      )}

      {/* ---------- 스테이션 컨텍스트 메뉴 ---------- */}
      {ctxMenu.visible && (
        <div
          className="context-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
        >
          <button onClick={createMoveTask}>해당 스테이션으로 이동</button>
        </div>
      )}

      {/* ---------- 설정 모달 ---------- */}
      {showSettings && (
        <div className="settings-modal">
          <div
            className="modal-backdrop"
            onClick={() => setShowSettings(false)}
          />
          <div className="modal-content">
            <label>
              가로(mm)
              <input
                type="number"
                value={iconSizeMM.width}
                onChange={(e) =>
                  setIconSizeMM((prev) => ({
                    ...prev,
                    width: e.target.valueAsNumber || 1,
                  }))
                }
              />
            </label>
            <label>
              세로(mm)
              <input
                type="number"
                value={iconSizeMM.height}
                onChange={(e) =>
                  setIconSizeMM((prev) => ({
                    ...prev,
                    height: e.target.valueAsNumber || 1,
                  }))
                }
              />
            </label>
            <button
              className="close-btn"
              onClick={() => setShowSettings(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapViewer;
