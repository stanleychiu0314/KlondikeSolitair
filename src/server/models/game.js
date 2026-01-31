/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import mongoose from "mongoose";
const Schema = mongoose.Schema;
import CardState from "./card_state.js";

/***************** Game Model *******************/

/* Schema for overall solitaire game state */
const KlondykeGameState = new Schema(
  {
    pile1: { type: [CardState] },
    pile2: { type: [CardState] },
    pile3: { type: [CardState] },
    pile4: { type: [CardState] },
    pile5: { type: [CardState] },
    pile6: { type: [CardState] },
    pile7: { type: [CardState] },
    stack1: { type: [CardState] },
    stack2: { type: [CardState] },
    stack3: { type: [CardState] },
    stack4: { type: [CardState] },
    discard: { type: [CardState] },
    draw: { type: [CardState] },
  },
  { _id: false },
);

/* Schema for the overall game - not completely Klondyke specific */
const Game = new Schema({
  owner: { type: Schema.ObjectId, ref: "User", required: true },
  start: { type: Date },
  end: { type: Date },
  state: { type: KlondykeGameState },
  initialState: { type: KlondykeGameState },
  game: {
    type: String,
    required: true,
    enum: ["klondike", "pyramid", "canfield", "golf", "yukon", "hearts"],
  },
  active: { type: Boolean, default: true },
  color: { type: String, default: "red" },
  drawCount: { type: Number, default: 1 },
  score: { type: Number, default: 0 },
  won: { type: Boolean, default: false },
  moves: { type: Number, default: 0 },
});

Game.pre("validate", function (next) {
  this.start = Date.now();
  next();
});

export default mongoose.model("Game", Game);
