// src/pages/mapSettings/MapViewerModal.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import "./MapViewerModal.css";

const MapViewerModal = ({ visible, onClose, mapData }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);

  // 모달이 열릴 때 상태 초기화 및 원점(중앙) 배치 + 배경 스크롤 방지
  useEffect(() => {
    if (visible) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setScaleFactor(1);
      updateCanvasSize();
      // 모달이 열리면 body의 스크롤을 막음
      document.body.style.overflow = "hidden";
      if (containerRef.current && mapData && mapData.additional_info) {
        try {
          const addInfo = JSON.parse(mapData.additional_info);
          if (
            addInfo.header &&
            addInfo.header.minPos &&
            addInfo.header.maxPos
          ) {
            const midX =
              (addInfo.header.minPos.x + addInfo.header.maxPos.x) / 2;
            const midY =
              (addInfo.header.minPos.y + addInfo.header.maxPos.y) / 2;
            const rect = containerRef.current.getBoundingClientRect();
            const newScaleFactor = addInfo.header.resolution
              ? 1 / addInfo.header.resolution
              : 1;
            setScaleFactor(newScaleFactor);
            // 캔버스 중앙이 지도 중앙이 되도록 offset 설정 (초기 scale은 1)
            setOffset({
              x: rect.width / 2 - midX * newScaleFactor,
              y: rect.height / 2 - midY * newScaleFactor,
            });
          }
        } catch (e) {
          console.error("Error parsing additional_info:", e);
        }
      }
    } else {
      // 모달이 닫히면 body 스크롤 복원
      document.body.style.overflow = "";
    }
  }, [visible, mapData]); // scale 제거

  // 캔버스 사이즈 업데이트 (고해상도 지원)
  const updateCanvasSize = useCallback(() => {
    if (containerRef.current && canvasRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      canvasRef.current.style.width = `${rect.width}px`;
      canvasRef.current.style.height = `${rect.height}px`;
      const ctx = canvasRef.current.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  const getCanvasMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

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

  // 확대/축소 핸들러: 스크롤 이벤트 시 캔버스 내용은 확대/축소, 모달 배경 스크롤은 막음
  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasMousePos(e);
    const zoomFactor = 1.1;
    let newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    newScale = Math.max(0.1, Math.min(newScale, 80));
    const dx = pos.x - offset.x;
    const dy = pos.y - offset.y;
    const newOffset = {
      x: pos.x - (dx * newScale) / scale,
      y: pos.y - (dy * newScale) / scale,
    };
    setScale(newScale);
    setOffset(newOffset);
  };

  const transformCoordinates = (x, y) => ({
    x: x * scaleFactor * scale + offset.x,
    y: y * scaleFactor * scale + offset.y,
  });

  useEffect(() => {
    if (!visible || !mapData) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let stationData = {};
    let pathData = {};
    try {
      stationData =
        mapData.station && mapData.station.trim() !== ""
          ? JSON.parse(mapData.station)
          : {};
      pathData =
        mapData.path && mapData.path.trim() !== ""
          ? JSON.parse(mapData.path)
          : {};
    } catch (err) {
      console.error("Error parsing map JSON:", err);
      return;
    }

    // 상단 제목
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#333";
    ctx.fillText("미리보기", 10, 20);

    // 스테이션 그리기
    if (stationData.stations) {
      stationData.stations.forEach((station) => {
        const pos = transformCoordinates(station.x, station.y);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#007aff";
        ctx.fill();
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#000";
        ctx.fillText(station.id, pos.x + 6, pos.y - 6);
      });
    }

    // 경로 그리기
    if (pathData.paths) {
      pathData.paths.forEach((path) => {
        if (
          path.coordinates &&
          path.coordinates.start &&
          path.coordinates.end
        ) {
          const startPos = transformCoordinates(
            path.coordinates.start.x,
            path.coordinates.start.y
          );
          const endPos = transformCoordinates(
            path.coordinates.end.x,
            path.coordinates.end.y
          );
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(endPos.x, endPos.y);
          ctx.strokeStyle = "#ff0000";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }

    // normalPosList 그리기 (검은색 1px 점)
    if (mapData.additional_info) {
      try {
        const addInfo = JSON.parse(mapData.additional_info);
        if (Array.isArray(addInfo.normalPosList)) {
          addInfo.normalPosList.forEach((pt) => {
            const pos = transformCoordinates(pt.x, pt.y);
            ctx.fillStyle = "#000";
            ctx.fillRect(pos.x, pos.y, 1, 1);
          });
        }
      } catch (e) {
        console.error("Error parsing normalPosList:", e);
      }
    }
  }, [visible, mapData, scale, offset, scaleFactor]);

  if (!visible) return null;

  return (
    <div
      className="map-viewer-modal-overlay"
      onClick={onClose}
      style={{ overflow: "hidden" }}
    >
      <div
        className="map-viewer-modal-content"
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
      >
        <div className="map-viewer-modal-header">
          <h2>미리보기</h2>
          <button className="modal-close-button" onClick={onClose}>
            X
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="map-viewer-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
};

export default MapViewerModal;
