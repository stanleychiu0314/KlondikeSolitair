/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";
import {
  FormBase,
  FormInput,
  FormLabel,
  FormButton,
  ModalNotify,
} from "./shared.js";
import { validPassword, validUsername } from "../../shared/index.js";

const ValidationList = styled.ul`
  list-style: none;
  padding: 0.5em 0;
  margin: 0.5em 0;
`;

const ValidationItem = styled.li`
  color: ${props => props.$valid ? '#4caf50' : '#f44336'};
  padding: 0.3em 0;
  font-size: 0.9em;
  transition: color 0.2s ease;
  &:before {
    content: '${props => props.$valid ? '✓' : '✗'}';
    margin-right: 0.5em;
    font-weight: bold;
  }
`;

const FullWidthButton = styled(FormButton)`
  width: 104%;
`;

export const Register = () => {
  let navigate = useNavigate();
  let [state, setState] = useState({
    username: "",
    first_name: "",
    last_name: "",
    city: "",
    primary_email: "",
    password: "",
  });
  let [error, setError] = useState("");
  let [notify, setNotify] = useState("");
  let [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    document.getElementById("username").focus();
  }, []);

  // Check username conditions
  const checkUsernameConditions = (username) => {
    return {
      length: username.length >= 3 && username.length <= 32,
      alphanumeric: /^[a-z0-9]+$/i.test(username),
    };
  };

  // Check password conditions
  const checkPasswordConditions = (password) => {
    return {
      length: password.length >= 8,
      hasNumber: /[0-9]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasSpecial: /[@!#$%^]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
    };
  };

  const usernameConditions = checkUsernameConditions(state.username);
  const passwordConditions = checkPasswordConditions(state.password);

  const onChange = (ev) => {
    setError("");
    // Update from form and clear errors
    setState({
      ...state,
      [ev.target.name]: ev.target.value,
    });
  };

  const onFocus = (ev) => {
    setFocusedField(ev.target.name);
  };

  const onBlur = () => {
    setFocusedField("");
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();

    // Validate username
    const usernameInvalid = validUsername(state.username);
    if (usernameInvalid) {
      setError(`Error: ${usernameInvalid.error}`);
      return;
    }

    // Validate password
    const pwdInvalid = validPassword(state.password);
    if (pwdInvalid) {
      setError(`Error: ${pwdInvalid.error}`);
      return;
    }

    const res = await fetch("/v1/user", {
      method: "POST",
      body: JSON.stringify(state),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
    });
    if (res.ok) {
      // Notify users
      setNotify(`${state.username} registered.  You will now need to log in.`);
    } else {
      const err = await res.json();
      setError(err.error);
    }
  };

  const onAcceptRegister = () => {
    navigate("/login");
  };

  return (
    <div style={{ gridArea: "main", padding: "2em" }}>
      {notify !== "" ? (
        <ModalNotify
          id="notification"
          msg={notify}
          onAccept={onAcceptRegister}
        />
      ) : null}
      {error !== "" ? (
        <ModalNotify
          id="error-notification"
          msg={error}
          onAccept={() => setError("")}
        />
      ) : null}
      <h2 style={{ textAlign: "center" }}>Register</h2>
      <FormBase>
        <div>
          <FormLabel htmlFor="username">Username:</FormLabel>
          <FormInput
            id="username"
            name="username"
            placeholder="Username"
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            value={state.username}
          />
          {focusedField === "username" && (
            <ValidationList>
              <ValidationItem $valid={usernameConditions.length}>
                Length must be between 3 and 32 characters
              </ValidationItem>
              <ValidationItem $valid={usernameConditions.alphanumeric}>
                Must contain only letters and/or numbers (no special characters)
              </ValidationItem>
            </ValidationList>
          )}
        </div>

        <div>
          <FormLabel htmlFor="first_name">First Name:</FormLabel>
          <FormInput
            id="first_name"
            name="first_name"
            placeholder="First Name"
            onChange={onChange}
            value={state.first_name}
          />
        </div>

        <div>
          <FormLabel htmlFor="last_name">Last Name:</FormLabel>
          <FormInput
            id="last_name"
            name="last_name"
            placeholder="Last Name"
            onChange={onChange}
            value={state.last_name}
          />
        </div>

        <div>
          <FormLabel htmlFor="city">City:</FormLabel>
          <FormInput
            id="city"
            name="city"
            placeholder="City"
            onChange={onChange}
            value={state.city}
          />
        </div>

        <div>
          <FormLabel htmlFor="primary_email">Email:</FormLabel>
          <FormInput
            id="primary_email"
            name="primary_email"
            type="email"
            placeholder="Email Address"
            onChange={onChange}
            value={state.primary_email}
          />
        </div>

        <div>
          <FormLabel htmlFor="password">Password:</FormLabel>
          <FormInput
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            value={state.password}
          />
          {focusedField === "password" && (
            <ValidationList>
              <ValidationItem $valid={passwordConditions.length}>
                Must be at least 8 characters long
              </ValidationItem>
              <ValidationItem $valid={passwordConditions.hasNumber}>
                Must contain at least one number
              </ValidationItem>
              <ValidationItem $valid={passwordConditions.hasLowercase}>
                Must contain at least one lowercase letter
              </ValidationItem>
              <ValidationItem $valid={passwordConditions.hasUppercase}>
                Must contain at least one uppercase letter
              </ValidationItem>
              <ValidationItem $valid={passwordConditions.hasSpecial}>
                Must contain at least one special character (@, !, #, $, %, ^)
              </ValidationItem>
            </ValidationList>
          )}
        </div>

        <FullWidthButton id="submitBtn" onClick={onSubmit}>
          Register
        </FullWidthButton>
      </FormBase>
    </div>
  );
};
