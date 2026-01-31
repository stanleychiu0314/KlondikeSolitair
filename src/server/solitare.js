/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

export const shuffleCards = (includeJokers = false) => {
  /* Return an array of 52 cards (if jokers is false, 54 otherwise). Carefully follow the instructions in the README */
  let cards = [];
  ["spades", "clubs", "hearts", "diamonds"].forEach((suit) => {
    ["ace", 2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king"].forEach(
      (value) => {
        cards.push({ suit: suit, value: value });
      },
    );
  });
  // Add in jokers here
  if (includeJokers) {
    /*...*/
  }
  // Now shuffle
  let deck = [];
  while (cards.length > 0) {
    // Find a random number between 0 and cards.length - 1
    const index = Math.floor(Math.random() * cards.length);
    deck.push(cards[index]);
    cards.splice(index, 1);
  }
  return deck;
};

export const initialState = () => {
  /* Use the above function.  Generate and return an initial state for a game */
  let state = {
    pile1: [],
    pile2: [],
    pile3: [],
    pile4: [],
    pile5: [],
    pile6: [],
    pile7: [],
    stack1: [],
    stack2: [],
    stack3: [],
    stack4: [],
    draw: [],
    discard: [],
  };

  // Get the shuffled deck and distribute it to the players
  const deck = shuffleCards(false);
  // Setup the piles
  for (let i = 1; i <= 7; ++i) {
    let card = deck.splice(0, 1)[0];
    card.up = true;
    state[`pile${i}`].push(card);
    for (let j = i + 1; j <= 7; ++j) {
      card = deck.splice(0, 1)[0];
      card.up = false;
      state[`pile${j}`].push(card);
    }
  }
  // Finally, get the draw right
  state.draw = deck.map((card) => {
    card.up = false;
    return card;
  });
  return state;
};

export const filterGameForProfile = (game) => ({
  active: game.active,
  score: game.score,
  won: game.won,
  id: game._id,
  game: "klondyke",
  start: game.start,
  end: game.end,
  state: game.state,
  moves: game.moves,
  winner: game.winner,
});

export const filterMoveForResults = (move) => {
  // Convert mongoose document to plain object if needed
  const moveObj = move.toObject ? move.toObject() : move;
  return {
    cards: moveObj.cards,
    src: moveObj.src,
    dst: moveObj.dst,
    date: moveObj.date ? Date.parse(moveObj.date) : Date.now(),
  };
};

const getCardValue = (card) => {
  const value = card.value;
  if (value === "ace") return 1;
  if (value === "jack") return 11;
  if (value === "queen") return 12;
  if (value === "king") return 13;
  return parseInt(value);
};

const isRed = (card) => {
  return card.suit === "hearts" || card.suit === "diamonds";
};

const isBlack = (card) => {
  return card.suit === "spades" || card.suit === "clubs";
};

export const validateMove = async (currentState, requestedMove) => {
  const { cards, src, dst } = requestedMove;

  if (!cards || cards.length === 0) {
    return { error: "No cards specified" };
  }

  if (!src || !dst) {
    return { error: "Source and destination must be specified" };
  }

  // Make a deep copy of the current state
  const newState = JSON.parse(JSON.stringify(currentState));

  // Validate source pile exists and has cards
  if (!newState[src]) {
    return { error: `Invalid source pile: ${src}` };
  }

  if (!newState[dst] && dst !== "stack1" && dst !== "stack2" && dst !== "stack3" && dst !== "stack4") {
    return { error: `Invalid destination pile: ${dst}` };
  }

  const srcPile = newState[src];
  const dstPile = newState[dst];

  // Special case: drawing from draw pile to discard
  if (src === "draw" && dst === "discard") {
    if (srcPile.length === 0) {
      return { error: "Draw pile is empty" };
    }
    // Move the specified number of cards
    const cardsToDraw = cards.length;
    if (cardsToDraw > srcPile.length) {
      return { error: "Not enough cards in draw pile" };
    }
    // Move cards from draw to discard
    for (let i = 0; i < cardsToDraw; i++) {
      const card = srcPile.shift();
      card.up = true;
      dstPile.unshift(card);
    }
    return newState;
  }

  // Special case: moving discard back to draw (resetting draw pile)
  if (src === "discard" && dst === "draw") {
    if (dstPile.length !== 0) {
      return { error: "Draw pile must be empty to reset" };
    }
    // Move all discard cards back to draw, face down
    while (srcPile.length > 0) {
      const card = srcPile.shift();
      card.up = false;
      dstPile.push(card);
    }
    return newState;
  }

  // Find the cards to move in the source pile
  let startIndex = -1;
  for (let i = 0; i < srcPile.length; i++) {
    if (srcPile[i].suit === cards[0].suit && srcPile[i].value.toString() === cards[0].value.toString()) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    return { error: "Card not found in source pile" };
  }

  // Verify all cards match
  if (startIndex + cards.length > srcPile.length) {
    return { error: "Not enough cards in source pile" };
  }

  for (let i = 0; i < cards.length; i++) {
    const srcCard = srcPile[startIndex + i];
    const reqCard = cards[i];
    if (srcCard.suit !== reqCard.suit || srcCard.value.toString() !== reqCard.value.toString()) {
      return { error: "Cards don't match source pile" };
    }
  }

  // Only allow moving face-up cards from tableau piles
  if (src.startsWith("pile") && !srcPile[startIndex].up) {
    return { error: "Cannot move face-down cards" };
  }

  // Can only move one card at a time from discard or foundation
  if ((src === "discard" || src.startsWith("stack")) && cards.length > 1) {
    return { error: "Can only move one card at a time from discard or foundation" };
  }

  // Can only move top card from discard
  if (src === "discard" && startIndex !== 0) {
    return { error: "Can only move top card from discard pile" };
  }

  // Can only move top card from foundation
  if (src.startsWith("stack") && startIndex !== srcPile.length - 1) {
    return { error: "Can only move top card from foundation" };
  }

  const movingCard = srcPile[startIndex];

  // Validate move to foundation (stack)
  if (dst.startsWith("stack")) {
    if (cards.length > 1) {
      return { error: "Can only move one card to foundation" };
    }

    if (dstPile.length === 0) {
      // Must be an Ace
      if (getCardValue(movingCard) !== 1) {
        return { error: "Foundation must start with Ace" };
      }
    } else {
      const topCard = dstPile[dstPile.length - 1];
      // Must be same suit
      if (movingCard.suit !== topCard.suit) {
        return { error: "Foundation cards must be same suit" };
      }
      // Must be one higher
      if (getCardValue(movingCard) !== getCardValue(topCard) + 1) {
        return { error: "Foundation cards must be in ascending order" };
      }
    }
  }

  // Validate move to tableau (pile)
  if (dst.startsWith("pile")) {
    if (dstPile.length === 0) {
      // Only King can be placed on empty pile
      if (getCardValue(movingCard) !== 13) {
        return { error: "Only King can be placed on empty tableau pile" };
      }
    } else {
      const topCard = dstPile[dstPile.length - 1];
      // Must be opposite color
      if ((isRed(movingCard) && isRed(topCard)) || (isBlack(movingCard) && isBlack(topCard))) {
        return { error: "Tableau cards must alternate colors" };
      }
      // Must be one lower
      if (getCardValue(movingCard) !== getCardValue(topCard) - 1) {
        return { error: "Tableau cards must be in descending order" };
      }
    }
  }

  // Perform the move
  const movedCards = srcPile.splice(startIndex, cards.length);
  movedCards.forEach((card) => {
    card.up = true;
    dstPile.push(card);
  });

  // Flip top card of source pile if it's a tableau pile
  if (src.startsWith("pile") && srcPile.length > 0) {
    srcPile[srcPile.length - 1].up = true;
  }

  return newState;
};
