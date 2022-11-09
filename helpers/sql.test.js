"use strict";

const { BadRequestError } = require("../expressError");
const {
  sqlForPartialUpdate,
  sqlForCompanySearch,
  sqlForCompanySearchByName,
  sqlForCompanySearchByNumEmps
} = require("./sql");

describe("sqlForPartialUpdate", function () {

  test("works for full update", function () {
    const { setCols, values } = sqlForPartialUpdate(
      {
        numEmployees: 5,
        logoUrl: "test.com"
      },
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    expect(setCols).toEqual(`"num_employees"=$1, "logo_url"=$2`);
    expect(values).toEqual([5, "test.com"]);
  });

  test("works for partial update", function () {
    const { setCols, values } = sqlForPartialUpdate(
      {
        numEmployees: 12
      },
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    expect(setCols).toEqual(`"num_employees"=$1`);
    expect(values).toEqual([12]);
  });

  test("unchanged default names still work", function () {
    const { setCols, values } = sqlForPartialUpdate(
      {
        num_employees: 42
      },
      {
        logoUrl: "logo_url",
      });
    expect(setCols).toEqual(`"num_employees"=$1`);
    expect(values).toEqual([42]);
  });

  test("does not work for empty dataToUpdate", function () {
    expect(function () {
      sqlForPartialUpdate(
        {},
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    }).toThrow(BadRequestError);
  });

});

describe("sqlForCompanySearch", function () {

  // test("works for full update", function () {
  //   sqlForCompanySearch()
  // });

  test("works for search by name", function () {
    const sqlForName = sqlForCompanySearchByName("net");
    expect(sqlForName).toEqual([`name ILIKE %net%`]);
  })

  test("works for search by num emps, min only", function () {
    const sqlForEmps = sqlForCompanySearchByNumEmps({minEmployees: 5});
    expect(sqlForEmps).toEqual([`num_employees >= 5`]);
  })

  test("works for search by num emps, max only", function () {
    const sqlForEmps = sqlForCompanySearchByNumEmps({maxEmployees: 10});
    expect(sqlForEmps).toEqual([`num_employees <= 10`]);
  })

  test("works for search by num emps, min and max", function () {
    const sqlForEmps = sqlForCompanySearchByNumEmps(
      {
        minEmployees: 2,
        maxEmployees: 10
      });
    expect(sqlForEmps).toEqual([
      `num_employees >= 2`,
      `num_employees <= 10`
    ]);
  })

  test("fails for search by num emps, min > max", function () {
    expect(function () {
      sqlForCompanySearchByNumEmps(
        {
          minEmployees: 10,
          maxEmployees: 1
        });
    }).toThrow(BadRequestError);
  })


});
