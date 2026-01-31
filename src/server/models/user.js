/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import crypto from "node:crypto";
import mongoose from "mongoose";
const Schema = mongoose.Schema;

/***************** User Model *******************/

const makeSalt = () => Math.round(new Date().valueOf() * Math.random()) + "";

const encryptPassword = (salt, password) =>
  crypto.createHmac("sha512", salt).update(password).digest("hex");

const reservedNames = ["password"];

const User = new Schema({
  username: { type: String, required: true, index: { unique: true } },
  primary_email: { type: String, required: true, index: { unique: true } },
  first_name: { type: String, default: "" },
  last_name: { type: String, default: "" },
  city: { type: String, default: "" },
  hash: { type: String, required: true },
  salt: { type: String, required: true },
  games: [{ type: Schema.Types.ObjectId, ref: "Game" }],
  githubId: { type: String, index: { unique: true, sparse: true } },
  authProvider: { type: String, default: "local" },
});

User.path("username").validate(function (value) {
  if (!value) return false;
  if (reservedNames.indexOf(value) !== -1) return false;
  return (
    value.length >= 3 && value.length <= 32 && /^[a-zA-Z0-9]+$/i.test(value)
  );
}, "invalid username");

User.path("primary_email").validate(function (value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}, "malformed address");

User.virtual("password").set(function (password) {
  this.salt = makeSalt();
  this.hash = encryptPassword(this.salt, password);
});

User.method("authenticate", function (plainText) {
  return encryptPassword(this.salt, plainText) === this.hash;
});

User.pre("save", function (next) {
  // Sanitize strings
  this.username = this.username.toLowerCase();
  this.primary_email = this.primary_email.toLowerCase();
  this.first_name = this.first_name.replace(/<(?:.|\n)*?>/gm, "");
  this.last_name = this.last_name.replace(/<(?:.|\n)*?>/gm, "");
  this.city = this.city.replace(/<(?:.|\n)*?>/gm, "");
  next();
});

export default mongoose.model("User", User);
