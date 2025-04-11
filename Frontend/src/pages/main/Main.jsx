// pages/Main.jsx
import React from "react";
import MapViewer from "./MapViewer";
import RobotViewer from "./RobotViewer";
import TaskViewer from "./TaskViewer";
import "./Main.css";

const Main = () => {
  return (
    <div className="main-page">
      <div className="left-panel">
        <MapViewer />
      </div>
      <div className="right-panel">
        <div className="robot-panel">
          <RobotViewer />
        </div>
        <div className="task-panel">
          <TaskViewer />
        </div>
      </div>
    </div>
  );
};

export default Main;
