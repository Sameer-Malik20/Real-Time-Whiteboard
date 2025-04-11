import React, { useEffect, useRef, useState } from "react";
import { ChromePicker } from "react-color";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const prevPosRef = useRef({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const handleJoin = () => {
    if (username.trim()) {
      socket.emit("join", username);
      setJoined(true);
    } else {
      alert("Please enter your name to join.");
    }
  };

  useEffect(() => {
    if (!joined) return;

    const canvas = canvasRef.current;
    const containerWidth = window.innerWidth < 600 ? window.innerWidth * 0.95 : window.innerWidth * 0.8;
    canvas.width = containerWidth;
    canvas.height = window.innerHeight * 0.5;
    canvas.style.border = "2px solid black";
    canvas.style.width = "100%";
    canvas.style.maxWidth = "100%";

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctxRef.current = ctx;

    socket.on("draw-line", ({ x0, y0, x1, y1, color }) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.closePath();
    });

    socket.on("clear-canvas", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("draw-line");
      socket.off("clear-canvas");
      socket.off("online-users");
    };
  }, [joined]);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  }, [color]);

  const drawLine = (x0, y0, x1, y1, color, emit = true) => {
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;
    socket.emit("draw-line", { x0, y0, x1, y1, color });
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    prevPosRef.current = { x: offsetX, y: offsetY };
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const { x, y } = prevPosRef.current;

    drawLine(x, y, offsetX, offsetY, color);
    prevPosRef.current = { x: offsetX, y: offsetY };
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-canvas");
  };

  // Touch support for mobile
  useEffect(() => {
  if (!joined || !canvasRef.current) return;

  const canvas = canvasRef.current;

  const getTouchPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    prevPosRef.current = pos;
    setIsDrawing(true);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing) return;
    const pos = getTouchPos(e);
    const { x, y } = prevPosRef.current;
    drawLine(x, y, pos.x, pos.y, color);
    prevPosRef.current = pos;
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);

  return () => {
    canvas.removeEventListener("touchstart", handleTouchStart);
    canvas.removeEventListener("touchmove", handleTouchMove);
    canvas.removeEventListener("touchend", handleTouchEnd);
  };
}, [joined, isDrawing, color]);


  if (!joined) {
    return (
      <div className="container mt-5 text-center">
        <h2>Enter Your Name to Join the Whiteboard</h2>
        <input
          type="text"
          className="form-control my-3 w-75 mx-auto"
          placeholder="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleJoin}>
          Join
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-5 px-3">
      <h2 className="text-center mt-3">🎨 Collaborative Whiteboard</h2>
      <p className="text-center text-muted">
        Welcome, <strong>{username}</strong>!
      </p>

      <div className="text-center my-3">
        <h5>👥 Online Users:</h5>
        <ul className="list-unstyled">
          {onlineUsers.map((user, index) => (
            <li key={index} className="text-success">
              ✅ {user}
            </li>
          ))}
        </ul>
      </div>

      <div className="d-flex justify-content-center align-items-center flex-wrap gap-3 my-3">
        <div style={{ maxWidth: "100%" }}>
          <ChromePicker color={color} onChange={(updated) => setColor(updated.hex)} disableAlpha />
        </div>
        <button className="btn btn-danger mt-2" onClick={clearCanvas}>
          Clear Canvas
        </button>
      </div>

      <div className="d-flex justify-content-center">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{ touchAction: "none", maxWidth: "100%", borderRadius: "8px" }}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
