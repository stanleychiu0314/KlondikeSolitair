/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import userRoutes from "./v1/user.js";
import authRoutes from "./v1/session.js";
import gameRoutes from "./v1/game.js";
import githubRoutes from "./v1/github.js";

export default (app) => {
  userRoutes(app);
  authRoutes(app);
  gameRoutes(app);
  githubRoutes(app);
};
