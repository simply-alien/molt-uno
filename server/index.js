const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const UnoGame = require('./game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
const games = new Map();
const playerSockets = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  if (!req.url.includes('/socket.io')) {
    res.sendFile(path.join(__dirname, '../index.html'));
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size });
});

// Socket.IO handlers (same as before)
io.on('connection', (socket) => {
  console.log(\`Player connected: \${socket.id}\`);
  
  socket.on('create-game', (playerName) => {
    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const game = new UnoGame(gameId);
    game.addPlayer(socket.id, playerName);
    games.set(gameId, game);
    playerSockets.set(socket.id, gameId);
    socket.join(gameId);
    socket.emit('game-created', { gameId, game: game.getGameState(socket.id) });
  });
  
  socket.on('join-game', ({ gameId, playerName }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    try {
      game.addPlayer(socket.id, playerName);
      playerSockets.set(socket.id, gameId);
      socket.join(gameId);
      io.to(gameId).emit('player-joined', { playerId: socket.id, playerName, game: game.getGameState() });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('start-game', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    if (!game) return;
    try {
      game.startGame();
      io.to(gameId).emit('game-started', { game: game.getGameState() });
      for (const player of game.players) {
        io.to(player.id).emit('your-hand', { hand: player.hand });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('play-card', ({ cardIndex, chosenColor }) => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    if (!game) return;
    try {
      const result = game.playCard(socket.id, cardIndex, chosenColor);
      io.to(gameId).emit('card-played', { playerId: socket.id, game: game.getGameState() });
      const player = game.players.find(p => p.id === socket.id);
      socket.emit('your-hand', { hand: player.hand });
      if (result.winner) {
        io.to(gameId).emit('game-ended', { winner: result.winner });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  socket.on('draw-card', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    if (!game) return;
    const player = game.players.find(p => p.id === socket.id);
    if (player && game.players[game.currentPlayerIndex].id === socket.id) {
      game.drawCards(player, 1);
      socket.emit('your-hand', { hand: player.hand });
      game.nextTurn();
      io.to(gameId).emit('turn-changed', { game: game.getGameState() });
    }
  });
  
  socket.on('call-uno', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    if (game) {
      game.callUno(socket.id);
      io.to(gameId).emit('uno-called', { playerId: socket.id });
    }
  });
  
  socket.on('list-games', () => {
    const gameList = [];
    games.forEach((game, gameId) => {
      if (game.status === 'waiting') {
        gameList.push({ id: gameId, players: game.players.length, status: game.status });
      }
    });
    socket.emit('game-list', gameList);
  });
  
  socket.on('disconnect', () => {
    const gameId = playerSockets.get(socket.id);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        io.to(gameId).emit('player-left', { playerId: socket.id });
        if (game.status === 'waiting' && game.players.length === 1) {
          games.delete(gameId);
        }
      }
      playerSockets.delete(socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(\`🎮 Molt UNO server on port \${PORT}\`);
});
