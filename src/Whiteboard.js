import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";

// Change from localhost to production backend URL
const socket = io("https://your-backend-url.com");


let lastX = 0;
let lastY = 0;

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;



    socket.on("draw", ({ x0, y0, x1, y1, color, brushSize }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    });

    socket.on("clear", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => socket.off("draw");
  }, []);

  const getRelativeCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev, imageData]);
    setRedoStack([]); // clear redo on new action
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (undoStack.length === 0) return;

    const lastState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setRedoStack((prev) => [...prev, current]);
    ctx.putImageData(lastState, 0, 0);
  };

  const redo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev, current]);
    ctx.putImageData(nextState, 0, 0);
  };

  const startDrawing = (e) => {
    const coords = getRelativeCoords(e);
    lastX = coords.x;
    lastY = coords.y;
    setDrawing(true);
    saveState(); // save before new draw
  };

  const draw = (e) => {
    if (!drawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const coords = getRelativeCoords(e);
    const x = coords.x;
    const y = coords.y;

    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    socket.emit("draw", {
      x0: lastX,
      y0: lastY,
      x1: x,
      y1: y,
      color,
      brushSize,
    });

    lastX = x;
    lastY = y;
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear");
    saveState(); // save before clear
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Toolbar */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          backgroundColor: "#ffffffcc",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 0 5px rgba(0,0,0,0.2)",
        }}
      >
        🎨 Color:
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        🖌️ Brush:
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          style={{ marginRight: "10px" }}
        />
        📷
        <button onClick={exportImage}>Export</button>
        <button onClick={clearBoard} style={{ marginLeft: "10px" }}>
          🧹 Clear
        </button>
        <button onClick={undo} style={{ marginLeft: "10px" }}>
          ↩️ Undo
        </button>
        <button onClick={redo} style={{ marginLeft: "10px" }}>
          ↪️ Redo
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        style={{
          border: "2px solid black",
          display: "block",
          backgroundColor: "white",
          width: "100vw",
          height: "100vh",
        }}
      />
    </div>
  );
};

export default Whiteboard;


