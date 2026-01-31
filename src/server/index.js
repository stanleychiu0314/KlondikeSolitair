/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import path from "node:path";
import express from "express";
import bodyParser from "body-parser";
import logger from "morgan";
import session from "express-session";
import mongoose from "mongoose";
import Pug from "pug";
import envConfig from "simple-env-config";

import routes from "./api/index.js";
import Game from "./models/game.js";
import Move from "./models/move.js";
import User from "./models/user.js";
import url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const env = process.env.NODE_ENV ? process.env.NODE_ENV : "dev";

const setupServer = async () => {
  // Get the app config
  const conf = await envConfig("./config/config.json", env);
  const port = process.env.PORT ? process.env.PORT : conf.port;

  // Setup our Express pipeline
  let app = express();
  app.use(logger("dev"));
  app.use(express.static(path.join(__dirname, "../../public")));
  // Setup pipeline session support
  app.store = session({
    name: "session",
    secret: "grahamcardrules",
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: "/",
    },
  });
  app.use(app.store);
  // Finish with the body parser
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  try {
    // Connect to MongoDB
    await mongoose.connect(conf.mongodb);
    mongoose.connection.on("disconnected", () => {
      console.log(`MongoDB shutting down`);
    });
    console.log(`MongoDB connected: ${conf.mongodb}`);
  } catch (err) {
    console.log(err);
    process.exit(-1);
  }

  // Import our Data Models
  app.models = {
    Game,
    Move,
    User,
  };

  // Import our routes
  routes(app);

  // No matter what the client asks for, serve the SPA base HTML
  const indexFile = path.resolve(__dirname, "../../public/index.html");
  app.get("/*path", (req, res) => {
    res.sendFile(indexFile);
  });

  // Run the server itself
  let server;
  server = app.listen(port, () => {
    console.log(`Assignment 4 ${env} listening on: ${server.address().port}`);
  });
};

/**********************************************************************************************************/

// Run the server
setupServer().then();
