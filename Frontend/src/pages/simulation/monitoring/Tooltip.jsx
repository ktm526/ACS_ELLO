// src/pages/simulation/monitoring/Tooltip.jsx
import React from "react";
import "./Tooltip.css";

const Tooltip = ({ tooltip }) => {
  return (
    <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      {tooltip.actions &&
        tooltip.actions.map((item, idx) => (
          <div key={idx} className="tooltip-item" onClick={item.action}>
            {item.label}
          </div>
        ))}
    </div>
  );
};

export default Tooltip;
