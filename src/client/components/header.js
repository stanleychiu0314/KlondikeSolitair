/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { Fragment } from "react";
import styled from "styled-components";
import { NavLink } from "react-router";
import md5 from "md5";

/**
 * @return {string}
 */
export function GravHash(email, size) {
  let hash = email && email.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
  hash = hash && hash.toLowerCase();
  hash = hash && md5(hash);
  return `https://www.gravatar.com/avatar/${hash}?size=${size}`;
}

const fontColor = "#333";

const HeaderLeftBase = styled.div`
  flex-grow: 1;
  & > h2 {
    color: ${fontColor};
    margin: 0;
    font-size: 1.5em;
    font-weight: bold;
  }
  & > a {
    text-decoration: none;
    & > h2 {
      color: ${fontColor};
      margin: 0;
      font-size: 1.5em;
      font-weight: bold;
    }
  }
`;

const HeaderLeft = ({ user }) => {
  return (
    <HeaderLeftBase>
      {user !== "" ? (
        <NavLink to={`/profile/${user}`}>
          <h2>Solitaire Game</h2>
        </NavLink>
      ) : (
        <h2>Solitaire Game</h2>
      )}
    </HeaderLeftBase>
  );
};

const HeaderRightBase = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  & > a {
    color: ${fontColor};
    text-decoration: none;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
`;

const HeaderRight = ({ user, email }) => {
  const isLoggedIn = user !== "";
  return (
    <HeaderRightBase>
      {isLoggedIn ? (
        <Fragment>
          <NavLink to={`/profile/${user}`}>
            <Avatar src={GravHash(email, 40)} alt="User Avatar" />
          </NavLink>
          <NavLink to="/logout">Log Out</NavLink>
        </Fragment>
      ) : (
        <Fragment>
          <NavLink id="loginLink" to="/login">
            Log In
          </NavLink>
          <NavLink id="regLink" to="/register">
            Register
          </NavLink>
        </Fragment>
      )}
    </HeaderRightBase>
  );
};

const HeaderBase = styled.div`
  grid-area: hd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f0f0f0;
  border-bottom: 2px solid #ccc;
  padding: 1em 2em;
`;

export const Header = ({ user = "", email = "" }) => (
  <HeaderBase>
    <HeaderLeft user={user} />
    <HeaderRight user={user} email={email} />
  </HeaderBase>
);
