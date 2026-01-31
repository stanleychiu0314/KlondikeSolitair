/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import React, { useEffect } from "react";
import { useNavigate } from "react-router";

export const Logout = ({ logOut }) => {
  let navigate = useNavigate();
  useEffect(() => {
    // Log out the actual user - i.e. clear user data
    logOut();
    // Go to login page
    navigate("/login");
  });
  return <></>;
};
