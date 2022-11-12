"use strict";

const { BadRequestError } = require("../expressError");
const {
  sqlForPartialUpdate,
  sqlForCompanySearch,
  _sqlForCompanySearchByName,
  _sqlForCompanySearchByNumEmps,
  sqlForJobSearch,
} = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("works for full update", function () {
    const { setCols, values } = sqlForPartialUpdate(
      {
        numEmployees: 5,
        logoUrl: "test.com",
      },
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      }
    );
    expect(setCols).toEqual(`"num_employees"=$1, "logo_url"=$2`);
    expect(values).toEqual([5, "test.com"]);
  });

  test("works for partial update", function () {
    const { setCols, values } = sqlForPartialUpdate(
      {
        numEmployees: 12,
      },
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      }
    );
    expect(setCols).toEqual(`"num_employees"=$1`);
    expect(values).toEqual([12]);
  });

  test("unchanged default names still work", function () {
    const { setCols, values } = sqlForPartialUpdate(
      {
        num_employees: 42,
      },
      {
        logoUrl: "logo_url",
      }
    );
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
        }
      );
    }).toThrow(BadRequestError);
  });
});

describe("sqlForCompanySearch components", function () {
  // test("works for full update", function() {
  //   sqlForCompanySearch()
  // });

  test("works for search by name", function () {
    const objForName = _sqlForCompanySearchByName("net", 0);
    expect(objForName).toEqual({
      colsTemp: [`name ILIKE $1`],
      valuesTemp: ['%net%']
      }
    );
  });

  test("works for search by name with offset", function () {
    const objForName = _sqlForCompanySearchByName("net", 5);
    expect(objForName).toEqual({
      colsTemp: [`name ILIKE $6`],
      valuesTemp: ['%net%']
      }
    );
  });

  test("fails for bad request", function () {
    expect(function () {
      _sqlForCompanySearchByName("", 0);
    }).toThrow(BadRequestError);
  });

  test("works for search by num emps, min only", function () {
    const objForEmps = _sqlForCompanySearchByNumEmps({ minEmployees: 5 }, 0);
    expect(objForEmps).toEqual({
      colsTemp: [`num_employees >= $1`],
      valuesTemp: [5]
    });
  });

  test("works for search by num emps, max only", function () {
    const objForEmps = _sqlForCompanySearchByNumEmps({ maxEmployees: 10 }, 0);
    expect(objForEmps).toEqual({
      colsTemp: [`num_employees <= $1`],
      valuesTemp: [10]
    });
  });

  test("works for search by num emps, min and max", function () {
    const objForEmps = _sqlForCompanySearchByNumEmps(
      {
        minEmployees: 2,
        maxEmployees: 10,
      },
      1
    );
    expect(objForEmps).toEqual({
      colsTemp: [`num_employees >= $2`, `num_employees <= $3`],
      valuesTemp: [2, 10]
    });
  });

  test("fails for search by num emps, min > max", function () {
    expect(function () {
      _sqlForCompanySearchByNumEmps(
        {
          minEmployees: 10,
          maxEmployees: 1,
        },
        0
      );
    }).toThrow(BadRequestError);
  });


  test("fails for bad request", function () {
    expect(function () {
      _sqlForCompanySearchByNumEmps({}, 0);
    }).toThrow(BadRequestError);
  });
});

describe("sqlForCompanySearch", function () {
  test("Given empty object returns an object with correct empty values", function () {
    const result = sqlForCompanySearch({});
    expect(result).toEqual({
      searchCols: "",
      values: []
    });
  });

  test("Given object with one property returns correct object", function () {
    const result = sqlForCompanySearch({ minEmployees: 2 });
    expect(result).toEqual({
      searchCols: "num_employees >= $1",
      values: [2]
    });
  });

  test("Given object with one property returns correct object", function () {
    const result = sqlForCompanySearch({ nameLike: "net" });
    expect(result).toEqual({
      searchCols: "name ILIKE $1",
      values: ['%net%']
    });
  });

  test("Given object with all properties returns correct object", function () {
    const result = sqlForCompanySearch({
      nameLike: "net",
      minEmployees: 3,
      maxEmployees: 15,
    });
    expect(result).toEqual({
      searchCols: "name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3",
      values: ['%net%', 3, 15]
    });
  });

  test("fails for search by num emps, min > max", function () {
    expect(function () {
      sqlForCompanySearch({
        minEmployees: 10,
        maxEmployees: 1,
      });
    }).toThrow(BadRequestError);
  });
});

describe("sqlForJobSearch", function () {
  test("Given empty object returns an object with correct empty values", function () {
    const result = sqlForJobSearch({});
    expect(result).toEqual({
      searchCols: "",
      values: []
    });
  });

  test("Given object with one property returns correct object", function () {
    const result = sqlForJobSearch({ minSalary: 200000 });
    expect(result).toEqual({
      searchCols: "salary >= $1",
      values: [200000]
    });
  });

  test("Given object with one property returns correct object", function () {
    const result = sqlForJobSearch({ hasEquity: false });
    expect(result).toEqual({
      searchCols: "equity = $1",
      values: [0]
    });
  });

  test("Given object with one property returns correct object", function () {
    const result = sqlForJobSearch({ title: "senior" });
    expect(result).toEqual({
      searchCols: "title ILIKE $1",
      values: ['%senior%']
    });
  });

  test("Given object with all properties returns correct object", function () {
    const result = sqlForJobSearch({
      title: "senior",
      minSalary: 300000,
      hasEquity: true,
    });
    expect(result).toEqual({
      searchCols: "title ILIKE $1 AND salary >= $2 AND equity > $3",
      values: ['%senior%', 300000, 0]
    });
  });
});
