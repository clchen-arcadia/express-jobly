"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");
const { BadRequestError } = require("../expressError");
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "newJob",
    salary: 123456,
    equity: 0.01,
    companyHandle: "c1",
  };

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anonymous users", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("ok for admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: resp.body.job.id,
        title: "newJob",
        salary: 123456,
        equity: "0.01",
        companyHandle: "c1",
      },
    });
  });

  test("bad request with missing data for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "newJob",
        salary: 123456,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauth bad request with missing data for non-admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "newJob",
        salary: 123456,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "asdf",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauth bad request with invalid data for anon", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "asdf",
      });
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: 1,
          title: "j1",
          salary: 100000,
          equity: "0",
          companyHandle: "c1",
        },
        {
          id: 2,
          title: "j2",
          salary: 200000,
          equity: "0.02",
          companyHandle: "c1",
        },
        {
          id: 3,
          title: "j3",
          salary: 300000,
          equity: "0",
          companyHandle: "c2",
        },
      ],
    });
  });

  //TODO: Must implement job search functionality!
  // test("works for filtering by name", async function () {
  //   const resp = await request(app).get("/companies?nameLike=c1");
  //   expect(resp.body).toEqual({
  //     companies: [
  //       {
  //         handle: "c1",
  //         name: "C1",
  //         description: "Desc1",
  //         numEmployees: 1,
  //         logoUrl: "http://c1.img",
  //       },
  //     ],
  //   });
  //   expect(resp.status).toEqual(200);
  // });

  // test("works for filtering by numEmployees", async function () {
  //   const resp = await request(app).get(
  //     "/companies?nameLike=c&minEmployees=2&maxEmployees=100"
  //   );
  //   expect(resp.status).toEqual(200);
  //   expect(resp.body).toEqual({
  //     companies: [
  //       {
  //         handle: "c2",
  //         name: "C2",
  //         description: "Desc2",
  //         numEmployees: 2,
  //         logoUrl: "http://c2.img",
  //       },
  //       {
  //         handle: "c3",
  //         name: "C3",
  //         description: "Desc3",
  //         numEmployees: 3,
  //         logoUrl: "http://c3.img",
  //       },
  //     ],
  //   });
  // });

  // test("returns error JSON for invalid search term", async function () {
  //   const resp = await request(app).get(
  //     "/companies?termDoesNotExist=c&minEmployees=2"
  //   );
  //   expect(resp.error.status).toEqual(400);
  // });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
      .get("/companies")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "j1",
        salary: 100000,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/42`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "newTitle",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("ok for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "newTitle",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "newTitle",
        salary: 100000,
        equity: "0",
        companyHandle: "c1",
      },
    });
    expect(resp.statusCode).toEqual(200);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/1`).send({
      title: "newTitle",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/42`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauth on no such job for non-admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/42`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request on id change attempt for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        id: 42,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauth on id change attempt for non-admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        id: 42,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request on invalid data for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        salary: "asdf",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauth on invalid data for non-admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        salary: "asdf",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("ok for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job for admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/42`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauth for no such job for non-admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/42`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for no such job for anon", async function () {
    const resp = await request(app).delete(`/jobs/42`);
    expect(resp.statusCode).toEqual(401);
  });
});
