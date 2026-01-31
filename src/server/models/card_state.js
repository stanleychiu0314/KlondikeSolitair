/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import mongoose from "mongoose";
const Schema = mongoose.Schema;

/***************** CardState Model *******************/

/* Schema for individual card state within Klondyke */
const CardState = new Schema(
  {
    suit: {
      type: String,
      required: true,
      enum: ["hearts", "spades", "diamonds", "clubs"],
    },
    value: {
      type: String,
      required: true,
      enum: ["ace", 2, 3, 4, 5, 6, 7, 8, 9, 10, "jack", "queen", "king"],
    },
    up: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

export default CardState;
