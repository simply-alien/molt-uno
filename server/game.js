// UNO Game Engine - Official Rules

const COLORS = ['red', 'yellow', 'green', 'blue'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTIONS = ['skip', 'reverse', 'draw2'];

class UnoGame {
  constructor(gameId) {
    this.id = gameId;
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    this.currentColor = null;
    this.status = 'waiting'; // waiting, playing, finished
  }

  // Create authentic 108-card UNO deck
  createDeck() {
    const deck = [];
    
    // Numbered and action cards for each color
    for (const color of COLORS) {
      // One 0 per color
      deck.push({ type: 'number', color, value: '0' });
      
      // Two of each 1-9
      for (let i = 1; i <= 9; i++) {
        deck.push({ type: 'number', color, value: String(i) });
        deck.push({ type: 'number', color, value: String(i) });
      }
      
      // Two of each action per color
      for (const action of ACTIONS) {
        deck.push({ type: 'action', color, value: action });
        deck.push({ type: 'action', color, value: action });
      }
    }
    
    // Wild cards (4 each)
    for (let i = 0; i < 4; i++) {
      deck.push({ type: 'wild', color: null, value: 'wild' });
      deck.push({ type: 'wild', color: null, value: 'draw4' });
    }
    
    return deck;
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  startGame() {
    if (this.players.length < 2) {
      throw new Error('Need at least 2 players');
    }
    
    // Create and shuffle deck
    this.deck = this.shuffle(this.createDeck());
    
    // Deal 7 cards to each player
    for (const player of this.players) {
      player.hand = [];
      for (let i = 0; i < 7; i++) {
        player.hand.push(this.deck.pop());
      }
      player.calledUno = false;
    }
    
    // Flip first card
    this.discardPile.push(this.deck.pop());
    const topCard = this.discardPile[0];
    this.currentColor = topCard.color;
    
    this.status = 'playing';
  }

  addPlayer(playerId, name) {
    if (this.status !== 'waiting') {
      throw new Error('Game already started');
    }
    if (this.players.length >= 10) {
      throw new Error('Game is full (max 10 players)');
    }
    
    this.players.push({
      id: playerId,
      name: name,
      hand: [],
      calledUno: false
    });
  }

  canPlayCard(card, player) {
    if (this.players[this.currentPlayerIndex].id !== player.id) {
      return false; // Not your turn
    }
    
    const topCard = this.discardPile[this.discardPile.length - 1];
    
    // Wild cards can always be played
    if (card.type === 'wild') {
      return true;
    }
    
    // Match color or value
    return card.color === this.currentColor || 
           card.value === topCard.value;
  }

  playCard(playerId, cardIndex, chosenColor = null) {
    const player = this.players[this.currentPlayerIndex];
    
    if (player.id !== playerId) {
      throw new Error('Not your turn');
    }
    
    const card = player.hand[cardIndex];
    
    if (!this.canPlayCard(card, player)) {
      throw new Error('Cannot play this card');
    }
    
    // Remove card from hand and add to discard pile
    player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);
    
    // Handle wild cards
    if (card.type === 'wild') {
      this.currentColor = chosenColor;
    } else {
      this.currentColor = card.color;
    }
    
    // Apply card effects
    this.applyCardEffect(card);
    
    // Check if player won
    if (player.hand.length === 0) {
      this.status = 'finished';
      return { winner: player.id };
    }
    
    // Check UNO call
    if (player.hand.length === 1 && !player.calledUno) {
      // Should have called UNO
    }
    
    return { success: true };
  }

  applyCardEffect(card) {
    switch (card.value) {
      case 'skip':
        this.nextTurn();
        break;
      case 'reverse':
        if (this.players.length === 2) {
          this.nextTurn(); // Acts like skip in 2-player
        } else {
          this.direction *= -1;
        }
        break;
      case 'draw2':
        this.nextTurn();
        const nextPlayer = this.players[this.currentPlayerIndex];
        this.drawCards(nextPlayer, 2);
        break;
      case 'draw4':
        this.nextTurn();
        const nextPlayer4 = this.players[this.currentPlayerIndex];
        this.drawCards(nextPlayer4, 4);
        break;
    }
    
    this.nextTurn();
  }

  drawCards(player, count) {
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        this.reshuffleDeck();
      }
      player.hand.push(this.deck.pop());
    }
  }

  reshuffleDeck() {
    const topCard = this.discardPile.pop();
    this.deck = this.shuffle(this.discardPile);
    this.discardPile = [topCard];
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
  }

  callUno(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (player && player.hand.length === 1) {
      player.calledUno = true;
    }
  }

  getGameState(playerId = null) {
    return {
      id: this.id,
      status: this.status,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        cardCount: p.hand.length,
        calledUno: p.calledUno
      })),
      currentPlayer: this.players[this.currentPlayerIndex]?.id,
      topCard: this.discardPile[this.discardPile.length - 1],
      currentColor: this.currentColor,
      deckSize: this.deck.length,
      // Only reveal hand to the requesting player
      myHand: playerId ? this.players.find(p => p.id === playerId)?.hand : null
    };
  }
}

module.exports = UnoGame;
