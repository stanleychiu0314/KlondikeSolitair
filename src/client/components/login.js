/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";
import {
  FormBase,
  FormLabel,
  FormInput,
  FormButton,
  ModalNotify,
} from "./shared.js";

const FullWidthButton = styled(FormButton)`
  width: 104%;
`;

const GitHubButton = styled(FormButton)`
  width: 104%;
  background-color: #24292e;
  color: white;
  margin-top: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;

  &:hover {
    background-color: #2f363d;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5em 0;
  color: #666;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #ccc;
  }

  &::before {
    margin-right: 0.75em;
  }

  &::after {
    margin-left: 0.75em;
  }
`;

export const Login = (props) => {
  let navigate = useNavigate();
  let [username, setUser] = useState("");
  let [password, setPass] = useState("");
  let [error, setError] = useState("");

  const onSubmit = async (ev) => {
    ev.preventDefault();
    let res = await fetch("/v1/session", {
      body: JSON.stringify({
        username,
        password,
      }),
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
    });
    const data = await res.json();
    if (res.ok) {
      props.logIn(data.username);
      navigate(`/profile/${data.username}`);
    } else {
      // Display user-friendly error message
      setError("Wrong username or password. Please try again.");
    }
  };

  useEffect(() => {
    document.getElementById("username").focus();
  }, []);

  const onGitHubLogin = () => {
    window.location.href = "/v1/auth/github";
  };

  return (
    <div style={{ gridArea: "main", padding: "2em" }}>
      {error !== "" ? (
        <ModalNotify
          id="error-notification"
          msg={error}
          onAccept={() => setError("")}
        />
      ) : null}
      <h2 style={{ textAlign: "center" }}>Login</h2>
      <FormBase>
        <div>
          <FormLabel htmlFor="username">Username:</FormLabel>
          <FormInput
            id="username"
            name="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(ev) => setUser(ev.target.value.toLowerCase())}
          />
        </div>

        <div>
          <FormLabel htmlFor="password">Password:</FormLabel>
          <FormInput
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(ev) => setPass(ev.target.value)}
          />
        </div>

        <FullWidthButton id="submitBtn" onClick={onSubmit}>
          Login
        </FullWidthButton>

        <Divider>or</Divider>

        <GitHubButton type="button" onClick={onGitHubLogin}>
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Login with GitHub
        </GitHubButton>
      </FormBase>
    </div>
  );
};
