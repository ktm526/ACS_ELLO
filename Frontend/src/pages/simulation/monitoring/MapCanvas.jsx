// src/pages/simulation/monitoring/MapCanvas.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import "./MapCanvas.css";

const MapCanvas = ({ mapData, amrItems }) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [scale, setScale] = useState(1); // 초기 스케일 (1: 1배)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // 캔버스 크기 동기화 및 리사이즈 처리
  const updateCanvasSize = useCallback(() => {
    if (canvasRef.current) {
      const parent = canvasRef.current.parentElement;
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      setCanvasSize({ width, height });
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  // 캔버스 내 마우스 좌표 구하기
  const getCanvasMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // panning: 마우스 다운 시 드래깅 시작
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMousePos(getCanvasMousePos(e));
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const pos = getCanvasMousePos(e);
    const dx = pos.x - lastMousePos.x;
    const dy = pos.y - lastMousePos.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos(pos);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // zoom: 마우스 휠 이벤트로 스케일 조정
  const handleWheel = (e) => {
    e.preventDefault();
    const pos = getCanvasMousePos(e);
    const zoomFactor = 1.1;
    let newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    newScale = Math.max(0.1, Math.min(newScale, 10)); // 스케일 제한
    // 마우스 포인터를 중심으로 확대/축소
    const dx = pos.x - offset.x;
    const dy = pos.y - offset.y;
    const newOffset = {
      x: pos.x - (dx * newScale) / scale,
      y: pos.y - (dy * newScale) / scale,
    };
    setScale(newScale);
    setOffset(newOffset);
  };

  // 좌표 변환 함수: world 좌표 → 화면 좌표 (현재 offset과 scale을 적용)
  const transformCoordinates = (x, y) => {
    return {
      x: x * scale + offset.x,
      y: y * scale + offset.y,
    };
  };

  // 캔버스 그리기
  useEffect(() => {
    if (!mapData) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let stationData = {};
    let pathData = {};
    try {
      stationData = JSON.parse(mapData.station);
      pathData = JSON.parse(mapData.path);
    } catch (error) {
      console.error("Error parsing map JSON:", error);
      return;
    }

    // 스테이션 그리기
    if (stationData.stations) {
      stationData.stations.forEach((station) => {
        const { x, y, id } = station;
        const screenPos = transformCoordinates(x, y);
        // 스테이션 원 그리기
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#007aff";
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.stroke();
        // 스테이션 ID 텍스트
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.fillText(id, screenPos.x, screenPos.y - 12);
      });
    }

    // 패스 그리기
    if (pathData.paths) {
      pathData.paths.forEach((path) => {
        const { coordinates } = path;
        if (!coordinates || !coordinates.start || !coordinates.end) return;
        const startPos = transformCoordinates(
          coordinates.start.x,
          coordinates.start.y
        );
        const endPos = transformCoordinates(
          coordinates.end.x,
          coordinates.end.y
        );
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.strokeStyle = "#ff0000"; // 패스 색상
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // AMR 표시: 각 amrItems에 대해, simulated_location이 스테이션 id와 일치하면 표시
    // ... (기존 코드 생략)

    // AMR 표시: 각 amrItems에 대해, 백엔드에서 생성된 position 필드를 사용하여 로봇의 위치를 표시
    if (amrItems && amrItems.length > 0) {
      amrItems.forEach((amr) => {
        let robotPos;
        try {
          robotPos = JSON.parse(amr.position);
        } catch (error) {
          console.error("Error parsing robot position:", error);
          return;
        }
        if (
          robotPos &&
          typeof robotPos.x === "number" &&
          typeof robotPos.y === "number"
        ) {
          const screenPos = transformCoordinates(robotPos.x, robotPos.y);
          // AMR 도형 및 이름 표시 (노란색 원, 오렌지 테두리)
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "yellow";
          ctx.fill();
          ctx.strokeStyle = "orange";
          ctx.stroke();
          ctx.font = "bold 12px sans-serif";
          ctx.fillStyle = "#000";
          ctx.fillText(amr.name, screenPos.x, screenPos.y + 24);

          // destination 연결 (destination은 여전히 스테이션 id 기준)
          if (amr.destination) {
            const destStation = stationData.stations.find(
              (st) => st.id.toString() === amr.destination.toString()
            );
            if (destStation) {
              const destScreenPos = transformCoordinates(
                destStation.x,
                destStation.y
              );
              ctx.beginPath();
              ctx.setLineDash([5, 5]); // 점선 효과
              ctx.moveTo(screenPos.x, screenPos.y);
              ctx.lineTo(destScreenPos.x, destScreenPos.y);
              ctx.strokeStyle = "green";
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.setLineDash([]); // 점선 효과 해제
            }
          }
        }
      });
    }
  }, [mapData, amrItems, scale, offset, canvasSize]);

  return (
    <div className="map-canvas-container">
      <canvas
        ref={canvasRef}
        className="map-canvas"
        style={{ background: "#fff", cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
};

export default MapCanvas;
