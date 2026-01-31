/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import request from "superagent";
import mongoose from "mongoose";
let Models = {};

const defaultCollections = [
  { name: "users", path: "../../src/server/models/user.js" },
  { name: "games", path: "../../src/server/models/game.js" },
  { name: "moves", path: "../../src/server/models/move.js" },
];

export const setup = async (mongoURL) => {
  let collections = defaultCollections;
  // In our tests we use the test db
  try {
    await mongoose.connect(mongoURL);
    // Setup all the models
    for await (const collection of collections) {
      Models[collection.name] = await import(collection.path);
    }
    if (collections !== []) {
      await cleanup(collections);
    }
  } catch (err) {
    console.log(`Mongo connection error: ${err}`);
  }
};

export const cleanup = async (collections) => {
  const db = mongoose.connection.db;
  for await (const collection of collections) {
    try {
      await db.dropCollection(collection.name);
      console.log(`    Collection ${collection.name} dropped.`);
    } catch (ex) {
      console.log("Cleanup error on: " + collection.name);
      console.log(ex);
    }
  }
};

export const shutdown = async () => {
  // No need to drop anything here
  let collections = []; //defaultCollections;
  await cleanup(collections);
  await mongoose.connection.close();
};

export const login = async (url, agent, user) => {
  // Ok, now login with user
  const res = await agent
    .post(`${url}session`)
    .send({ username: user.username, password: user.password });
  res.status.should.equal(200);
  res.body.username.should.equal(user.username);
  res.body.primary_email.should.equal(user.primary_email);
};

export const logout = async (url, agent) => {
  const res = await agent.del(`${url}session`);
  res.status.should.equal(204);
};

export const createUser = async (url, user) => {
  // Create a user for general context of the tests
  const res = await request.post(`${url}user`).send(user);
  res.status.should.equal(201);
};
