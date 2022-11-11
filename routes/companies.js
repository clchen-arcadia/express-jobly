"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ForbiddenError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companySearchSchema = require("../schemas/companySearch.json");
const { findBySearch } = require("../models/company");
const { sqlForCompanySearch } = require("../helpers/sql");

// code injection
const url = require('url');
const querystring = require('querystring');


const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: is_admin
 */

router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    companyNewSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.create(req.body);
  return res.status(201).json({ company });
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {

  // May have query strings like: ?nameLike=Arnold&minEmployees=2
  // debugger;
  // console.log("test-----", req.query);
  let parsedUrl = url.parse(req.url);
  let parsedQs = querystring.parse(parsedUrl.query);
  //req.query...? ---> it exists!! think about this for later...

  // Need to parseInt for minEmployees and maxEmployees
  if (parsedQs.minEmployees !== undefined) {
    parsedQs.minEmployees = parseInt(parsedQs.minEmployees);
  }
  if (parsedQs.maxEmployees !== undefined) {
    parsedQs.maxEmployees = parseInt(parsedQs.maxEmployees);
  }

  const validator = jsonschema.validate(
    parsedQs,
    companySearchSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  // Check if any search query exists, if so, invoke search.
  if (Object.keys(parsedQs).length > 0) {
    const companies = await Company.findBySearch(parsedQs);
    return res.json({ companies });
  }

  // If no search query exists, return all companies.
  const companies = await Company.findAll();
  return res.json({ companies });
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  const company = await Company.get(req.params.handle);
  return res.json({ company });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: is_admin
 */

router.patch("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    companyUpdateSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.update(req.params.handle, req.body);
  return res.json({ company });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: is_admin
 */

router.delete("/:handle", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  await Company.remove(req.params.handle);
  return res.json({ deleted: req.params.handle });
});


module.exports = router;
