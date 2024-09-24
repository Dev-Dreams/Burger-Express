// code example taken from https://github.com/mysqljs/mysql

const mysql = require('mysql');                                       // import the mysql module.
// set the details needed to connect to the database
const dbConfig = {
  host: 'localhost',                                                  // location of the database.
  user: 'root',                                                       // the username
  password: '',                                                       // the password
  database: 'burgerexpress',                                          // the name of the database
};

const connection = mysql.createConnection(dbConfig);                  //create a connection to the database.

// trying to connect to the database and processing errors.
connection.connect((err) => {
  if (err) {    
    console.error('Error connecting to the database: ' + err.stack);  // if an error occurs during connection, show it in the console
    return;
  }
  
  console.log('Connected to database as id ' + connection.threadId);  // if a connection is established, a message about this is displayed in the console
});

module.exports = connection;                                          // make the connection object available for use in other modules.
