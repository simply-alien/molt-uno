import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io(window.location.origin);

function App() {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [currentGame, setCurrentGame] = useState(null);
  const [myHand, setMyHand] = useState([]);
  const [gameList, setGameList] = useState([]);
  const [view, setView] = useState('home'); // home, lobby, game
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('game-created', ({ gameId, game }) => {
      setGameId(gameId);
      setCurrentGame(game);
      setView('lobby');
    });

    socket.on('player-joined', ({ game }) => {
      setCurrentGame(game);
    });

    socket.on('game-started', ({ game }) => {
      setCurrentGame(game);
      setView('game');
    });

    socket.on('your-hand', ({ hand }) => {
      setMyHand(hand);
    });

    socket.on('card-played', ({ game }) => {
      setCurrentGame(game);
    });

    socket.on('turn-changed', ({ game }) => {
      setCurrentGame(game);
    });

    socket.on('uno-called', ({ playerId }) => {
      console.log('UNO called by', playerId);
    });

    socket.on('game-ended', ({ winner }) => {
      alert(`Game Over! Winner: ${winner}`);
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    socket.on('game-list', (games) => {
      setGameList(games);
    });

    return () => {
      socket.off('game-created');
      socket.off('player-joined');
      socket.off('game-started');
      socket.off('your-hand');
      socket.off('card-played');
      socket.off('error');
      socket.off('game-list');
    };
  }, []);

  const createGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    socket.emit('create-game', playerName);
  };

  const joinGame = (targetGameId) => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    socket.emit('join-game', { gameId: targetGameId, playerName });
    setGameId(targetGameId);
  };

  const startGame = () => {
    socket.emit('start-game');
  };

  const playCard = (index, card) => {
    let chosenColor = null;
    if (card.type === 'wild') {
      chosenColor = prompt('Choose color: red, yellow, green, blue');
      if (!['red', 'yellow', 'green', 'blue'].includes(chosenColor)) {
        setError('Invalid color');
        return;
      }
    }
    socket.emit('play-card', { cardIndex: index, chosenColor });
  };

  const drawCard = () => {
    socket.emit('draw-card');
  };

  const callUno = () => {
    socket.emit('call-uno');
  };

  const refreshGameList = () => {
    socket.emit('list-games');
  };

  const CardComponent = ({ card, onClick }) => {
    const color = card.color || 'black';
    return (
      <div 
        className={`card card-${color}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <div className="card-value">
          {card.value === 'draw2' && '+2'}
          {card.value === 'draw4' && '+4'}
          {card.value === 'skip' && '⊘'}
          {card.value === 'reverse' && '⇄'}
          {card.value === 'wild' && 'W'}
          {!['draw2', 'draw4', 'skip', 'reverse', 'wild'].includes(card.value) && card.value}
        </div>
      </div>
    );
  };

  if (view === 'home') {
    return (
      <div className="app">
        <h1>🎮 Molt UNO</h1>
        <div className="home-screen">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
          />
          <button onClick={createGame}>Create New Game</button>
          <button onClick={refreshGameList}>Browse Games</button>
          
          {gameList.length > 0 && (
            <div className="game-list">
              <h3>Available Games</h3>
              {gameList.map(game => (
                <div key={game.id} className="game-item">
                  <span>Game {game.id} - {game.players} players</span>
                  <button onClick={() => joinGame(game.id)}>Join</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  if (view === 'lobby') {
    return (
      <div className="app">
        <h1>Game Lobby</h1>
        <h2>Game ID: {gameId}</h2>
        <div className="players-waiting">
          <h3>Players ({currentGame?.players.length}/10):</h3>
          <ul>
            {currentGame?.players.map(p => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
        <button onClick={startGame} disabled={currentGame?.players.length < 2}>
          Start Game
        </button>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  if (view === 'game') {
    const isMyTurn = currentGame?.currentPlayer === socket.id;
    
    return (
      <div className="app">
        <div className="game-header">
          <h2>Game {gameId}</h2>
          <div className="turn-indicator">
            {isMyTurn ? "🎯 YOUR TURN" : "Waiting..."}
          </div>
        </div>

        <div className="game-area">
          <div className="discard-pile">
            <h3>Top Card:</h3>
            {currentGame?.topCard && (
              <CardComponent card={currentGame.topCard} />
            )}
            <p>Color: <span style={{color: currentGame?.currentColor}}>{currentGame?.currentColor}</span></p>
          </div>

          <div className="other-players">
            {currentGame?.players.map(p => (
              <div key={p.id} className="player-info">
                <span>{p.name}</span>
                <span>{p.cardCount} cards</span>
                {p.calledUno && <span>🎯 UNO!</span>}
              </div>
            ))}
          </div>

          <div className="my-hand">
            <h3>Your Hand ({myHand.length} cards):</h3>
            <div className="cards">
              {myHand.map((card, index) => (
                <CardComponent
                  key={index}
                  card={card}
                  onClick={isMyTurn ? () => playCard(index, card) : null}
                />
              ))}
            </div>
            <div className="actions">
              <button onClick={drawCard} disabled={!isMyTurn}>Draw Card</button>
              <button onClick={callUno} disabled={myHand.length !== 1}>Call UNO!</button>
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
      </div>
    );
  }
}

export default App;
