import { useEffect, useRef, useState } from "react";
import { X, Download, Undo2, Redo2 } from "lucide-react";
import io from "socket.io-client";

const socket = io("http://localhost:5173");

const shapeOptions = [
  "Mouse",
  "Free Draw",
  "Eraser",
  "Line",
  "Rectangle",
  "Square",
  "Circle",
  "Triangle",
  "Pyramid",
  "Rhombus",
  "Cube",
  "Cylinder",
];

const GRID_SIZE = 20;

const CollaborativeCanvas = ({ onClose, roomId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [selectedShape, setSelectedShape] = useState("Free Draw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState([]);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);

  const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.9; // Set canvas width dynamically
    canvas.height = window.innerHeight * 0.7; // Set canvas height dynamically
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    socket.emit("join-canvas-room", roomId);

    socket.on("canvas-clear", () => {
      clearCanvas(true);
    });

    socket.on("canvas-sync", (imgData) => {
      const img = new Image();
      img.src = imgData;
      img.onload = () => ctx.drawImage(img, 0, 0);
    });

    return () => {
      socket.off("canvas-clear");
      socket.off("canvas-sync");
    };
  }, [roomId]);

  const pushToHistory = () => {
    const snapshot = canvasRef.current.toDataURL();
    setHistory((prev) => [...prev, snapshot]);
    setRedoStack([]);
  };

  const renderShapes = (ctx, shapeList) => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    shapeList.forEach((shape) => {
      const { type, startX, startY, endX, endY, color, size } = shape;
      const width = endX - startX;
      const height = endY - startY;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = size;

      switch (type) {
        case "Rectangle":
          ctx.strokeRect(startX, startY, width, height);
          break;
        case "Square": {
          const side = Math.min(Math.abs(width), Math.abs(height));
          ctx.strokeRect(startX, startY, Math.sign(width) * side, Math.sign(height) * side);
          break;
        }
        case "Circle":
          ctx.arc(startX, startY, Math.sqrt(width ** 2 + height ** 2), 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case "Line":
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          break;
        case "Pyramid":
          const halfWidth = width / 2;
          const heightPyramid = height;
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + width, startY);
          ctx.lineTo(startX + halfWidth, startY - heightPyramid);
          ctx.closePath();
          ctx.stroke();
          break;
        case "Cube":
          const cubeSide = Math.min(Math.abs(width), Math.abs(height));
          ctx.strokeRect(startX, startY, cubeSide, cubeSide);
          ctx.strokeRect(startX + 50, startY - 50, cubeSide, cubeSide);
          ctx.moveTo(startX, startY);
          ctx.lineTo(startX + 50, startY - 50);
          ctx.moveTo(startX + cubeSide, startY);
          ctx.lineTo(startX + 50 + cubeSide, startY - 50);
          ctx.moveTo(startX, startY + cubeSide);
          ctx.lineTo(startX + 50, startY + cubeSide - 50);
          ctx.moveTo(startX + cubeSide, startY + cubeSide);
          ctx.lineTo(startX + 50 + cubeSide, startY + cubeSide - 50);
          ctx.stroke();
          break;
        default:
          break;
      }

      ctx.closePath();
    });
  };

  const loadImage = (data) => {
    const img = new Image();
    img.src = data;
    img.onload = () => {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctxRef.current.drawImage(img, 0, 0);
    };
  };

  const undo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const last = newHistory.pop();
    setRedoStack((r) => [canvasRef.current.toDataURL(), ...r]);
    setHistory(newHistory);
    loadImage(last);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const [first, ...rest] = redoStack;
    setHistory((prev) => [...prev, canvasRef.current.toDataURL()]);
    setRedoStack(rest);
    loadImage(first);
  };

  const clearCanvas = (emit = false) => {
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (emit) socket.emit("clear-canvas", roomId);
    setHistory([]);
    setRedoStack([]);
    setShapes([]);
  };

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left - pan.x) / scale;
    const offsetY = (e.clientY - rect.top - pan.y) / scale;

    if (e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (selectedShape === "Mouse") {
      const foundIndex = shapes.findIndex((shape) => {
        return (
          offsetX >= Math.min(shape.startX, shape.endX) &&
          offsetX <= Math.max(shape.startX, shape.endX) &&
          offsetY >= Math.min(shape.startY, shape.endY) &&
          offsetY <= Math.max(shape.startY, shape.endY)
        );
      });

      if (foundIndex !== -1) {
        setSelectedShapeIndex(foundIndex);
        setResizeStart({ x: offsetX, y: offsetY });
      }

      return;
    }

    setIsDrawing(true);
    setStartCoords({ x: offsetX, y: offsetY });

    if (selectedShape === "Free Draw" || selectedShape === "Eraser") {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(offsetX, offsetY);
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left - pan.x) / scale;
    const offsetY = (e.clientY - rect.top - pan.y) / scale;

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (selectedShape === "Mouse" && selectedShapeIndex !== null) {
      setShapes((prev) =>
        prev.map((shape, i) =>
          i === selectedShapeIndex
            ? { ...shape, endX: offsetX, endY: offsetY }
            : shape
        )
      );
      renderShapes(ctxRef.current, shapes);
      return;
    }

    if (!isDrawing || (selectedShape !== "Free Draw" && selectedShape !== "Eraser")) return;

    const ctx = ctxRef.current;
    ctx.strokeStyle = selectedShape === "Eraser" ? "#fff" : color;
    ctx.lineWidth = size;
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const finishDrawing = (e) => {
    if (selectedShape === "Mouse") {
      setSelectedShapeIndex(null);
      pushToHistory();
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left - pan.x) / scale;
    const offsetY = (e.clientY - rect.top - pan.y) / scale;

    const ctx = ctxRef.current;
    ctx.strokeStyle = selectedShape === "Eraser" ? "#fff" : color;
    ctx.lineWidth = size;

    const { x: startX, y: startY } = startCoords;
    const width = offsetX - startX;
    const height = offsetY - startY;

    ctx.beginPath();

    switch (selectedShape) {
      case "Rectangle":
      case "Square":
      case "Circle":
      case "Line":
      case "Pyramid":
      case "Cube":
        setShapes((prev) => [
          ...prev,
          { type: selectedShape, startX, startY, endX: offsetX, endY: offsetY, color, size },
        ]);
        renderShapes(ctx, [...shapes, {
          type: selectedShape,
          startX, startY, endX: offsetX, endY: offsetY, color, size,
        }]);
        break;
      default:
        break;
    }

    ctx.closePath();
    pushToHistory();
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.max(0.5, Math.min(3, s * zoom)));
  };

  const addText = () => {
    const input = document.createElement("textarea");
    input.placeholder = "Type here...";
    input.style.position = "fixed";
    input.style.zIndex = 100;
    input.style.left = "50%";
    input.style.top = "50%";
    input.style.transform = "translate(-50%, -50%)";
    input.style.border = "1px solid gray";
    input.style.padding = "8px";
    input.style.background = "white";
    input.onblur = () => {
      const text = input.value;
      if (text) {
        const rect = canvasRef.current.getBoundingClientRect();
        const offsetX = (window.innerWidth / 2 - rect.left - pan.x) / scale;
        const offsetY = (window.innerHeight / 2 - rect.top - pan.y) / scale;
        ctxRef.current.fillStyle = color;
        ctxRef.current.font = "16px sans-serif";
        ctxRef.current.fillText(text, offsetX, offsetY);
        pushToHistory();
      }
      input.remove();
    };
    document.body.appendChild(input);
    input.focus();
  };

  const downloadCanvas = () => {
    const data = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = data;
    link.download = "canvas.png";
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center overflow-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">🎨  Canvas</h2>
          <button onClick={onClose} className="btn btn-ghost">
            <X size={20} />
          </button>
        </div>
        <div className="flex gap-4 mb-4 items-center">
          <select
            value={selectedShape}
            onChange={(e) => setSelectedShape(e.target.value)}
            className="select select-bordered select-sm w-40"
          >
            {shapeOptions.map((shape) => (
              <option key={shape} value={shape}>
                {shape}
              </option>
            ))}
          </select>
          <button className="btn btn-sm" onClick={addText}>
            Add Text
          </button>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={selectedShape === "Eraser"}
            className="input input-bordered input-sm"
          />
          <input
            type="range"
            min="1"
            max="20"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="range range-sm"
          />
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={clearCanvas}>
              Clear
            </button>
            <button className="btn btn-sm" onClick={undo}>
              <Undo2 size={16} />
            </button>
            <button className="btn btn-sm" onClick={redo}>
              <Redo2 size={16} />
            </button>
            <button className="btn btn-sm" onClick={downloadCanvas}>
              <Download size={16} />
            </button>
          </div>
        </div>
        <div className="relative flex-1 overflow-auto">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={handleMouseMove}
            onMouseUp={finishDrawing}
            onWheel={handleWheel}
            className="border bg-gray-50 w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default CollaborativeCanvas;
