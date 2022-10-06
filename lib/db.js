
const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'opentutorials',
    password: '1111',
    database: 'opentutorials'
});
db.connect();

module.exports = db;