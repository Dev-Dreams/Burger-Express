const bcrypt = require('bcrypt');                                                           // import bcrypt for password hashing
const db = require('./db');                                                                 // import the database module

// Function to create a new user with a hashed password
async function createUser(username, password) {
  try {
    // check if a user with the same username already exists
    const checkUserQuery = 'SELECT * FROM users WHERE username = ?';
    const userExists = await new Promise((resolve, reject) => {
      db.query(checkUserQuery, [username], (err, results) => {
        if (err) {
          console.error('Error checking user existence:', err);                             // log any error
          return reject(false);                                                             // reject if there's an error
        }
        if (results.length > 0) {
          return resolve(true);                                                             // user already exists
        } else {
          return resolve(false);                                                            // no user found with that username
        }
      });
    });

    if (userExists) {      
      return { success: false, message: 'Username already exists' };                        // if the user already exists, return a failure response
    }

    // Hash the password if the user doesn't exist
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    return new Promise((resolve, reject) => {
      db.query(query, [username, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error inserting user into database:', err);                        // log any error
          return reject({ success: false, message: 'Error inserting user into database' });
        }
        console.log('User successfully registered');                                        // log success
        return resolve({ success: true, message: 'User successfully registered' });
      });
    });
  } catch (err) {
    console.error('Error creating user:', err);                                             // log any unexpected error
    return { success: false, message: 'Internal server error' };                            // return failure response
  }
}

// function to authenticate a user
async function authenticateUser(username, password) {
  try {
    // find the user in the database by username
    const query = 'SELECT * FROM users WHERE username = ?';
    return new Promise((resolve, reject) => {
      db.query(query, [username], async (err, results) => {
        if (err) {
          console.error('Database error:', err);                                            // log any database error
          return reject('Database error');                                                  // reject if there's an error
        }

        // If user not found
        if (results.length === 0) {
          return resolve(false);                                                            // no user found, authentication failed
        }

        const user = results[0];

        // Compare the entered password with the hashed password in the database
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          return resolve(true);                                                             // password matches, authentication successful
        } else {
          return resolve(false);                                                            // password doesn't match
        }
      });
    });
  } catch (err) {
    console.error('Error authenticating user:', err);                                       // log any unexpected error
    return false;                                                                           // return failure if error occurs
  }
}

module.exports = { createUser, authenticateUser };                                          // export the functions to be used in other modules
