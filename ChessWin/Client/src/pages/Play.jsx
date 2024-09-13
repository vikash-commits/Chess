import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Chess } from "chess.js";
import { useParams } from "react-router-dom";
const PORT = /*process.env.REACT_APP_PORT ||*/ 3000;

const Play = () => {
  const [board, setBoard] = useState(new Chess().board());
  const [socket, setSocket] = useState(null);
  const [winner, setWinner] = useState(null);
  const [playersConnected, setplayersConnected] = useState(false);
  const [room, setRoom] = useState("");
  let { roomId } = useParams();
  useEffect(() => {
    const newSocket = io("https://chesswin.onrender.com", {
      query: { roomId },
    }); //Deploy link:- https://chesswin.onrender.com
    setSocket(newSocket);
    newSocket.on("bothPlayersConnected", (roomid) => {
      setRoom(roomid);
      setplayersConnected(true);
    });
    newSocket.on("boardState", (fen) => {
      const updatedChess = new Chess(fen);
      setBoard(updatedChess.board());
    });
    newSocket.on("over", (turn) => {
      setWinner(turn === "w" ? "Black wins.." : "White wins...");
    });
    return () => {
      newSocket.disconnect();
    };
  }, []);
  const pieces = [
    { type: "p", color: "w", logo: "♙" },
    { type: "r", color: "w", logo: "♖" },
    { type: "n", color: "w", logo: "♘" },
    { type: "b", color: "w", logo: "♗" },
    { type: "q", color: "w", logo: "♕" },
    { type: "k", color: "w", logo: "♔" },

    { type: "p", color: "b", logo: "♟" },
    { type: "r", color: "b", logo: "♜" },
    { type: "n", color: "b", logo: "♞" },
    { type: "b", color: "b", logo: "♝" },
    { type: "q", color: "b", logo: "♛" },
    { type: "k", color: "b", logo: "♚" },
  ];
  let draggedPiece = null;
  let sourceSquare = null;

  function handleDragStart(col) {
    draggedPiece = col;
    sourceSquare = col.square;
  }

  function handleDrop(rowIndex, colIndex) {
    if (!draggedPiece) return;
    const move = {
      from: sourceSquare,
      to: `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`,
    };
    if (draggedPiece.type === "p" && (rowIndex === 0 || rowIndex === 7)) {
      move.promotion = "q";
    }
    socket.emit("move", { move, room });
    draggedPiece = null;
    sourceSquare = null;
  }

  return (
    <>
      <div className="w-full min-h-full flex flex-col items-center justify-center bg-slate-900">
        {roomId && (
          <div
            className={`text-white mb-8 ${playersConnected ? "hidden" : ""}`}
          >
            Share this link with your friend to play a game -
            <a
              className="text-blue-500"
              target="_blank"
              href={`https://chesswin.onrender.com/play/${roomId}`}
            >{` https://chesswin.onrender.com/play/${roomId}`}</a>
          </div>
        )}
        {playersConnected === false ? (
          <div className="text-white text-7xl">Connecting....</div>
        ) : (
          <div className="w-[32rem] h-[32rem] relative">
            {winner && (
              <div className="absolute top-1/2 left-36">
                <span className="text-5xl">{winner}</span>
                <button onClick={() => window.location.reload()}>
                  Play Again
                </button>
              </div>
            )}
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="w-full flex">
                {row.map((col, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`h-16 w-16 text-4xl flex items-center justify-center ${
                      (rowIndex + colIndex) % 2 === 0
                        ? "bg-[#fbf5de]"
                        : "bg-[#f2ca5c]"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={() => handleDrop(rowIndex, colIndex)}
                  >
                    <div
                      draggable
                      className="hover:cursor-grab"
                      onDragStart={() =>
                        handleDragStart(col, rowIndex, colIndex)
                      }
                    >
                      {col &&
                        pieces.find((p) => {
                          return p.type === col.type && p.color === col.color;
                        }).logo}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Play;
