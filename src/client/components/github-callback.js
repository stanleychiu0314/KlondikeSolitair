/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";

const Container = styled.div`
  grid-area: main;
  padding: 2em;
  text-align: center;
`;

export const GitHubCallback = ({ logIn }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGitHubCallback = async () => {
      try {
        // Fetch the current session to see who's logged in
        const response = await fetch("/v1/session/current", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          // Use the logIn helper to store user in localStorage
          await logIn(data.username);
          // Redirect to their profile
          navigate(`/profile/${data.username}`);
        } else {
          // If no session, redirect to register with error
          navigate("/register?error=github_auth_failed");
        }
      } catch (err) {
        console.error("GitHub callback error:", err);
        navigate("/register?error=github_auth_failed");
      }
    };

    handleGitHubCallback();
  }, [logIn, navigate]);

  return <Container>Completing GitHub sign in...</Container>;
};
