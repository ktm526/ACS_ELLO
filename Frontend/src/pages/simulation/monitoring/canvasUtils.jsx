// src/pages/simulation/monitoring/canvasUtils.js
export const transformCoordinates = (
  mapX,
  mapY,
  scale,
  offset,
  minPos,
  maxPos
) => {
  const mapWidth = maxPos.x - minPos.x;
  const mapHeight = maxPos.y - minPos.y;
  const screenX = (mapX - minPos.x) * scale + offset.x;
  const screenY =
    (1 - (mapY - minPos.y) / mapHeight) * (mapHeight * scale) + offset.y;
  return { x: screenX, y: screenY };
};

export const inverseTransformCoordinates = (
  screenX,
  screenY,
  scale,
  offset,
  minPos,
  maxPos
) => {
  const mapWidth = maxPos.x - minPos.x;
  const mapHeight = maxPos.y - minPos.y;
  const mapX = (screenX - offset.x) / scale + minPos.x;
  const mapY =
    minPos.y + (1 - (screenY - offset.y) / (mapHeight * scale)) * mapHeight;
  return { x: mapX, y: mapY };
};

export const getCanvasMousePos = (e, canvasRef) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};
