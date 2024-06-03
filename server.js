// const express = require("express");
// const app = express();
// const PORT = 3001;

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// const http = require("http").Server(app);
// const cors = require("cors");

// app.use(cors());

// const socketIO = require('socket.io')(http, {
//     cors: {
//         origin: "*"
//     }
// });

// const players = {}; // Збереження гравців та їх виборів

// socketIO.on('connection', (socket) => {
//     console.log(`⚡: ${socket.id} user just connected!`);
//     let id = Math.floor(Math.random() * 1000000000000000);
//     socket.on('joinGame', (playerName) => {
        
//         players[socket.id] = {id, name: playerName, choice: null };
//         console.log(`${playerName} has joined the game`);
//         socketIO.emit('players', players);
//     });

//     socket.on('makeChoice', (choice) => {
//         if (players[socket.id]) {
//             players[socket.id].choice = choice;
//             checkResults();
//         }
//     });

//     socket.on('disconnect', () => {
//         delete players[socket.id];
//         socketIO.emit('players', players);
//         console.log('🔥: A user disconnected');
//     });
// });

// const checkResults = () => {
//     const playerIds = Object.keys(players);
//     if (playerIds.length === 2) {
//         const [player1, player2] = playerIds.map(id => players[id]);

//         if (player1.choice && player2.choice) {
//             let result1, result2;
//             if (player1.choice === player2.choice) {
//                 result1 = result2 = "draw";
//             } else if (
//                 (player1.choice === 'rock' && player2.choice === 'scissors') ||
//                 (player1.choice === 'scissors' && player2.choice === 'paper') ||
//                 (player1.choice === 'paper' && player2.choice === 'rock')
//             ) {
//                 result1 = "win";
//                 result2 = "lose";
//             } else {
//                 result1 = "lose";
//                 result2 = "win";
//             }

//             socketIO.to(playerIds[0]).emit('result', result1);
//             socketIO.to(playerIds[1]).emit('result', result2);

//             players[playerIds[0]].choice = null;
//             players[playerIds[1]].choice = null;
//         }
//     }
// };

// http.listen(PORT, () => {
//     console.log(`Server listening on ${PORT}`);
// });


const express = require("express");
const app = express();
const PORT = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const http = require("http").Server(app);
const cors = require("cors");

app.use(cors());

const socketIO = require('socket.io')(http, {
  cors: {
    origin: "*"
  }
});

const games = {}; // Об'єкт для збереження гравців за іграми

socketIO.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);

  socket.on('joinGame', ({ gameId, playerName }) => {
    if (!games[gameId]) {
      games[gameId] = {};
    }
    games[gameId][socket.id] = { id: socket.id, name: playerName, choice: null };
    console.log(`${playerName} has joined the game ${gameId}`);
    socket.join(gameId); // Приєднання до кімнати з ID гри
    socketIO.to(gameId).emit('players', games[gameId]); // Надсилання оновленого списку гравців у кімнату
  });

  socket.on('makeChoice', (choice) => {
    const gameId = Object.keys(games).find(gameId => games[gameId][socket.id]);
    if (gameId && games[gameId] && games[gameId][socket.id]) {
      games[gameId][socket.id].choice = choice;
      checkResults(gameId);
    }
  });
  socket.on('disconnectGame', (gameId) => {
    const playerIds = Object.keys(games[gameId]);
    const playerId = playerIds.find(id => games[gameId][id].socketId === socket.id);
    if (playerId) {
      delete games[gameId][playerId];
      socketIO.to(gameId).emit('players', games[gameId]);
      console.log(`🔥: Player ${playerId} disconnected from game ${gameId}`);
    }
  });
});

const checkResults = (gameId) => {
  const players = Object.values(games[gameId]);
  if (players.length === 2) {
    const [player1, player2] = players;

    if (player1.choice && player2.choice) {
      let result1, result2;
      if (player1.choice === player2.choice) {
        result1 = result2 = "draw";
      } else if (
        (player1.choice === 'rock' && player2.choice === 'scissors') ||
        (player1.choice === 'scissors' && player2.choice === 'paper') ||
        (player1.choice === 'paper' && player2.choice === 'rock')
      ) {
        result1 = "win";
        result2 = "lose";
      } else {
        result1 = "lose";
        result2 = "win";
      }

      // Надсилання окремих результатів для кожного гравця
      socketIO.to(player1.id).emit('result', result1);
      socketIO.to(player2.id).emit('result', result2);

      // Перевірка перед скиданням вибору гравців
      if (games[gameId][player1.id]) {
        games[gameId][player1.id].choice = null;
      }
      if (games[gameId][player2.id]) {
        games[gameId][player2.id].choice = null;
      }
    }
  }
};

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
