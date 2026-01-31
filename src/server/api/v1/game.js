/* Copyright G. Hemingway, @2025 - All rights reserved */
"use strict";

import Joi from "joi";
import {
  initialState,
  shuffleCards,
  filterGameForProfile,
  filterMoveForResults,
  validateMove,
} from "../../solitare.js";

export default (app) => {
  /**
   * Create a new game
   *
   * @param {req.body.game} Type of game to be played
   * @param {req.body.color} Color of cards
   * @param {req.body.draw} Number of cards to draw
   * @return {201 with { id: ID of new game }}
   */
  app.post("/v1/game", async (req, res) => {
    if (!req.session.user)
      return res.status(401).send({ error: "unauthorized" });

    // Schema for user info validation
    const schema = Joi.object({
      game: Joi.string().lowercase().required(),
      color: Joi.string().lowercase().required(),
      draw: Joi.any(),
    });
    // Validate user input
    try {
      const data = await schema.validateAsync(req.body, { stripUnknown: true });
      // Set up the new game
      let newGame = {
        owner: req.session.user._id,
        active: true,
        cards_remaining: 52,
        color: data.color,
        game: data.game,
        score: 0,
        start: Date.now(),
        winner: "",
        state: [],
      };
      switch (data.draw) {
        case "Draw 1":
          newGame.drawCount = 1;
          break;
        case "Draw 3":
          newGame.drawCount = 3;
          break;
        default:
          newGame.drawCount = 1;
      }
      console.log(newGame);
      // Generate a new initial game state
      const startState = initialState();
      newGame.state = startState;
      newGame.initialState = JSON.parse(JSON.stringify(startState)); // Deep copy
      let game = new app.models.Game(newGame);
      try {
        await game.save();
        const query = { $push: { games: game._id } };
        // Save game to user's document too
        await app.models.User.findByIdAndUpdate(req.session.user._id, query);
        res.status(201).send({ id: game._id });
      } catch (err) {
        console.log(`Game.create save failure: ${err}`);
        res.status(400).send({ error: "failure creating game" });
        // TODO: Much more error management needs to happen here
      }
    } catch (err) {
      console.log(err);
      const message = err.details[0].message;
      console.log(`Game.create validation failure: ${message}`);
      res.status(400).send({ error: message });
    }
  });

  /**
   * Fetch game information
   *
   * @param {req.params.id} Id of game to fetch
   * @return {200} Game information
   */
  app.get("/v1/game/:id", async (req, res) => {
    try {
      let game = await app.models.Game.findById(req.params.id);
      if (!game) {
        res.status(404).send({ error: `unknown game: ${req.params.id}` });
      } else {
        const state = game.state.toJSON();
        let results = filterGameForProfile(game);
        results.start = Date.parse(results.start);
        results.cards_remaining =
          52 -
          (state.stack1.length +
            state.stack2.length +
            state.stack3.length +
            state.stack4.length);
        // Do we need to grab the moves
        if (req.query.moves === "") {
          console.log(`Fetching moves for game: ${req.params.id}`);
          const moves = await app.models.Move.find({ game: req.params.id })
            .populate("user", "username")
            .exec();
          console.log(`Found ${moves.length} moves`);
          state.moves = moves.map((move) => {
            const filtered = filterMoveForResults(move);
            return {
              ...filtered,
              player: move.user ? move.user.username : "Unknown",
            };
          });
          console.log(`Processed ${state.moves.length} moves for response`);
        }
        res.status(200).send(Object.assign({}, results, state));
      }
    } catch (err) {
      console.log(`Game.get failure: ${err}`);
      res.status(404).send({ error: `unknown game: ${req.params.id}` });
    }
  });

  /**
   * Update game state with a move
   *
   * @param {req.params.id} Id of game to update
   * @param {req.body.cards} Cards being moved
   * @param {req.body.src} Source pile
   * @param {req.body.dst} Destination pile
   * @return {200} Updated game state or error
   */
  app.put("/v1/game/:id", async (req, res) => {
    // Validate user is logged in
    if (!req.session.user) {
      return res.status(401).send({ error: "unauthorized" });
    }

    // Schema for move validation
    const cardSchema = Joi.object({
      suit: Joi.string().valid("hearts", "diamonds", "clubs", "spades").required(),
      value: Joi.alternatives().try(
        Joi.number().min(2).max(10),
        Joi.string().valid("ace", "jack", "queen", "king")
      ).required(),
    });

    const schema = Joi.object({
      cards: Joi.array().items(cardSchema).min(1).required(),
      src: Joi.string().required(),
      dst: Joi.string().required(),
    });

    try {
      // Validate move data
      const moveData = await schema.validateAsync(req.body, { stripUnknown: true });

      // Find the game
      const game = await app.models.Game.findById(req.params.id);
      if (!game) {
        return res.status(404).send({ error: "Game not found" });
      }

      // Verify user owns the game
      if (game.owner.toString() !== req.session.user._id.toString()) {
        return res.status(403).send({ error: "Not authorized to modify this game" });
      }

      // Validate the move
      const result = await validateMove(game.state.toJSON(), moveData);

      if (result.error) {
        return res.status(400).send({ error: result.error });
      }

      // Update game state
      game.state = result;
      game.moves = (game.moves || 0) + 1;

      // Save the updated game
      await game.save();

      // Create and save the move record
      const move = new app.models.Move({
        user: req.session.user._id,
        game: game._id,
        cards: moveData.cards,
        src: moveData.src,
        dst: moveData.dst,
        date: Date.now(),
      });

      try {
        await move.save();
        console.log(`Move saved successfully: ${move._id}`);
      } catch (err) {
        console.log(`Move save failed: ${err}`);
        console.error(err);
        // Continue even if move save fails
      }

      // Return the new game state
      const state = game.state.toJSON();
      let gameResult = filterGameForProfile(game);
      gameResult.start = Date.parse(gameResult.start);
      gameResult.cards_remaining =
        52 -
        (state.stack1.length +
          state.stack2.length +
          state.stack3.length +
          state.stack4.length);

      res.status(200).send(Object.assign({}, gameResult, state));
    } catch (err) {
      if (err.isJoi) {
        console.log(`Game move validation failure: ${err.details[0].message}`);
        return res.status(400).send({ error: err.details[0].message });
      }
      console.log(`Game move failure: ${err}`);
      res.status(500).send({ error: "Internal server error" });
    }
  });

  /**
   * End a game
   *
   * @param {req.params.id} Id of game to end
   * @param {req.body.won} Whether the player won
   * @return {200} Success
   */
  app.put("/v1/game/:id/end", async (req, res) => {
    console.log(`End game request received for game ${req.params.id}`);
    console.log(`Session user:`, req.session.user ? req.session.user._id : 'none');

    if (!req.session.user) {
      console.log("Unauthorized: No session user");
      return res.status(401).send({ error: "unauthorized" });
    }

    try {
      const game = await app.models.Game.findById(req.params.id);
      if (!game) {
        console.log(`Game not found: ${req.params.id}`);
        return res.status(404).send({ error: "Game not found" });
      }

      console.log(`Game owner: ${game.owner}, Session user: ${req.session.user._id}`);

      // Verify user owns the game
      if (game.owner.toString() !== req.session.user._id.toString()) {
        console.log("Forbidden: User does not own this game");
        return res.status(403).send({ error: "Not authorized to modify this game" });
      }

      // Update game
      game.active = false;
      game.end = Date.now();
      game.won = req.body.won || false;

      console.log(`Ending game - active: ${game.active}, end: ${game.end}, won: ${game.won}`);
      await game.save();
      console.log("Game saved successfully");

      res.status(200).send({ message: "Game ended successfully" });
    } catch (err) {
      console.log(`Game.end failure: ${err}`);
      console.error(err);
      res.status(500).send({ error: "Internal server error" });
    }
  });

  /**
   * Reset game to a specific move count (for undo/redo)
   *
   * @param {req.params.id} Id of game
   * @param {req.params.moveCount} Move count to reset to
   * @return {200} Success
   */
  app.put("/v1/game/:id/reset/:moveCount", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).send({ error: "unauthorized" });
    }

    try {
      const game = await app.models.Game.findById(req.params.id);
      if (!game) {
        return res.status(404).send({ error: "Game not found" });
      }

      // Verify user owns the game
      if (game.owner.toString() !== req.session.user._id.toString()) {
        return res.status(403).send({ error: "Not authorized to modify this game" });
      }

      const moveCount = parseInt(req.params.moveCount);
      if (isNaN(moveCount) || moveCount < 0) {
        return res.status(400).send({ error: "Invalid move count" });
      }

      console.log(`Resetting game ${req.params.id} to move count ${moveCount}`);

      // Get all moves for this game
      const allMoves = await app.models.Move.find({ game: req.params.id })
        .sort({ date: 1 })
        .exec();

      console.log(`Found ${allMoves.length} total moves, keeping first ${moveCount}`);

      // Delete moves after the target move count
      if (moveCount < allMoves.length) {
        const movesToDelete = allMoves.slice(moveCount);
        const moveIdsToDelete = movesToDelete.map(m => m._id);
        await app.models.Move.deleteMany({ _id: { $in: moveIdsToDelete } });
        console.log(`Deleted ${moveIdsToDelete.length} moves`);
      }

      // Replay moves to get the correct state
      let newState;
      if (moveCount === 0) {
        // Reset to initial state
        newState = game.initialState.toJSON();
      } else {
        // Replay moves up to moveCount
        newState = game.initialState.toJSON();
        const movesToReplay = allMoves.slice(0, moveCount);

        for (let i = 0; i < movesToReplay.length; i++) {
          const move = movesToReplay[i];
          const moveData = {
            cards: move.cards,
            src: move.src,
            dst: move.dst,
          };
          const result = await validateMove(newState, moveData);
          if (result.error) {
            console.error(`Error replaying move ${i}:`, result.error);
            return res.status(500).send({ error: `Failed to replay move ${i}` });
          }
          newState = result;
        }
      }

      // Update game state and move count
      game.state = newState;
      game.moves = moveCount;
      await game.save();

      console.log(`Game reset complete. New move count: ${game.moves}`);
      res.status(200).send({ message: "Game reset successfully", moves: game.moves });
    } catch (err) {
      console.error(`Game reset failure: ${err}`);
      res.status(500).send({ error: "Internal server error" });
    }
  });

  /**
   * Get game state at a specific move
   *
   * @param {req.params.id} Id of game
   * @param {req.params.moveIndex} Index of move to replay to (0-based)
   * @return {200} Game state after specified move
   */
  app.get("/v1/game/:id/move/:moveIndex", async (req, res) => {
    try {
      const game = await app.models.Game.findById(req.params.id);
      if (!game) {
        return res.status(404).send({ error: `unknown game: ${req.params.id}` });
      }

      const moveIndex = parseInt(req.params.moveIndex);
      if (isNaN(moveIndex)) {
        return res.status(400).send({ error: "Invalid move index" });
      }

      // Check if game has initialState (for backwards compatibility)
      if (!game.initialState) {
        return res.status(400).send({
          error: "This game was created before undo/redo was implemented. Initial state not available."
        });
      }

      // Special case: moveIndex < 0 means return the initial state
      if (moveIndex < 0) {
        return res.status(200).send(game.initialState.toJSON());
      }

      // Start with the initial state
      let currentState = game.initialState.toJSON();

      // Get moves up to the specified index
      const moves = await app.models.Move.find({ game: req.params.id })
        .sort({ date: 1 })
        .limit(moveIndex + 1)
        .exec();

      // Replay moves up to the specified index
      for (let i = 0; i < moves.length && i <= moveIndex; i++) {
        const move = moves[i];
        const moveData = {
          cards: move.cards,
          src: move.src,
          dst: move.dst,
        };
        const result = await validateMove(currentState, moveData);
        if (result.error) {
          console.log(`Error replaying move ${i}: ${result.error}`);
          return res.status(500).send({
            error: `Failed to replay move ${i}: ${result.error}`
          });
        }
        currentState = result;
      }

      res.status(200).send(currentState);
    } catch (err) {
      console.log(`Game.getMoveState failure: ${err}`);
      res.status(500).send({ error: "Internal server error" });
    }
  });

  // Provide end-point to request shuffled deck of cards and initial state - for testing
  app.get("/v1/cards/shuffle", (req, res) => {
    res.send(shuffleCards(false));
  });
  app.get("/v1/cards/initial", (req, res) => {
    res.send(initialState());
  });
};
