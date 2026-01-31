/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import styled from "styled-components";

import { ErrorMessage, InfoBlock, InfoData, InfoLabels } from "./shared.js";

const MoveRow = styled.tr`
  cursor: pointer;
  &:hover {
    background-color: #f0f0f0;
  }
  &.selected {
    background-color: #e0e0ff;
  }
`;

const Move = ({ move, index, onMoveClick, isSelected }) => {
  if (!move) {
    return (
      <MoveRow>
        <td>{index + 1}</td>
        <td>Invalid move</td>
      </MoveRow>
    );
  }

  // Format pile names for display
  const formatPileName = (pile) => {
    if (!pile || typeof pile !== 'string') return "Unknown";
    if (pile === "draw") return "Draw";
    if (pile === "discard") return "Discard";
    if (pile.startsWith("stack")) return `Foundation ${pile.charAt(5)}`;
    if (pile.startsWith("pile")) return `Pile ${pile.charAt(4)}`;
    return pile;
  };

  // Format move details
  const formatCards = (cards) => {
    if (!cards || !Array.isArray(cards) || cards.length === 0) return "Unknown cards";
    return cards
      .map((card) => card ? `${card.value || '?'} of ${card.suit || '?'}` : 'unknown card')
      .join(", ");
  };

  const moveDetail = `${formatCards(move.cards)} from ${formatPileName(move.src)} to ${formatPileName(move.dst)}`;

  return (
    <MoveRow
      onClick={() => onMoveClick(index)}
      className={isSelected ? "selected" : ""}
    >
      <td>{index + 1}</td>
      <td>{moveDetail}</td>
    </MoveRow>
  );
};

const MovesListTable = styled.table`
  margin: 1em auto;
  max-width: 600px;
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;

  th {
    background-color: #f5f5f5;
    padding: 12px;
    text-align: left;
    border-bottom: 2px solid #ddd;
    font-weight: 600;
  }

  th:first-child {
    width: 80px;
    text-align: center;
  }

  th:last-child {
    width: auto;
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid #eee;
    word-wrap: break-word;
    white-space: normal;
  }

  td:first-child {
    text-align: center;
    font-weight: 500;
    color: #666;
    width: 80px;
  }

  td:last-child {
    max-width: 500px;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const MovesList = ({ moves, onMoveClick, selectedMoveIndex }) => {
  let moveElements = moves.map((move, index) => (
    <Move
      key={index}
      move={move}
      index={index}
      onMoveClick={onMoveClick}
      isSelected={selectedMoveIndex === index}
    />
  ));
  return (
    <MovesListTable>
      <thead>
        <tr>
          <th>Move #</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>{moveElements}</tbody>
    </MovesListTable>
  );
};

const GameDetail = ({ moves, cards_remaining, active, won }) => {
  const getStatus = () => {
    if (active) return "Active";
    return won ? "Complete" : "Cannot Finish";
  };

  return (
    <InfoBlock>
      <InfoLabels>
        <p>Number of Moves:</p>
        <p>Cards Remaining:</p>
        <p>Status:</p>
      </InfoLabels>
      <InfoData>
        <p>{moves ? moves.length : 0}</p>
        <p>{cards_remaining || 0}</p>
        <p>{getStatus()}</p>
      </InfoData>
    </InfoBlock>
  );
};

const ResultsBase = styled.div`
  grid-area: main;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1em;
`;


export const Results = () => {
  const { id } = useParams();
  let [game, setGame] = useState({
    start: 0,
    score: 0,
    cards_remaining: 0,
    active: true,
    moves: [],
  });
  let [error, setError] = useState("");

  // Fetch game data on load
  useEffect(() => {
    fetch(`/v1/game/${id}?moves=`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Results data received:", data);
        // Ensure moves is an array
        if (typeof data.moves === "number") data.moves = [];
        if (!Array.isArray(data.moves)) data.moves = [];

        // Convert start and end to numbers if they're strings
        if (data.start) data.start = typeof data.start === 'string' ? Date.parse(data.start) : data.start;
        if (data.end) data.end = typeof data.end === 'string' ? Date.parse(data.end) : data.end;

        console.log("Processed game data:", data);
        console.log("Moves count:", data.moves.length);
        setGame(data);
      })
      .catch((err) => {
        console.log(err);
        setError(err.message || "Error loading game");
      });
  }, [id]);

  return (
    <ResultsBase>
      <ErrorMessage msg={error} hide={true} />
      <h4>Game Detail</h4>
      <GameDetail {...game} />
      <MovesList
        moves={game.moves}
        onMoveClick={() => {}}
        selectedMoveIndex={null}
      />
    </ResultsBase>
  );
};

export default Results;
