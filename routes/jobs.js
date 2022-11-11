"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");
// const { findBySearch } = require("../models/company");
// const { sqlForCompanySearch } = require("../helpers/sql");

// code injection NOTE: refactoring while using req.query is possible!
const url = require("url");
const querystring = require("querystring");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { job: {id, title, salary, equity, companyHandle} }
 *
 * Authorization required: is_admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [{id, title, salary, equity, companyHandle}, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  // May have query strings like: ?title=senior&minSalary=99999

  // Note: refactor to using req.query is possible
  let parsedUrl = url.parse(req.url);
  let parsedQs = querystring.parse(parsedUrl.query);

  // Need to parseInt for minSalary
  if (parsedQs.minSalary !== undefined) {
    parsedQs.minSalary = parseInt(parsedQs.minSalary);
  }

  const validator = jsonschema.validate(parsedQs, jobSearchSchema, {
    required: true,
  });
  if (!validator.valid) {
    const errs = validator.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }

  // Check if any search query exists, if so, invoke search.
  if (Object.keys(parsedQs).length > 0) {
    const jobs = await Job.findBySearch(parsedQs);
    return res.json({ jobs });
  }

  // If no search query exists, return all jobs.
  const jobs = await Job.findAll();
  return res.json({ jobs });
});

/** GET /[id]  =>  { job }
 *
 *  Job is {id, title, salary, equity, companyHandle}
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: {title, salary, equity, companyHandle}
 *
 * Returns {id, title, salary, equity, companyHandle}
 *
 * Authorization required: is_admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, jobUpdateSchema, {
    required: true,
  });
  if (!validator.valid) {
    const errs = validator.errors.map((e) => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.update(req.params.id, req.body);
  return res.json({ job });
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: is_admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  await Job.remove(req.params.id);
  return res.json({ deleted: req.params.id });
});

module.exports = router;
