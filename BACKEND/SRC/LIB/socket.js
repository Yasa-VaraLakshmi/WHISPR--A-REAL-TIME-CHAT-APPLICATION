import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], 
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {}; 


export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}


io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }
  socket.on("send-message", ({ receiverId, message, senderId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive-message", {
        senderId,
        message,
      });
    }
  });


  socket.on("join-canvas-room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined canvas room ${roomId}`);
  })

  socket.on("canvas-draw", (data) => {
    const { roomId, ...drawingData } = data;
    socket.to(roomId).emit("canvas-draw", drawingData); 
  });

  socket.on("clear-canvas", (roomId) => {
    io.to(roomId).emit("canvas-cleared");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
