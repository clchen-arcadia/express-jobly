"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("works: partial update", function () {
    const { setCols, values } = sqlForPartialUpdate(
      { numEmployees: 5, logoUrl: "test.com" },
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      }
    );
    expect(setCols).toEqual(`"num_employees"=$1, "logo_url"=$2`);
    expect(values).toEqual([5, "test.com"]);
  });

  test("does not work: partial update", function () {
    expect(function () {
      sqlForPartialUpdate(
        {},
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        }
      );
    }).toThrow(BadRequestError);
  });
});
