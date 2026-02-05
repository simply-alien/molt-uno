const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const UnoGame = require('./game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const games = new Map();
const playerSockets = new Map();

app.use(express.static(path.join(__dirname, '../dist')));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('*', (req, res) => {
  if (!req.url.includes('/socket.io')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('create-game', (name) => {
    const id = Math.random().toString(36).substr(2, 8).toUpperCase();
    const game = new UnoGame(id);
    game.addPlayer(socket.id, name);
    games.set(id, game);
    playerSockets.set(socket.id, id);
    socket.join(id);
    socket.emit('game-created', { gameId: id, game: game.getGameState(socket.id) });
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    playerSockets.delete(socket.id);
  });
});

server.listen(PORT, () => console.log('Server on port', PORT));
