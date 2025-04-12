// src/pages/mapSettings/MapFileList.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./MapFileList.css";
import ListIcon from "../../assets/icons/list.svg";
import TrashIcon from "../../assets/icons/trash.svg";
import MapViewerModal from "./MapViewerModal"; // 경로는 실제 위치에 맞게 조정
import MapIcon from "../../assets/icons/map-settings.svg";

const MapFileList = () => {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedMap, setSelectedMap] = useState(null);

  const API = import.meta.env.VITE_CORE_BASE_URL; // Vite
  const IO_API = import.meta.env.VITE_IO_BASE_URL;
  // 서버에서 맵 데이터 가져오기
  const fetchMaps = () => {
    axios
      .get(`${API}/api/maps`)
      .then((res) => {
        if (res.data && res.data.data) {
          setMaps(res.data.data);
          console.log(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching maps:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMaps();
  }, []);

  // 파일 업로드 관련
  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();

    // 각 파일의 확장자를 검사하여 알맞은 필드 이름으로 FormData에 추가
    files.forEach((file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "pgm") {
        formData.append("pgmFile", file);
      } else if (ext === "yaml" || ext === "yml") {
        formData.append("yamlFile", file);
      } else if (ext === "json" || ext === "smap") {
        formData.append("mapFile", file);
      }
    });

    axios
      .post(`${IO_API}/uploadMap`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        console.log("Map uploaded successfully:", res.data);
        alert("맵이 성공적으로 업로드되었습니다.");
        // 파일 업로드 후 인풋 값을 초기화하여 같은 파일 재업로드 가능하게 함
        e.target.value = "";
        fetchMaps();
      })
      .catch((err) => {
        console.error("Error uploading map:", err);
        alert("맵 업로드 중 오류가 발생했습니다: " + err.message);
      });
  };

  // 뷰어 버튼 클릭 시 모달 열기
  const handleView = (mapId) => {
    const mapItem = maps.find((m) => m.id === mapId);
    if (mapItem) {
      setSelectedMap(mapItem);
      setViewerVisible(true);
    }
  };

  const handleDelete = (mapId) => {
    axios

      .delete(`${API}/api/maps/${mapId}`)
      .then((res) => {
        setMaps(maps.filter((m) => m.id !== mapId));
      })
      .catch((err) => {
        console.error("Error deleting map:", err);
      });
  };

  return (
    <div className="map-file-list-container">
      <div className="map-file-list-header">
        <div className="header-left">
          <img
            className="header-icon"
            src={ListIcon}
            alt="List Icon"
            width="24"
            height="24"
          />
          <h2>서버 맵 파일</h2>
        </div>
        <button className="upload-button" onClick={handleUpload}>
          <svg
            width="14"
            height="17"
            viewBox="0 0 14 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.52472 16.992H11.1739C12.8598 16.992 13.6987 16.1599 13.6987 14.5114V7.31514C13.6987 6.29277 13.5765 5.84894 12.9249 5.19906L8.43748 0.752912C7.8185 0.134732 7.30542 0 6.39326 0H2.52472C0.847 0 0 0.840095 0 2.48858V14.5114C0 16.1678 0.838861 16.992 2.52472 16.992ZM2.58173 15.716C1.74287 15.716 1.31123 15.2801 1.31123 14.4877V2.51235C1.31123 1.72774 1.74287 1.27599 2.58988 1.27599H6.21408V5.88064C6.21408 6.87924 6.72717 7.37062 7.74521 7.37062H12.3874V14.4877C12.3874 15.2801 11.9558 15.716 11.1088 15.716H2.58173ZM7.8918 6.17388C7.56603 6.17388 7.44387 6.04708 7.44387 5.73006V1.52168L12.135 6.17388H7.8918Z"
              fill="white"
            />
          </svg>

          <div className="button-text">업로드</div>
        </button>
      </div>
      {/* multiple 속성이 추가된 숨겨진 파일 input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div className="map-file-list-content">
        {loading ? (
          <p>Loading...</p>
        ) : maps.length === 0 ? (
          <div className="no-data-message">
            <p>저장된 맵 데이터 없음</p>
          </div>
        ) : (
          <ul className="map-file-list">
            {maps.map((map) => (
              <li key={map.id} className="map-file-item">
                <div className="map-file-icon">
                  <img src={MapIcon} alt="List" width={16} height={16} />
                </div>
                <div className="map-file-info">
                  <p className="map-file-name">{map.name}</p>
                  <p className="map-file-date">
                    {map.last_updated
                      ? new Date(map.last_updated).toLocaleString()
                      : "미정"}
                  </p>
                </div>
                <div className="map-file-actions">
                  <button
                    className="viewer-button"
                    onClick={() => handleView(map.id)}
                  >
                    <svg
                      width="21"
                      height="13"
                      viewBox="0 0 21 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.3635 13C16.4891 13 20.7195 8.05016 20.7195 6.5038C20.7195 4.94985 16.4816 0.00756836 10.3635 0.00756836C4.3213 0.00756836 0 4.94985 0 6.5038C0 8.05016 4.31371 13 10.3635 13ZM10.3635 11.8024C5.3675 11.8024 1.32671 7.57261 1.32671 6.5038C1.32671 5.60176 5.3675 1.20524 10.3635 1.20524C15.3368 1.20524 19.3928 5.60176 19.3928 6.5038C19.3928 7.57261 15.3368 11.8024 10.3635 11.8024ZM10.3635 10.7411C12.7137 10.7411 14.6166 8.83848 14.6166 6.48864C14.6166 4.13877 12.7137 2.23615 10.3635 2.23615C8.01338 2.23615 6.10289 4.13877 6.10289 6.48864C6.10289 8.83848 8.01338 10.7411 10.3635 10.7411ZM10.3635 7.9061C9.5827 7.9061 8.95342 7.27698 8.95342 6.49622C8.95342 5.71546 9.5827 5.0863 10.3635 5.0863C11.1444 5.0863 11.7736 5.71546 11.7736 6.49622C11.7736 7.27698 11.1444 7.9061 10.3635 7.9061Z"
                        fill="black"
                        fill-opacity="0.85"
                      />
                    </svg>
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(map.id)}
                  >
                    <img
                      src={TrashIcon}
                      alt="Trash Icon"
                      width="20"
                      height="20"
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <MapViewerModal
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
        mapData={selectedMap}
      />
    </div>
  );
};

export default MapFileList;
