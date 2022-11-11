"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const { BadRequestError, ForbiddenError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: is_admin
 **/

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, userNewSchema, {
    required: true,
  });
  if (!validator.valid) {
    const errs = validator.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }

  const user = await User.register(req.body);
  const token = createToken(user);
  return res.status(201).json({ user, token });
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: is_admin
 **/

router.get("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const users = await User.findAll();
  return res.json({ users });
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: is_correct_user or is_admin
 **/

router.get("/:username", ensureLoggedIn, async function (req, res, next) {
  const username = req.params.username;
  if (
    res.locals.user.username === username ||
    res.locals.user.isAdmin === true
  ) {
    const user = await User.get(username);
    return res.json({ user });
  } else {
    throw new ForbiddenError();
  }
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: is_correct_user or is_admin
 **/

router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
  const username = req.params.username;
  //TODO: Add middleware to check if admin or correct user logged in
  //* Want to avoid repetition especially with authentication
  //* Want one place to change to avoid missing a route (no mistakes)
  if (
    res.locals.user.username === username ||
    res.locals.user.isAdmin === true
  ) {
    const validator = jsonschema.validate(req.body, userUpdateSchema, {
      required: true,
    });
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }
    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } else {
    throw new ForbiddenError(); //TODO: Should be using unauthorized instead
    //* FORBIDDEN "This is not a route where anyone can/should access!"
  }
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: is_correct_user or is_admin
 **/

router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
  const username = req.params.username;
  if (
    res.locals.user.username === username ||
    res.locals.user.isAdmin === true
  ) {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } else {
    throw new ForbiddenError();
  }
});

module.exports = router;
