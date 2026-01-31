/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import { NavLink, useParams } from "react-router";
import styled from "styled-components";
import { GravHash } from "./header.js";

const ProfileContainer = styled.div`
  grid-area: main;
  padding: 2em;
  max-width: 800px;
  margin: 0 auto;
`;

const ProfileHeader = styled.div`
  display: flex;
  gap: 2em;
  margin-bottom: 2em;
  align-items: flex-start;
`;

const Avatar = styled.img`
  width: 200px;
  align-self: stretch;
  border-radius: 4px;
  object-fit: cover;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ActionButton = styled(NavLink)`
  padding: 0.5em 1em;
  background-color: ${(props) => (props.$primary ? "#0066cc" : "#666")};
  color: white;
  text-decoration: none;
  margin-right: 1em;
  display: inline-block;
  border-radius: 3px;
  &:hover {
    background-color: ${(props) => (props.$primary ? "#0052a3" : "#555")};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  padding: 0.5em;
  border: 1px solid #ddd;
  text-align: left;
`;

const TableCell = styled.td`
  padding: 0.5em;
  border: 1px solid #ddd;
`;

const TableRow = styled.tr`
  background-color: ${(props) => (props.$header ? "#f0f0f0" : "transparent")};
  &:hover {
    background-color: ${(props) => (props.$header ? "#f0f0f0" : "#f9f9f9")};
  }
`;

const GameRow = ({ game }) => {
  const status = game.active ? "Active" : "Complete";
  const startDate = new Date(game.start).toLocaleDateString();
  const link = game.active ? `/game/${game.id}` : `/results/${game.id}`;

  return (
    <TableRow>
      <TableCell>
        <NavLink to={link}>{status}</NavLink>
      </TableCell>
      <TableCell>{startDate}</TableCell>
      <TableCell>{game.moves || 0}</TableCell>
      <TableCell>{game.game}</TableCell>
    </TableRow>
  );
};

export const Profile = (props) => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/v1/user/${username}`);
        const data = await response.json();

        if (response.ok) {
          setUserData(data);
        } else {
          setError(data.error || "Failed to load user");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      }
    };

    fetchUser();
  }, [username]);

  if (error) {
    return <ProfileContainer>Error: {error}</ProfileContainer>;
  }

  if (!userData) {
    return <ProfileContainer>Loading...</ProfileContainer>;
  }

  const isOwnProfile = userData.username === props.currentUser;
  const gravatarUrl = GravHash(userData.primary_email, 200);

  return (
    <ProfileContainer>
      <ProfileHeader>
        <Avatar src={gravatarUrl} alt="Gravatar" />
        <ProfileInfo>
          <h2>{userData.username}</h2>
          <p>
            <strong>Name:</strong> {userData.first_name} {userData.last_name}
          </p>
          <p>
            <strong>City:</strong> {userData.city}
          </p>
          <p>
            <strong>Email:</strong> {userData.primary_email}
          </p>
          <p>
            <strong>Games Played:</strong> {userData.games.length}
          </p>
          {isOwnProfile && (
            <div style={{ marginTop: "1em" }}>
              <ActionButton to="/start" $primary>
                Start New Game
              </ActionButton>
              <ActionButton to={`/profile/${userData.username}/edit`}>
                Edit Profile
              </ActionButton>
            </div>
          )}
        </ProfileInfo>
      </ProfileHeader>

      <h3>Games</h3>
      {userData.games.length === 0 ? (
        <p>No games played yet.</p>
      ) : (
        <Table>
          <thead>
            <TableRow $header>
              <TableHeader>Status</TableHeader>
              <TableHeader>Start Date</TableHeader>
              <TableHeader>Moves</TableHeader>
              <TableHeader>Game Type</TableHeader>
            </TableRow>
          </thead>
          <tbody>
            {userData.games.map((game, index) => (
              <GameRow key={index} game={game} />
            ))}
          </tbody>
        </Table>
      )}
    </ProfileContainer>
  );
};
