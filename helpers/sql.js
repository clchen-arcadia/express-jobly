"use strict";

const { BadRequestError } = require("../expressError");

/** Function that accepts an object with data to update
 *  If no keys are present, return an error
 *  Map through number of keys in dataToUpdate
 *  If jsToSql exists, change the column name in SQL. Otherwise, retain
 *  the original name
 *  Create string literals for each parameter starting at $1
 *  Return object with string of joined cols and values from dataToUpdate
 *
 * @param {*} dataToUpdate
 * @param {*} jsToSql
 * @returns
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

module.exports = { sqlForPartialUpdate };
