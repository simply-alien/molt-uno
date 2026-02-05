const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const UnoGame = require('./game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Store active games
const games = new Map();
const playerSockets = new Map();

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    games: games.size,
    players: playerSockets.size 
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Create new game
  socket.on('create-game', (playerName) => {
    const gameId = generateGameId();
    const game = new UnoGame(gameId);
    game.addPlayer(socket.id, playerName);
    games.set(gameId, game);
    playerSockets.set(socket.id, gameId);
    
    socket.join(gameId);
    socket.emit('game-created', { gameId, game: game.getGameState(socket.id) });
    console.log(`Game ${gameId} created by ${playerName}`);
  });
  
  // Join existing game
  socket.on('join-game', ({ gameId, playerName }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    if (game.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }
    
    try {
      game.addPlayer(socket.id, playerName);
      playerSockets.set(socket.id, gameId);
      socket.join(gameId);
      
      // Notify all players in the game
      io.to(gameId).emit('player-joined', {
        playerId: socket.id,
        playerName,
        game: game.getGameState()
      });
      
      console.log(`${playerName} joined game ${gameId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  // Start game
  socket.on('start-game', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    try {
      game.startGame();
      io.to(gameId).emit('game-started', { game: game.getGameState() });
      
      // Send each player their hand
      for (const player of game.players) {
        io.to(player.id).emit('your-hand', {
          hand: player.hand
        });
      }
      
      console.log(`Game ${gameId} started`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  // Play card
  socket.on('play-card', ({ cardIndex, chosenColor }) => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    try {
      const result = game.playCard(socket.id, cardIndex, chosenColor);
      
      // Update all players
      io.to(gameId).emit('card-played', {
        playerId: socket.id,
        game: game.getGameState()
      });
      
      // Send updated hand to the player
      const player = game.players.find(p => p.id === socket.id);
      socket.emit('your-hand', { hand: player.hand });
      
      // Check for winner
      if (result.winner) {
        io.to(gameId).emit('game-ended', { winner: result.winner });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  // Draw card
  socket.on('draw-card', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    const player = game.players.find(p => p.id === socket.id);
    if (player && game.players[game.currentPlayerIndex].id === socket.id) {
      game.drawCards(player, 1);
      socket.emit('your-hand', { hand: player.hand });
      game.nextTurn();
      io.to(gameId).emit('turn-changed', { game: game.getGameState() });
    }
  });
  
  // Call UNO
  socket.on('call-uno', () => {
    const gameId = playerSockets.get(socket.id);
    const game = games.get(gameId);
    
    if (game) {
      game.callUno(socket.id);
      io.to(gameId).emit('uno-called', { playerId: socket.id });
    }
  });
  
  // Get game list
  socket.on('list-games', () => {
    const gameList = [];
    games.forEach((game, gameId) => {
      if (game.status === 'waiting') {
        gameList.push({
          id: gameId,
          players: game.players.length,
          status: game.status
        });
      }
    });
    socket.emit('game-list', gameList);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    const gameId = playerSockets.get(socket.id);
    if (gameId) {
      const game = games.get(gameId);
      if (game) {
        io.to(gameId).emit('player-left', { playerId: socket.id });
        // Clean up if game was waiting and last player left
        if (game.status === 'waiting' && game.players.length === 1) {
          games.delete(gameId);
        }
      }
      playerSockets.delete(socket.id);
    }
    console.log(`Player disconnected: ${socket.id}`);
  });
});

function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

server.listen(PORT, () => {
  console.log(`🎮 Molt UNO server running on port ${PORT}`);
});
