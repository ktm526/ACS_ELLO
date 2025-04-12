import React from "react";
import "./MapSettings.css";
import MapFileList from "./MapFileList";
import RobotMapSetter from "./RobotMapSetter";

const MapSettings = () => {
  return (
    <div className="map-settings-container">
      <div className="map-file-list-section">
        <MapFileList />
      </div>
      <div className="robot-map-setter-section">
        <RobotMapSetter />
      </div>
    </div>
  );
};

export default MapSettings;
