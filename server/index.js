const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let users = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle user joining with name
  socket.on("join", (username) => {
    users[socket.id] = username;
    io.emit("online-users", Object.values(users));
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    delete users[socket.id];
    io.emit("online-users", Object.values(users));
  });

  // Drawing events (as before)
  socket.on("draw-line", (data) => {
    socket.broadcast.emit("draw-line", data);
  });

  socket.on("clear-canvas", () => {
    socket.broadcast.emit("clear-canvas");
  });
});

server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
