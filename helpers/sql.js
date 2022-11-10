"use strict";

const { BadRequestError } = require("../expressError");

/** Function accepts an object with data to update,
 *  if object is empty, return an error.
 *  Maps over object keys in and references jsToSql to change JavaScript
 *  variable names to column names in SQL. (If a key in dataToUpdate does
 *  not appear as a key in jsToSql, that key name
 *  will appear in the SQL injection as is.)
 *  Create string literals for SQL injection and changes from 0-based indexing
 *  to SQL 1-based indexing.
 *  Return two-keyed object with setCols being a string for SQL commands
 *  and dataToUpdate being an array of data values to be set in SQL.
 *
 * @param {*} dataToUpdate Object like  {
          firstName: "Bob",
          lastName: "Smith",
          isAdmin: "true"
        }
 * @param {*} jsToSql Object like  {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin"
        }
 * @returns Object like {
          setCols: ' "first_name"=$1, "last_name"=$2, "is_admin"=$3 ',
          values: ["Bob", "Smith", "true"]
        }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/**
 * Function accepts parameters object, whose keys are allowed search parameters.
 * Function invokes helper functions as needed to collect WHERE clause parameters.
 * Function returns an object with two key-value pairs.
 * For searchCols postgres WHERE clauses are joined with " AND ", giving a string.
 * And values is an array of the relevant values being searched by.
 *
 *
 * Returns Object like: {
          searchCols (string): 'name ILIKE $1 AND num_employees >= $2',
          values (array): ["%Anderson%", 100"]
        }
 */

function sqlForCompanySearch(queryParams) {

  const { minEmployees, maxEmployees, nameLike } = queryParams;

  let cols = [];
  let values = [];

  if (nameLike !== undefined) {

    let { colsTemp, valuesTemp } =
      _sqlForCompanySearchByName(nameLike, values.length);

    cols = cols.concat(colsTemp);
    values = values.concat(valuesTemp);
  }

  if (minEmployees !== undefined || maxEmployees !== undefined) {
    let { colsTemp, valuesTemp } =
      _sqlForCompanySearchByNumEmps(
      {
        minEmployees,
        maxEmployees
      },
      values.length);

    cols = cols.concat(colsTemp);
    values = values.concat(valuesTemp);
  }

  return {
    searchCols: cols.join(" AND "),
    values: values
  };
}

/**
 * Function accepts string for search term by nameLike
 * Function returns two item Object, colsTemp which is an array,
 *   and valuesTemp which is also an array.
 *
 * These keys must be named as they are for later object deconstruction!
 *
 * A currentIdx is accepted, which starts the indices appropriately for parameterization.
 *
 * Returns Object like: {
 *    colsTemp: ['name ILIKE $1'],
 *    valuesTemp: ['%net%']
 * }
 */

function _sqlForCompanySearchByName(searchTerm, currentIdx) {
  if (searchTerm === undefined || searchTerm === "") {
    throw new BadRequestError();
  }
  const col = `name ILIKE $${currentIdx + 1}`;
  const value = `%${searchTerm}%`;
  return {
    colsTemp: [col],
    valuesTemp: [value]
  };
}

/**
 * Accepts object 'conditions' with possible keys (minimum one) of
 *  minEmployees, maxEmployees.
 * Returns Object with two key-value pairs.
 * These keys must be named as they are for later object deconstruction!
 *
 * When relevant, the minimum conditional is written before the maximum conditional.
 *
 * A currentIdx is accepted, which starts the indices appropriately for parameterization.
 *
 * Returns Object like: {
 *    searchCols: ['num_employees >= $1', 'num_employees <= $2'],
 *    values: [100, 200]
 * }
 */
function _sqlForCompanySearchByNumEmps(conditions, currentIdx) {
  const { minEmployees, maxEmployees } = conditions;
  if (minEmployees === undefined && maxEmployees === undefined) {
    throw new BadRequestError();
  }
  if (minEmployees > maxEmployees) {
    throw new BadRequestError();
  }

  let searchCols = [];
  let values = [];

  if (minEmployees !== undefined) {
    searchCols.push(`num_employees >= $${currentIdx + 1}`);
    values.push(minEmployees);
    currentIdx++;
  }
  if (maxEmployees !== undefined) {
    searchCols.push(`num_employees <= $${currentIdx + 1}`);
    values.push(maxEmployees);
    currentIdx++;
  }

  return {
    colsTemp: searchCols,
    valuesTemp: values
  };
}

module.exports = {
  sqlForPartialUpdate,
  sqlForCompanySearch,
  _sqlForCompanySearchByName,
  _sqlForCompanySearchByNumEmps
};
