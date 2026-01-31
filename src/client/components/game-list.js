/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { Fragment } from "react";
import { NavLink } from "react-router";
import styled from "styled-components";

const Game = ({ game }) => {
  const date = new Date(game.start);
  const url = `/${game.active ? "game" : "staus"}/${game.id}`;
  return (
    <tr>
      <td>
        <NavLink to={url}>{game.active ? "Active" : "Complete"}</NavLink>
      </td>
      <td>{date.toLocaleString()}</td>
      <td>{game.moves}</td>
      <td>{game.score}</td>
      <td>{game.game}</td>
    </tr>
  );
};

const GameHeaderBase = styled.div`
  display: flex;
  margin: 1em;
  & > a {
    margin-right: 1em;
  }
  & > h4 {
    margin: 0;
    flex-grow: 1;
  }
`;

const GameHeader = ({ count, toCreateGame }) => {
  return (
    <GameHeaderBase>
      <h4>
        Games ({count}
        ):
      </h4>
      {toCreateGame ? (
        <NavLink id="startLink" style={{ marginBottom: "1em" }} to="/start">
          Start new game
        </NavLink>
      ) : null}
    </GameHeaderBase>
  );
};

const GameTable = styled.table`
  width: 100%;
  text-align: center;
  @media (max-width: 499px) {
    & > tbody > tr > td:nth-of-type(2),
    & > thead > tr > th:nth-of-type(2) {
      display: none;
    }
  }
`;

export const GameList = ({ games, toCreateGame }) => {
  // Build array of games
  let gameList = games.map((game, index) => <Game key={index} game={game} />);
  return (
    <Fragment>
      <GameHeader count={games.length} toCreateGame={toCreateGame} />
      <GameTable>
        <thead>
          <tr>
            <th>Status</th>
            <th>Start Date</th>
            <th># of Moves</th>
            <th>Score</th>
            <th>Game Type</th>
          </tr>
        </thead>
        <tbody>{gameList}</tbody>
      </GameTable>
    </Fragment>
  );
};
