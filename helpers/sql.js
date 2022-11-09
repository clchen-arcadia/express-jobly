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
          setCols: '"first_name"=$1, "last_name"=$2, "is_admin"=$3',
          values: ["Bob", "Smith", "true"]
        }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/**
 * Function accepts
 */

function sqlForCompanySearch(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return whereConditional;
}

/**
 * Function accepts string for search term
 * Function returns one item array of a string literal that
 *  is valid WHERE clause for postgres
 */
function sqlForCompanySearchByName(searchTerm){
  if(searchTerm === undefined || searchTerm === ""){
    throw new BadRequestError();
  }
  return [`name ILIKE %${searchTerm}%`];
}

/**
 * Accepts object conditions with keys (minimum one) of
 * minEmployees, maxEmployees
 * Returns list of WHERE clause conditionals for postgres
 */
function sqlForCompanySearchByNumEmps(conditions){

  const { minEmployees, maxEmployees } = conditions;
  if( minEmployees === undefined && maxEmployees === undefined){
    throw new BadRequestError();
  }
  if( minEmployees > maxEmployees ) {
    throw new BadRequestError();
  }
  let output = [];
  if(minEmployees !== undefined){
    output.push(`num_employees >= ${minEmployees}`);
  }
  if(maxEmployees !== undefined){
    output.push(`num_employees <= ${maxEmployees}`);
  }

  return output;
}

module.exports = {
  sqlForPartialUpdate,
  sqlForCompanySearch,
  sqlForCompanySearchByName,
  sqlForCompanySearchByNumEmps
};
