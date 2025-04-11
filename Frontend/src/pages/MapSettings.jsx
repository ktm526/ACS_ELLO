import React from "react";
import MapFileList from "./MapFileList";
import RobotMapSetter from "./RobotMapSetter";
import "./MapSettings.css";

const MapSettings = () => {
  return (
    <div className="map-settings-container">
      <div className="map-settings-left">
        <MapFileList />
      </div>
      <div className="map-settings-right">
        <RobotMapSetter />
      </div>
    </div>
  );
};

export default MapSettings;
