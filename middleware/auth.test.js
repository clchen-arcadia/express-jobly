"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError, ForbiddenError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrSelf,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

function next(err) {
  if (err) throw new Error("Got error from middleware");
}

describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureLoggedIn(req, res, next, next)).toThrowError(UnauthorizedError);
  });
});

describe("ForbiddenError is working", function () {
  expect(function () {
    throw new ForbiddenError();
  }).toThrow(ForbiddenError);
});

describe("ensureAdmin", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    ensureAdmin(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(function () {
      ensureAdmin(req, res, next);
    }).toThrowError(UnauthorizedError);
  });

  test("unauth if not admin", function () {
    const req = {};
    const res = { locals: { user: { username: 'test', isAdmin: false } } };
    expect(function () {
      ensureAdmin(req, res, next);
    }).toThrowError(UnauthorizedError);
  });
});


describe("ensureAdminOrSelf", function () {
  test("works", function () {
    const req = { params: { username: "test1" } };
    const res = { locals: { user: { username: "test1", isAdmin: true } } };
    ensureAdminOrSelf(req, res, next);
  });

  test("unauth if no login", function () {
    const req = { params: { username: "test1" } };
    const res = { locals: {} };
    expect(function () {
      ensureAdminOrSelf(req, res, next);
    }).toThrowError(UnauthorizedError);
  });

  test("ok if admin", function () {
    const req = { params: { username: "test1" } };
    const res = { locals: { user: { username: 'admin', isAdmin: true } } };
    ensureAdminOrSelf(req, res, next);
  });

  test("ok if is self", function () {
    const req = { params: { username: "test1" } };
    const res = { locals: { user: { username: 'test1', isAdmin: false } } };
    ensureAdminOrSelf(req, res, next);
  });

  test("unauth if neither admin nor self", function () {
    const req = { params: { username: "test1" } };
    const res = { locals: { user: { username: 'test2', isAdmin: false } } };
    expect(function () {
      ensureAdminOrSelf(req, res, next);
    }).toThrowError(UnauthorizedError);
  });
});
