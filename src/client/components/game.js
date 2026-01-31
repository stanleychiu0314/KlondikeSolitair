/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import { Pile } from "./pile.js";

const CardRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 2em;
`;

const CardRowGap = styled.div`
  flex-grow: 2;
`;

const GameBase = styled.div`
  grid-row: 2;
  grid-column: sb / main;
`;

const ButtonContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
`;

const GameButton = styled.button`
  padding: 0.8em 1.5em;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: bold;
  min-width: 140px;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const AutoCompleteButton = styled(GameButton)`
  background-color: #4caf50;
`;

const EndGameButton = styled(GameButton)`
  background-color: #f44336;
`;

const UndoButton = styled(GameButton)`
  background-color: #ff9800;
`;

const RedoButton = styled(GameButton)`
  background-color: #2196f3;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2em;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  min-width: 300px;
  text-align: center;
`;

const ModalMessage = styled.p`
  margin: 0 0 1.5em 0;
  font-size: 1em;
  line-height: 1.5;
  color: #333;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const ModalButton = styled.button`
  padding: 0.6em 1.5em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
  min-width: 80px;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const ModalOkButton = styled(ModalButton)`
  background-color: #4caf50;
  color: white;
`;

const ModalCancelButton = styled(ModalButton)`
  background-color: #757575;
  color: white;
`;

const Modal = ({ isOpen, message, onConfirm, onCancel, showCancel = false }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalMessage>{message}</ModalMessage>
        <ModalButtons>
          <ModalOkButton onClick={onConfirm}>OK</ModalOkButton>
          {showCancel && <ModalCancelButton onClick={onCancel}>Cancel</ModalCancelButton>}
        </ModalButtons>
      </ModalContent>
    </ModalOverlay>
  );
};

export const Game = () => {
  const { id } = useParams();
  let [state, setState] = useState({
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
  });
  let [selectedCards, setSelectedCards] = useState(null);
  let [drawCount, setDrawCount] = useState(1);
  let [isAutoCompleting, setIsAutoCompleting] = useState(false);
  let [currentMoveCount, setCurrentMoveCount] = useState(0);
  let [undoStack, setUndoStack] = useState([]);
  let [redoStack, setRedoStack] = useState([]);
  let [endGamePromptShown, setEndGamePromptShown] = useState(false);
  let [modal, setModal] = useState({ isOpen: false, message: "", onConfirm: null, showCancel: false });

  useEffect(() => {
    const getGameState = async () => {
      const response = await fetch(`/v1/game/${id}`);
      const data = await response.json();
      setState({
        pile1: data.pile1,
        pile2: data.pile2,
        pile3: data.pile3,
        pile4: data.pile4,
        pile5: data.pile5,
        pile6: data.pile6,
        pile7: data.pile7,
        stack1: data.stack1,
        stack2: data.stack2,
        stack3: data.stack3,
        stack4: data.stack4,
        draw: data.draw,
        discard: data.discard,
      });
      setDrawCount(data.drawCount || 1);
      setCurrentMoveCount(data.moves || 0);

      // Build undo stack from 0 to current move count
      const moves = [];
      for (let i = 0; i <= (data.moves || 0); i++) {
        moves.push(i);
      }
      setUndoStack(moves);
    };
    getGameState().then();
  }, [id]);

  // Add ESC key handler to deselect cards
  useEffect(() => {
    const handleKeyDown = (ev) => {
      if (ev.key === "Escape" && selectedCards) {
        setSelectedCards(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCards]);

  // Check for game end conditions whenever state changes
  useEffect(() => {
    // Don't check on initial render (when everything including stacks is empty)
    const totalCards =
      state.pile1.length + state.pile2.length + state.pile3.length +
      state.pile4.length + state.pile5.length + state.pile6.length +
      state.pile7.length + state.draw.length + state.discard.length +
      state.stack1.length + state.stack2.length + state.stack3.length + state.stack4.length;

    if (totalCards === 0) {
      return; // Initial empty state, don't check
    }

    // Don't show prompt if already shown
    if (endGamePromptShown) {
      return;
    }

    // Check if game is won (must check this FIRST)
    if (checkForWin(state)) {
      setEndGamePromptShown(true);
      setTimeout(() => {
        setModal({
          isOpen: true,
          message: "Congratulations! You've won the game! All cards have been moved to the foundation stacks. Would you like to end the game?",
          onConfirm: () => {
            setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false });
            endGameAsWon();
          },
          onCancel: () => {
            setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false });
            setEndGamePromptShown(false);
          },
          showCancel: true
        });
      }, 500);
      return;
    }

    // Check if game is stuck (no moves to foundation AND both draw and discard are empty)
    if (!checkForPossibleMoves(state) && state.draw.length === 0 && state.discard.length === 0) {
      setEndGamePromptShown(true);
      setTimeout(() => {
        setModal({
          isOpen: true,
          message: "No more moves available to the foundation. Would you like to end the game?",
          onConfirm: () => {
            setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false });
            endGameAsLost();
          },
          onCancel: () => {
            setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false });
            // Keep endGamePromptShown as true so it doesn't prompt again
          },
          showCancel: true
        });
      }, 500);
    }
  }, [state, endGamePromptShown]);

  const getPileNameFromTarget = (target) => {
    // Navigate up to find the pile container
    let element = target;
    while (element && !element.dataset.pile) {
      element = element.parentElement;
    }
    return element ? element.dataset.pile : null;
  };

  const getCardIndexInPile = (pileName, cardId) => {
    const pile = state[pileName];
    if (!pile) return -1;
    const [suit, value] = cardId.split(":");
    for (let i = 0; i < pile.length; i++) {
      if (pile[i].suit === suit && pile[i].value.toString() === value) {
        return i;
      }
    }
    return -1;
  };

  const checkForWin = (gameState) => {
    // Check if all 52 cards are in the foundation stacks
    const totalInStacks =
      (gameState.stack1?.length || 0) +
      (gameState.stack2?.length || 0) +
      (gameState.stack3?.length || 0) +
      (gameState.stack4?.length || 0);

    return totalInStacks === 52;
  };

  const checkForPossibleMoves = (gameState) => {
    // Only check for moves from piles/discard to foundation stacks
    // Ignore pile-to-pile rearrangements
    const sources = ['pile1', 'pile2', 'pile3', 'pile4', 'pile5', 'pile6', 'pile7', 'discard'];
    const stacks = ['stack1', 'stack2', 'stack3', 'stack4'];

    const getCardValue = (card) => {
      const cardValues = { ace: 1, jack: 11, queen: 12, king: 13 };
      return typeof card.value === 'number' ? card.value : cardValues[card.value];
    };

    for (const src of sources) {
      const pile = gameState[src];
      if (!pile || pile.length === 0) continue;

      const topCard = src === 'discard' ? pile[0] : pile[pile.length - 1];
      if (!topCard || !topCard.up) continue;

      // Check if this card can move to any foundation
      for (const dst of stacks) {
        const stack = gameState[dst];
        if (stack.length === 0 && topCard.value === 'ace') return true;
        if (stack.length > 0) {
          const stackTop = stack[stack.length - 1];
          const topVal = getCardValue(topCard);
          const stackVal = getCardValue(stackTop);
          if (topCard.suit === stackTop.suit && topVal === stackVal + 1) return true;
        }
      }
    }
    return false;
  };

  const handleMove = async (cards, src, dst) => {
    // Prevent moving cards to the same pile
    if (src === dst) {
      console.log("Cannot move cards to the same pile");
      setSelectedCards(null);
      return;
    }

    const moveData = { cards, src, dst };
    console.log("Move requested:", moveData);

    // If we have undone moves (redo stack is not empty), we need to reset the game first
    if (redoStack.length > 0) {
      console.log(`Resetting game to move ${currentMoveCount} before making new move`);
      try {
        const resetResponse = await fetch(`/v1/game/${id}/reset/${currentMoveCount}`, {
          method: "PUT",
        });
        if (!resetResponse.ok) {
          const error = await resetResponse.json();
          console.error("Failed to reset game:", error);
          setModal({
            isOpen: true,
            message: "Failed to reset game state. Please refresh the page.",
            onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
            onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
            showCancel: false
          });
          return;
        }
      } catch (err) {
        console.error("Error resetting game:", err);
        setModal({
          isOpen: true,
          message: "Error resetting game state. Please refresh the page.",
          onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          showCancel: false
        });
        return;
      }
    }

    // Clear redo stack when making a new move
    setRedoStack([]);

    try {
      const response = await fetch(`/v1/game/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(moveData),
      });

      const result = await response.json();

      if (response.ok) {
        // Update state with new game state from server
        const newState = {
          pile1: result.pile1,
          pile2: result.pile2,
          pile3: result.pile3,
          pile4: result.pile4,
          pile5: result.pile5,
          pile6: result.pile6,
          pile7: result.pile7,
          stack1: result.stack1,
          stack2: result.stack2,
          stack3: result.stack3,
          stack4: result.stack4,
          draw: result.draw,
          discard: result.discard,
        };
        setState(newState);
        setSelectedCards(null);

        // Increment move count and update undo stack
        const newMoveCount = currentMoveCount + 1;
        setCurrentMoveCount(newMoveCount);
        setUndoStack(prev => [...prev, newMoveCount]);

        // End-game checks are now handled by useEffect
      } else {
        console.error("Invalid move:", result.error);
        setModal({
          isOpen: true,
          message: `Invalid move: ${result.error}`,
          onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          showCancel: false
        });
        setSelectedCards(null);
      }
    } catch (err) {
      console.error("Error making move:", err);
      setModal({
        isOpen: true,
        message: "Error making move",
        onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        showCancel: false
      });
      setSelectedCards(null);
    }
  };

  const endGameAsWon = async () => {
    try {
      const response = await fetch(`/v1/game/${id}/end`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ won: true }),
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          message: "Game completed successfully! Redirecting to profile...",
          onConfirm: () => {
            setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false });
            const userData = localStorage.getItem("user");
            const username = userData ? JSON.parse(userData).username : "";
            window.location.href = `/profile/${username}`;
          },
          onCancel: () => {
            setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false });
            const userData = localStorage.getItem("user");
            const username = userData ? JSON.parse(userData).username : "";
            window.location.href = `/profile/${username}`;
          },
          showCancel: false
        });
      } else {
        const error = await response.json();
        setModal({
          isOpen: true,
          message: `Error ending game: ${error.error || "Unknown error"}`,
          onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          showCancel: false
        });
      }
    } catch (err) {
      console.error("Error ending game:", err);
      setModal({
        isOpen: true,
        message: `Error ending game: ${err.message}`,
        onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        showCancel: false
      });
    }
  };

  const endGameAsLost = async () => {
    try {
      const response = await fetch(`/v1/game/${id}/end`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ won: false }),
      });

      if (response.ok) {
        setModal({
          isOpen: true,
          message: "Game ended. Redirecting to profile...",
          onConfirm: () => {
            setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false });
            const userData = localStorage.getItem("user");
            const username = userData ? JSON.parse(userData).username : "";
            window.location.href = `/profile/${username}`;
          },
          onCancel: () => {
            setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false });
            const userData = localStorage.getItem("user");
            const username = userData ? JSON.parse(userData).username : "";
            window.location.href = `/profile/${username}`;
          },
          showCancel: false
        });
      } else {
        const error = await response.json();
        setModal({
          isOpen: true,
          message: `Error ending game: ${error.error || "Unknown error"}`,
          onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          showCancel: false
        });
      }
    } catch (err) {
      console.error("Error ending game:", err);
      setModal({
        isOpen: true,
        message: `Error ending game: ${err.message}`,
        onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        showCancel: false
      });
    }
  };

  const handleAutoComplete = async () => {
    setIsAutoCompleting(true);
    let movesMade = 0;
    let maxIterations = 52;

    // Get fresh state from server
    const getCurrentState = async () => {
      const response = await fetch(`/v1/game/${id}`);
      const data = await response.json();
      return {
        pile1: data.pile1, pile2: data.pile2, pile3: data.pile3, pile4: data.pile4,
        pile5: data.pile5, pile6: data.pile6, pile7: data.pile7,
        stack1: data.stack1, stack2: data.stack2, stack3: data.stack3, stack4: data.stack4,
        draw: data.draw, discard: data.discard,
      };
    };

    for (let i = 0; i < maxIterations; i++) {
      // Get fresh state before each iteration
      const currentState = await getCurrentState();

      const sources = ["pile1", "pile2", "pile3", "pile4", "pile5", "pile6", "pile7", "discard"];
      const stacks = ["stack1", "stack2", "stack3", "stack4"];
      let foundMove = false;

      for (const src of sources) {
        const pile = currentState[src];
        if (!pile || pile.length === 0) continue;

        const topCard = src === "discard" ? pile[0] : pile[pile.length - 1];
        if (!topCard || !topCard.up) continue;

        for (const dst of stacks) {
          const card = { suit: topCard.suit, value: topCard.value };

          try {
            const response = await fetch(`/v1/game/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cards: [card], src, dst }),
            });

            const result = await response.json();
            if (response.ok) {
              setState({
                pile1: result.pile1, pile2: result.pile2, pile3: result.pile3, pile4: result.pile4,
                pile5: result.pile5, pile6: result.pile6, pile7: result.pile7,
                stack1: result.stack1, stack2: result.stack2, stack3: result.stack3, stack4: result.stack4,
                draw: result.draw, discard: result.discard,
              });
              movesMade++;
              foundMove = true;
              await new Promise(resolve => setTimeout(resolve, 100));
              break;
            }
          } catch (err) {
            console.error("Autocomplete move failed:", err);
          }
        }
        if (foundMove) break;
      }

      if (!foundMove) break;
    }

    setIsAutoCompleting(false);

    // Get final state and check for win
    const finalState = await getCurrentState();
    if (checkForWin(finalState)) {
      setTimeout(() => {
        setModal({
          isOpen: true,
          message: "Congratulations! You've won the game! All cards have been moved to the foundation stacks. Would you like to end the game?",
          onConfirm: () => {
            setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false });
            endGameAsWon();
          },
          onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          showCancel: true
        });
      }, 500);
    } else if (movesMade > 0) {
      setModal({
        isOpen: true,
        message: `Autocompleted ${movesMade} move(s)`,
        onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        showCancel: false
      });
    } else {
      setModal({
        isOpen: true,
        message: "No moves available to autocomplete",
        onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        showCancel: false
      });
    }
  };

  const handleUndo = async () => {
    if (currentMoveCount === 0) {
      setModal({
        isOpen: true,
        message: "Nothing to undo",
        onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        showCancel: false
      });
      return;
    }

    // Move current move count to redo stack
    setRedoStack(prev => [...prev, currentMoveCount]);

    // Decrement move count
    const newMoveCount = currentMoveCount - 1;
    setCurrentMoveCount(newMoveCount);

    // Update undo stack
    setUndoStack(prev => prev.slice(0, -1));

    // Fetch game state from server at the previous move index (0-based)
    const moveIndex = newMoveCount - 1;

    try {
      const res = await fetch(`/v1/game/${id}/move/${moveIndex}`);
      if (res.ok) {
        const gameState = await res.json();
        setState(gameState);
      } else {
        const error = await res.json();
        console.error("Failed to fetch game state:", error);
        setModal({
          isOpen: true,
          message: `Failed to undo move: ${error.error || 'Unknown error'}`,
          onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          showCancel: false
        });
        // Restore move count on error
        setCurrentMoveCount(currentMoveCount);
        setUndoStack(prev => [...prev, currentMoveCount]);
        setRedoStack(prev => prev.slice(0, -1));
      }
    } catch (err) {
      console.error("Failed to fetch game state:", err);
      setModal({
        isOpen: true,
        message: "Failed to undo move",
        onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        showCancel: false
      });
      // Restore move count on error
      setCurrentMoveCount(currentMoveCount);
      setUndoStack(prev => [...prev, currentMoveCount]);
      setRedoStack(prev => prev.slice(0, -1));
    }

    setSelectedCards(null);
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) {
      setModal({
        isOpen: true,
        message: "Nothing to redo",
        onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        showCancel: false
      });
      return;
    }

    // Get the move count to redo to
    const moveCountToRedo = redoStack[redoStack.length - 1];

    // Update redo stack
    setRedoStack(prev => prev.slice(0, -1));

    // Update undo stack and move count
    setUndoStack(prev => [...prev, moveCountToRedo]);
    setCurrentMoveCount(moveCountToRedo);

    // Fetch game state from server at this move index (0-based)
    const moveIndex = moveCountToRedo - 1;

    try {
      const res = await fetch(`/v1/game/${id}/move/${moveIndex}`);
      if (res.ok) {
        const gameState = await res.json();
        setState(gameState);
      } else {
        const error = await res.json();
        console.error("Failed to fetch game state:", error);
        setModal({
          isOpen: true,
          message: `Failed to redo move: ${error.error || 'Unknown error'}`,
          onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
          showCancel: false
        });
        // Restore on error
        setCurrentMoveCount(currentMoveCount);
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, moveCountToRedo]);
      }
    } catch (err) {
      console.error("Failed to fetch game state:", err);
      setModal({
        isOpen: true,
        message: "Failed to redo move",
        onConfirm: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        onCancel: () => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }),
        showCancel: false
      });
      // Restore on error
      setCurrentMoveCount(currentMoveCount);
      setUndoStack(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, moveCountToRedo]);
    }

    setSelectedCards(null);
  };

  const onClick = (ev) => {
    // Stop event propagation to prevent multiple clicks
    ev.stopPropagation();

    let target = ev.target;
    const pileName = getPileNameFromTarget(target);

    if (!pileName) {
      // Clicked on background - reset selection
      setSelectedCards(null);
      return;
    }

    // Handle draw pile click - ALWAYS handle this first, even if empty
    if (pileName === "draw") {
      const drawPile = state.draw;
      const discardPile = state.discard;

      console.log(`Draw pile clicked. Draw pile length: ${drawPile.length}, Discard pile length: ${discardPile.length}`);

      if (drawPile.length === 0) {
        // Move all discard cards back to draw
        if (discardPile.length > 0) {
          console.log("Resetting draw pile - moving discard back to draw");
          const cards = discardPile.map((card) => ({ suit: card.suit, value: card.value }));
          handleMove(cards, "discard", "draw");
        } else {
          console.log("Both draw and discard piles are empty");
        }
      } else {
        // Draw cards from draw to discard
        const cardsToDraw = Math.min(drawCount, drawPile.length);
        console.log(`Drawing ${cardsToDraw} card(s) from draw to discard`);
        const cards = drawPile.slice(0, cardsToDraw).map((card) => ({ suit: card.suit, value: card.value }));
        handleMove(cards, "draw", "discard");
      }
      // Always clear selection when clicking draw pile
      setSelectedCards(null);
      return;
    }

    const cardId = target.id;
    const pile = state[pileName];

    if (!pile || pile.length === 0) {
      // Clicked on empty pile
      if (selectedCards) {
        // This is the destination
        handleMove(selectedCards.cards, selectedCards.src, pileName);
      }
      return;
    }

    // If no card ID (clicked on pile frame), handle as empty pile destination
    if (!cardId) {
      if (selectedCards) {
        handleMove(selectedCards.cards, selectedCards.src, pileName);
      }
      return;
    }

    const cardIndex = getCardIndexInPile(pileName, cardId);
    if (cardIndex === -1) {
      console.warn(`Card ${cardId} not found in ${pileName}`);
      return;
    }

    const card = pile[cardIndex];

    // Don't allow selecting face-down cards (except draw pile handled above)
    if (!card.up) {
      setSelectedCards(null);
      return;
    }

    if (!selectedCards) {
      // First click - select card(s)
      // For discard pile, always select only the top card (index 0)
      let cards;
      let actualIndex;
      if (pileName === "discard") {
        actualIndex = 0;
        cards = [{ suit: pile[0].suit, value: pile[0].value }];
      } else {
        actualIndex = cardIndex;
        cards = pile.slice(cardIndex).map((c) => ({ suit: c.suit, value: c.value }));
      }
      setSelectedCards({ cards, src: pileName, cardIndex: actualIndex });
    } else {
      // Second click - this is the destination
      handleMove(selectedCards.cards, selectedCards.src, pileName);
    }
  };

  const onDragStart = (ev, pileName, cardIndex) => {
    ev.stopPropagation();
    const pile = state[pileName];
    if (!pile || cardIndex >= pile.length) return;

    const card = pile[cardIndex];
    if (!card.up && pileName !== "draw") return;

    // For discard pile, always select only the top card (index 0)
    let cards;
    let actualIndex;
    if (pileName === "discard") {
      actualIndex = 0;
      cards = [{ suit: pile[0].suit, value: pile[0].value }];
    } else {
      actualIndex = cardIndex;
      cards = pile.slice(cardIndex).map((c) => ({ suit: c.suit, value: c.value }));
    }
    setSelectedCards({ cards, src: pileName, cardIndex: actualIndex });
    ev.dataTransfer.effectAllowed = "move";
    ev.dataTransfer.setData("text/plain", JSON.stringify({ cards, src: pileName }));
  };

  const onDragOver = (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
  };

  const onDrop = (ev, pileName) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (selectedCards) {
      handleMove(selectedCards.cards, selectedCards.src, pileName);
    }
  };

  // For discard pile, show only the top few cards (based on draw count)
  // Reverse the order so the most recent card (index 0) appears on top
  const visibleDiscardCards = state.discard.slice(0, Math.min(3, state.discard.length)).reverse();

  return (
    <GameBase onClick={onClick}>
      <Modal
        isOpen={modal.isOpen}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel || (() => setModal({ isOpen: false, message: "", onConfirm: null, showCancel: false }))}
        showCancel={modal.showCancel}
      />
      <ButtonContainer>
        <UndoButton onClick={handleUndo} disabled={undoStack.length === 0}>
          Undo
        </UndoButton>
        <RedoButton onClick={handleRedo} disabled={redoStack.length === 0}>
          Redo
        </RedoButton>
        <AutoCompleteButton
          onClick={(e) => {
            e.stopPropagation();
            handleAutoComplete();
          }}
          disabled={isAutoCompleting}
        >
          {isAutoCompleting ? "Auto-completing..." : "Auto Complete"}
        </AutoCompleteButton>
        <EndGameButton
          onClick={(e) => {
            e.stopPropagation();
            endGameAsLost();
          }}
        >
          End Game
        </EndGameButton>
      </ButtonContainer>
      <CardRow>
        <Pile cards={state.stack1} spacing={0} onClick={onClick} pileName="stack1" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={state.stack2} spacing={0} onClick={onClick} pileName="stack2" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={state.stack3} spacing={0} onClick={onClick} pileName="stack3" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={state.stack4} spacing={0} onClick={onClick} pileName="stack4" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <CardRowGap />
        <Pile cards={state.draw} spacing={0} onClick={onClick} pileName="draw" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={visibleDiscardCards} spacing={0} horizontal={true} onClick={onClick} pileName="discard" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
      </CardRow>
      <CardRow>
        <Pile cards={state.pile1} onClick={onClick} pileName="pile1" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={state.pile2} onClick={onClick} pileName="pile2" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={state.pile3} onClick={onClick} pileName="pile3" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={state.pile4} onClick={onClick} pileName="pile4" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={state.pile5} onClick={onClick} pileName="pile5" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={state.pile6} onClick={onClick} pileName="pile6" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
        <Pile cards={state.pile7} onClick={onClick} pileName="pile7" onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} selectedCards={selectedCards} />
      </CardRow>
    </GameBase>
  );
};
