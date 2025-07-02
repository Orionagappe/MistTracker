const mysql = require('mysql'); // Use the core 'mysql' module, as in mysql-master

function createMistConnection(config) {
  const connection = mysql.createConnection(config);

  // Promisify query for compatibility
  connection.queryAsync = function (sql, params) {
    return new Promise((resolve, reject) => {
      connection.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  };

  // Optionally add connect/disconnect helpers
  connection.connectAsync = function () {
    return new Promise((resolve, reject) => {
      connection.connect(err => (err ? reject(err) : resolve()));
    });
  };
  connection.endAsync = function () {
    return new Promise((resolve, reject) => {
      connection.end(err => (err ? reject(err) : resolve()));
    });
  };

  return connection;
}

module.exports = { createMistConnection };