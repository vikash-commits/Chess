const express = require("express");
const path = require("path");
//explicitly creating the server so that we can have more control over it,
//the functionality is the same as app.listen(creates a server as well)
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");
const { v4: uuidv4 } = require("uuid");

let roomId = uuidv4();
const app = express();
const server = createServer(app);
require("dotenv").config();
const PORT = process.env.PORT || 3000;

let games = {};

const io = new Server(server, {
  cors: {
    origin: `https://chesswin-1.onrender.com`, // deploy link:- https://chesswin-1.onrender.com
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  if (socket.handshake.query.roomId !== undefined) {
    roomId = socket.handshake.query.roomId;
  }
  if (!games[roomId]?.white) {
    games[roomId] = { white: socket.id };
    socket.data.roomId = roomId;
    socket.join(roomId);
  } else if (!games[roomId]?.black) {
    games[roomId] = { ...games[roomId], black: socket.id, chess: new Chess() };
    socket.data.roomId = roomId;
    socket.join(roomId);
    io.to(roomId).emit("bothPlayersConnected", roomId);
    io.to(roomId).emit("boardState", games[roomId].chess.fen());
    roomId = uuidv4();
  }
  socket.on("disconnect", () => {
    if (socket.id === games[socket.data.roomId]?.white) {
      delete games[socket.data.roomId].white;
      console.log("player white left...");
    } else if (socket.id === games[socket.data.roomId]?.black) {
      delete games[socket.data.roomId].black;
      console.log("player black left...");
    }
  });
  socket.on("move", (move) => {
    try {
      // During white's turn black cannot move and vice versa
      if (
        games[move.room].chess.turn() === "w" &&
        games[move.room]?.white !== socket.id
      )
        return;
      if (
        games[move.room].chess.turn() === "b" &&
        games[move.room]?.black !== socket.id
      )
        return;
      let result = games[move.room].chess.move(move.move);
      if (result) {
        if (games[move.room].chess.isGameOver()) {
          io.to(move.room).emit("over", games[move.room].chess.turn());
          delete games[move.room]?.white;
          delete games[move.room]?.black;
          io.to(move.room).emit("boardState", games[move.room].chess.fen());
          games[move.room].chess.reset();
        } else {
          io.to(move.room).emit("boardState", games[move.room].chess.fen());
        }
      } else {
        console.log("invalid move...");
        socket.to(move.room).emit("invalid move", move);
      }
    } catch (err) {
      console.log("invalid move...");
      socket.to(move.room).emit("invalid move", move);
    }
  });
});

app.use(express.static(path.join(__dirname, "../Client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../Client/dist", "index.html"));
});

// const clientUrl = "http://localhost:5173"; // Deployed Client URL
// console.log("i am here...");

// app.get("*", (req, res) => {
//   console.log(`redirect url - http://localhost:5173${req.originalUrl}`);
//   res.redirect(`http://localhost:5173${req.originalUrl}`);
// });

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
