/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React from "react";
import styled from "styled-components";

const CardImg = styled.img`
  position: absolute;
  height: auto;
  width: 100%;
  border: ${props => props.highlighted ? '3px solid #FFD700' : 'none'};
  box-shadow: ${props => props.highlighted ? '0 0 10px #FFD700' : 'none'};
  border-radius: 5px;
`;

export const Card = ({ card, top, left, onClick, onDragStart, cardIndex, pileName, highlighted }) => {
  const source = card.up
    ? `/images/${card.value}_of_${card.suit}.png`
    : "/images/face_down.jpg";
  const style = { left: `${left}%`, top: `${top}%` };
  const id = `${card.suit}:${card.value}`;

  const handleDragStart = (ev) => {
    if (onDragStart && card.up) {
      onDragStart(ev, pileName, cardIndex);
    }
  };

  return (
    <CardImg
      id={id}
      onClick={onClick}
      style={style}
      src={source}
      draggable={card.up}
      onDragStart={handleDragStart}
      highlighted={highlighted}
    />
  );
};

const PileBase = styled.div`
  margin: 5px;
  position: relative;
  display: inline-block;
  border: dashed 1.5px #000;
  border-radius: 5px;
  width: 12%;
`;

const PileFrame = styled.div`
  margin-top: 145%;
`;

export const Pile = ({
  cards = [],
  spacing = 8,
  horizontal = false,
  up,
  onClick,
  pileName,
  onDragStart,
  onDragOver,
  onDrop,
  selectedCards,
}) => {
  const children = cards.map((card, i) => {
    const top = horizontal ? 0 : i * spacing;
    const left = horizontal ? i * spacing : 0;

    // Determine if this card should be highlighted
    let highlighted = false;
    if (selectedCards && selectedCards.src === pileName) {
      // For discard pile, only highlight if this is index 0
      if (pileName === "discard") {
        highlighted = i === 0;
      } else {
        // For other piles, highlight if card index >= selected card index
        highlighted = i >= selectedCards.cardIndex;
      }
    }

    return (
      <Card
        key={i}
        card={card}
        up={up}
        top={top}
        left={left}
        onClick={onClick}
        onDragStart={onDragStart}
        cardIndex={i}
        pileName={pileName}
        highlighted={highlighted}
      />
    );
  });

  const handleDrop = (ev) => {
    if (onDrop) {
      onDrop(ev, pileName);
    }
  };

  return (
    <PileBase
      data-pile={pileName}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={handleDrop}
    >
      <PileFrame />
      {children}
    </PileBase>
  );
};
