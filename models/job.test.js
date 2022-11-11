"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "newJob",
    salary: 123456,
    equity: 0.01,
    company_handle: 'c1'
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: job.id,
      title: "newJob",
      salary: 123456,
      equity: '0.01',
      companyHandle: 'c1'
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`
    );
    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "newJob",
        salary: 123456,
        equity: '0.01',
        companyHandle: 'c1'
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        title: "j1",
        salary: 100000,
        equity: '0',
        companyHandle: 'c1',
      },
      {
        id: 2,
        title: "j2",
        salary: 200000,
        equity: '0.02',
        companyHandle: 'c1',
      },
      {
        id: 3,
        title: "j3",
        salary: 300000,
        equity: '0',
        companyHandle: 'c2',
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "j1",
      salary: 100000,
      equity: '0',
      companyHandle: 'c1',
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(42);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      console.log("test----", err);
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 456789,
    equity: 0.321,
    company_handle: "c3",
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      title: "New",
      salary: 456789,
      equity: '0.321',
      companyHandle: "c3",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        id: 1,
        title: "New",
        salary: 456789,
        equity: '0.321',
        companyHandle: "c3",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      equity: null,
      salary: null,
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      companyHandle: 'c1',
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        id: 1,
        title: "New",
        companyHandle: "c1", // <--- are prev. changes persistent?? beforeEach on test or describe level??
        equity: null,
        salary: null,
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(42, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
      "SELECT id FROM jobs WHERE id = 1"
    );
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(42);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** search */

// NOT IMPLEMENTED YET TODO:
// describe("search", function () {
//   test("works with search term", async function () {
//     const result = await Company.findBySearch(
//       {nameLike: 'c1'}
//       );
//     expect(result).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//     ]);
//   });

//   test("works with multiple search terms", async function () {
//     const result = await Company.findBySearch(
//       {
//         nameLike: 'c',
//         minEmployees: 2
//       }
//       );
//     expect(result).toEqual([
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
//     ]);
//   });

//   test("works where search excludes all companies", async function () {
//     const result = await Company.findBySearch(
//       {
//         nameLike: 'c',
//         minEmployees: 5
//       }
//       );
//     expect(result).toEqual([]);

//   });

//   // Note: search term validation not done at Model class level
//   // it is done on the route level.

// });
