/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import { describe, it, before, after } from 'node:test';
import should from "should";
import request from "superagent";
import { setup, shutdown, createUser, login, logout } from "./harness.js";
import envConfig from "simple-env-config";
import data from "./data.json" with { type: "json" };

let config = {};
let users = data.users;
let games = data.games;
const env = process.env.NODE_ENV ? process.env.NODE_ENV : "test";

describe("Game:", () => {
  let primaryAgent = request.agent();
  let anonAgent = request.agent();
  before(async () => {
    config = await envConfig("./config/config.json", env);
    config.url = `${config.url}:${config.port}${config.api_version}/`;
    await setup(config.mongodb);
    // Create a user for game testing
    await createUser(config.url, users.primary);
    // Log in the user with primaryAgent
    await login(config.url, primaryAgent, users.primary);
  });
  after(async () => {
    // Log out the primary agent
    await logout(config.url, primaryAgent);
    await shutdown();
  });

  describe("Start New Game:", () => {
    it("Failure - missing game", async () => {
      try {
        await primaryAgent.post(`${config.url}game`).send({
          color: "red",
          draw: "Draw 1",
        });
      } catch ({ response }) {
        response.status.should.equal(400);
        response.body.error.should.equal(`"game" is required`);
      }
    });
    it("Failure - missing color", async () => {
      try {
        await primaryAgent.post(`${config.url}game`).send({
          game: "klondike",
          draw: "Draw 1",
        });
      } catch ({ response }) {
        response.status.should.equal(400);
        response.body.error.should.equal(`"color" is required`);
      }
    });
    it("Failure - unknown game", async () => {
      try {
        await primaryAgent.post(`${config.url}game`).send({
          game: "blarg",
          color: "red",
          draw: "Draw 1",
        });
      } catch ({ response }) {
        response.status.should.equal(400);
        response.body.error.should.equal(`failure creating game`);
      }
    });
    it("Failure - must be logged in", async () => {
      try {
        await anonAgent.post(`${config.url}game`).send(games.primary);
      } catch ({ response }) {
        response.status.should.equal(401);
        response.body.error.should.equal(`unauthorized`);
      }
    });
    it("Success - create new game", async () => {
      const res = await primaryAgent
        .post(`${config.url}game`)
        .send(games.primary);
      res.status.should.equal(201);
      res.body.should.have.property("id");
      games.primary.id = res.body.id;
    });
  });

  describe("Fetch Game Info:", () => {
    it("Failure - unknown game", async () => {
      try {
        await primaryAgent.get(`${config.url}game/blargblarg`);
      } catch ({ response }) {
        response.status.should.equal(404);
        response.body.error.should.equal(`unknown game: blargblarg`);
      }
    });
    it("Success - Fetch known game", async () => {
      const res = await primaryAgent.get(
        `${config.url}game/${games.primary.id}`,
      );
      res.status.should.equal(200);
      res.body.id.should.equal(games.primary.id);
    });
  });
});
