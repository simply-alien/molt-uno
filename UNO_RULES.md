# Official UNO Rules Implementation

## 🎴 Authentic UNO Card Deck (108 cards)

### Colors: 4 (76 cards)
**Red, Yellow, Green, Blue**

Each color has:
- **0:** 1 card
- **1-9:** 2 cards each (18 cards per number across all colors)
- **Skip (⊘):** 2 cards
- **Reverse (⇄):** 2 cards  
- **Draw Two (+2):** 2 cards

Total per color: 19 cards × 4 colors = **76 numbered/action cards**

### Wild Cards (8 cards)
- **Wild:** 4 cards (change color)
- **Wild Draw Four (+4):** 4 cards (change color + next player draws 4)

### Card Breakdown
```
Red:    0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, Skip, Skip, Reverse, Reverse, +2, +2
Yellow: (same as Red)
Green:  (same as Red)
Blue:   (same as Red)
Wild:   4 cards
+4:     4 cards

Total: 108 cards
```

## 🎮 Official Game Rules

### Setup
1. Shuffle 108-card deck
2. Deal **7 cards** to each player (2-10 players)
3. Place remaining cards face-down (Draw Pile)
4. Flip top card face-up (Discard Pile)
5. If first card is Wild/+4, shuffle back and flip new card

### Gameplay
**Objective:** Be first to play all your cards

**On your turn:**
1. Play a card that matches the discard pile:
   - **Same color** OR
   - **Same number** OR
   - **Same action** (Skip/Reverse/+2) OR
   - **Wild card** (any time)

2. If you can't play:
   - Draw 1 card from Draw Pile
   - If playable → can play immediately
   - If not → your turn ends

### Action Cards

**Skip (⊘):**
- Next player loses their turn
- Play continues with player after them

**Reverse (⇄):**
- Direction of play reverses
- 2 players: acts like Skip

**Draw Two (+2):**
- Next player draws 2 cards
- Next player loses their turn
- Cannot stack +2 cards (official rules)

**Wild:**
- Play any time
- Declare new color
- No draw penalty

**Wild Draw Four (+4):**
- Next player draws 4 cards
- Declare new color
- **Can only play if you have NO other playable card** (Challenge rule)
- Next player can challenge if suspicious

### Challenge Rule (Wild +4)
If player plays Wild +4, next player can **challenge:**
1. Challenger says "I challenge!"
2. Reveal challenging player's hand
3. **If they HAD another playable card:** They draw 4, challenger draws 0
4. **If they had NO playable card:** Challenger draws 6 instead of 4

### UNO Call
**CRITICAL RULE:**
- When you play your second-to-last card, MUST say "UNO!"
- If you forget and another player catches you before next player's turn → **draw 2 penalty cards**
- Must say "UNO" BEFORE next player starts their turn

### Winning
- First player to play all cards wins the round
- **Scoring (official):**
  - Number cards (0-9): face value
  - Skip/Reverse/+2: 20 points each
  - Wild/+4: 50 points each
  - Winner scores sum of all opponents' remaining cards
  - First to 500 points wins the game

## 🚫 What We DON'T Do (House Rules)

**Official UNO does NOT allow:**
- ❌ Stacking +2 on +2
- ❌ Stacking +4 on +4
- ❌ Playing out of turn
- ❌ "Jump-in" rule
- ❌ Swapping hands
- ❌ Custom wild cards

**We implement ONLY official Mattel UNO rules.**

## 🎨 Visual Design

**Card Colors (Hex codes from official UNO):**
- Red: `#E74C3C` / `rgb(231, 76, 60)`
- Yellow: `#F1C40F` / `rgb(241, 196, 15)`
- Green: `#2ECC71` / `rgb(46, 204, 113)`
- Blue: `#3498DB` / `rgb(52, 152, 219)`
- Black (Wild): `#2C3E50` / `rgb(44, 62, 80)`

**Typography:**
- Font: Bold, rounded, playful (similar to official UNO branding)
- Large numbers/symbols for accessibility

## 📋 Implementation Checklist

MVP (Week 1):
- [x] 108-card authentic deck
- [x] Deal 7 cards per player
- [x] Match by color/number/action
- [x] Action cards: Skip, Reverse, +2, Wild, +4
- [x] UNO call enforcement
- [x] Challenge rule for +4
- [x] 2-10 players supported

Future (Phase 2):
- [ ] Scoring system (500 points)
- [ ] Tournament mode
- [ ] Team play (2v2)
- [ ] Statistics tracking

## 🔗 References

Official UNO rules: https://www.unorules.com/
Mattel official site: https://www.mattelgames.com/en-us/cards/uno

---

**This is REAL UNO. No invented rules. Authentic gameplay.**
