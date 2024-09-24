// import modules
const express = require('express');                                               // express.js framework
const app = express();
const bodyParser = require('body-parser');                                        // for parsing request bodies
const session = require('express-session');                                       // for session management
app.use(express.json()); // Parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));                               // parse URL-encoded requests


// session middleware setup
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');                         // generate 32 bytes of random data in hex format

app.use(session({
  secret: secretKey,                                                              // use the generated key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


// middleware to pass user to templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;                                     // set user data for views
  next();                                                                         // continue to the next middleware
});

const bcrypt = require('bcrypt');                                                 // for password hashing
const path = require('path');                                                     // for working with file paths
const auth = require('./modules/auth');                                           // authentication module
const db = require('./modules/db');                                               // database module

app.use(express.static('static'));                                                // serve static files

// set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', './views');                                                      // folder for EJS files

// route to render login page
app.get('/login', (req, res) => {
  res.render('login');                                                            // render login.ejs
});

// handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;                                        // get username and password

  if (!username || !password) {                                                   // if fields are empty
    return res.render('login', { error: 'Please enter both username and password' });
  }

  const query = 'SELECT * FROM users WHERE username = ?';                         // query to find user
  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error('Database error:', err);                                      // log error
      return res.status(500).render('login', { error: 'Database error' });
    }

    if (results.length === 0) {                                                   // if user not found
      return res.render('login', { error: 'Invalid username or password' });
    }

    const user = results[0];                                                      // get user data

    // compare hashed password with entered password
    const match = await bcrypt.compare(password, user.password);

    if (match) {                                                                  // if password matches
      req.session.user = { id: user.id, username: user.username };                // set session
      return res.redirect('/menu');                                               // redirect to menu
    } else {
      return res.render('login', { error: 'Invalid username or password' });      // wrong password
    }
  });
});

// logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {                                                  // destroy session
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');                                                       // redirect to login page
  });
});

// render registration page
app.get('/register', (req, res) => {
  res.render('register');                                                         // render register.ejs
});

// handle registration form submission
app.post('/register', async (req, res) => {
  const { username, password } = req.body;                                        // get username and password

  if (!username || !password) {                                                   // if fields are empty
    return res.render('register', { error: 'Please fill out all fields' });
  }

  try {
    const result = await auth.createUser(username, password);                     // create user
    if (result.success) { 
      res.render('register', { success: result.message });                        // registration success
    } else {
      res.render('register', { error: result.message });                          // error during registration
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.render('register', { error: 'Registration failed due to an error. Please try again.' });
  }
});

// update product quantity in cart
app.post('/updateQuantity', (req, res) => {
  const { index, quantity } = req.body;

  if (isNaN(quantity) || quantity < 1) {                                          // validate quantity
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  if (!req.session.cart || !req.session.cart[index]) {                            // validate cart index
    return res.status(400).json({ error: 'Invalid cart index' });
  }

  req.session.cart[index].quantity = quantity;                                    // update cart item quantity
  res.json({ cart: req.session.cart });                                           // return updated cart
});

// remove item from cart
app.post('/removeItem', (req, res) => {
  const { index } = req.body;

  if (!req.session.cart || req.session.cart.length <= index || index < 0) {
    return res.status(400).json({ error: 'Invalid cart index' });
  }

  req.session.cart.splice(index, 1);                                              // remove item from cart
  res.json({ cart: req.session.cart });                                           // return updated cart
});

// get cart data
app.get('/cartData', (req, res) => {
  const cart = req.session.cart || [];                                            // get cart from session
  res.json({ cart });                                                             // send cart data as JSON
});

// check if user is logged in
app.get('/loginStatus', (req, res) => {
  const isLoggedIn = !!req.session.user;                                          // check session for user
  res.json({ isLoggedIn });                                                       // send login status
});

// render cart page
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];                                            // get cart from session
  res.render('cart', { cart });                                                   // render cart page
});

// add item to cart
app.post('/addToCart', (req, res) => {
  const product = req.body;

  if (!product || !product.productId || !product.productName || isNaN(product.productPrice) || isNaN(product.quantity)) {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  if (!req.session.cart) {
    req.session.cart = [];                                                        // create cart if not exists
  }

  const index = req.session.cart.findIndex(item => item.productId === product.productId);
  if (index > -1) {
    req.session.cart[index].quantity++;                                           // increase quantity
  } else {
    req.session.cart.push(product);                                               // add new item
  }

  res.json({ cart: req.session.cart });                                           // return updated cart
});

// update the entire cart
app.post('/updateCart', (req, res) => {
  const cart = req.body;                                                          // get cart from request
  req.session.cart = cart;                                                        // save cart to session
  res.json({ success: true });                                                    // confirm success
});

// render homepage
app.get('/', (req, res) => {
  res.render('index');                                                            // render index.ejs
});

// render menu page
app.get('/menu', (req, res) => {
  const query = 'SELECT * FROM Products';                                         // query products
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error', err);
      return res.status(500).sendFile(path.join(__dirname, 'static', 'error-500.html'));
    }
    res.render('menu', { products: results });                                    // render menu page with products
  });
});

// render "About Us" page
app.get('/about', (req, res) => {
  res.render('about');                                                            // render about.ejs
});

// route to handle placing an order
app.post('/placeOrder', (req, res) => {  
  const { firstName, lastName, email, phone, address, paymentMethod } = req.body; // get first name, last name, phone, email, address, payment method from form 
  const userId = req.session.user.id;                                             // get the user Id from the session

  // validate the order data
  if (!firstName || !lastName || !email || !phone || !address || !paymentMethod) {    
    return res.status(400).json({ error: 'All fields are required' });            // if any field is missing, send a 400 response with an error message
  }

  // update user information in the database
  const updateQuery = 'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ? WHERE id = ?';
  // run the update query
  db.query(updateQuery, [firstName, lastName, email, phone, address, userId], (err) => {
    if (err) {      
      console.error('Error updating user data:', err);                            // log the error and send a 500 response if there's a database error
      return res.status(500).json({ error: 'Database error' });
    }
    
    const cart = req.session.cart || [];                                          // get the cart from the session or an empty array if it's undefined
    if (cart.length === 0) {      
      return res.status(400).json({ error: 'Cart is empty' });                    // if the cart is empty, send a 400 response with an error message
    }
    
    const totalPrice = cart.reduce((total, item) => total + item.productPrice * item.quantity, 0);  // calculate the total price by summing up the price of all products in the cart

    // insert a new entry in the order_info table
    const insertOrderInfoQuery = 'INSERT INTO order_info (user_id, total_price, address, phone, first_name, last_name, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)';
    // run the insert query
    db.query(insertOrderInfoQuery, [userId, totalPrice, address, phone, firstName, lastName, paymentMethod], (err, result) => {
      if (err) {
        
        console.error('Error inserting order info:', err);                        // log the error and send a 500 response if there's a database error
        return res.status(500).json({ error: 'Database error' });
      }
      
      const orderInfoId = result.insertId;                                        // get the Id of the newly order

      // for each product in the cart, insert it into the orders table
      const orderQueries = cart.map(item => {
        const orderQuery = 'INSERT INTO orders (order_info_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)';
        // create a promise for each query
        return new Promise((resolve, reject) => {
          db.query(orderQuery, [orderInfoId, item.productId, item.quantity, item.productPrice * item.quantity], (err) => {
            if (err) {              
              reject(err);                                                        // if error, reject the promise
            } else {              
              resolve();                                                          // if success, resolve the promise
            }
          });
        });
      });

      // wait for all the product queries to finish
      Promise.all(orderQueries)
        .then(() => {         
          req.session.cart = [];                                                  // clear the cart from the session
          res.json({ success: true });                                            // send a success response
        })
        .catch(err => {          
          console.error('Error placing order:', err);                             // log the error and send a 500 response
          res.status(500).json({ error: 'Error processing order' });
        });
    });
  });
});

// handle GET request to render the "Contact" page
app.get('/contact', (req, res) => {    
  db.query('SELECT * FROM contact_info WHERE id = 1', (err, results) => {         // run SQL query to get contact info       
    if (err) {                                                                    // if error occurs during query, log error and send 500 error page
      console.error('Error fetching contact info:', err);
      return res.status(500).sendFile(path.join(__dirname, 'static', 'error-500.html'));
    }
    
    if (results.length > 0) {                                                     // if contact info is found
      res.render('contact', { contact: results[0] });                             // render contact page
    } else {      
      res.status(404).sendFile(path.join(__dirname, 'static', 'error-404.html')); // if not found, show 404 error
    }
  });
});

// render order confirmation page
app.get('/orderConfirmation', (req, res) => {
  res.render('orderConfirmation');                                                // show order confirmation page
});

// update User Profile
app.post('/profile', (req, res) => {
  const {username, first_name, last_name, phone, email } = req.body;                           // get data from form
  const userId = req.session.user.id;                                                          // get user id from session  
  const validation = validateProfileData(username, first_name, last_name, phone, email);       // validate profile data

  if (!validation.success) {    
    return res.render('profile', { user: req.session.user, error: validation.message });       // show error if validation fails
  }
  
  const updateQuery = 'UPDATE users SET username = ?, first_name = ?, last_name = ?, phone = ?, email = ? WHERE id = ?'; // update user information
  db.query(updateQuery, [username, first_name, last_name, phone, email, userId], (err) => {
    if (err) {
      console.error('Error updating user data:', err);                                         // log error if update fails
      return res.render('profile', { user: req.session.user, error: 'Database error' });       // show error on profile page
    }
   
    const userQuery = 'SELECT username, first_name, last_name, address, phone, email FROM users WHERE id = ?'; // get updated user data
    db.query(userQuery, [userId], (err, userResult) => {
      if (err) {
        console.error('Error fetching user data:', err);                                       // log error if fetching fails
        return res.status(500).send('Error fetching user data');                               // send error if fetching fails
      }      
      res.render('profile', { user: userResult[0], success: 'Profile updated successfully' }); // show updated profile
    });
  });
});

// user Profile Data Validation Function
function validateProfileData(username, firstName, lastName, phone, email) {
  const usernameRegex = /^[A-Za-z0-9]{3,}$/;                                      // username must be letters/numbers, at least 3 characters
  const nameRegex = /^[A-Za-z]{2,}$/;                                             // first and last name must have letters only, at least 2 characters
  const phoneRegex = /^\+[0-9]{10,15}$/;                                          // phone must start with + and have 10-15 digits
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;                                // standard email format validation

  if (!usernameRegex.test(username)) {                                            // check if username is valid
    return { success: false, message: 'Invalid username' };                       
  }

  if (!nameRegex.test(firstName)) {                                               // check if first name is valid
    return { success: false, message: 'Invalid first name' };                     
  }

  if (!nameRegex.test(lastName)) {                                                // check if last name is valid
    return { success: false, message: 'Invalid last name' };                      
  }

  if (!phoneRegex.test(phone)) {                                                  // check if phone is valid
    return { success: false, message: 'Invalid phone number' };                   
  }

  if (!emailRegex.test(email)) {                                                  // check if email is valid
    return { success: false, message: 'Invalid email address' };                  
  }

  return { success: true };                                                       // return success if all fields are valid
}

// route to handle profile page request
app.get('/profile', (req, res) => {   
  if (!req.session.user) {                                                        // check if user is logged in
    return res.redirect('/login');                                                // if not, redirect to login
  }

  const userId = req.session.user.id;                                             // get current user's Id  
  const userQuery = 'SELECT username, first_name, last_name, address, phone, email FROM users WHERE id = ?'; // query to get user info
  db.query(userQuery, [userId], (err, userResult) => { 
    if (err) { 
      console.error('Error fetching user data:', err);                            // log error if query fails
      return res.status(500).send('Error fetching user data');                    // send error response
    }

    if (userResult.length === 0) { 
      return res.status(404).send('User not found');                              // if no user, send 404
    }    
    res.render('profile', { user: userResult[0], orders: [] });                   // show profile page
  });
});

// route for getting orders
app.get('/orders', (req, res) => {
  if (!req.session.user) {                                                        // check if user is logged in
    return res.status(401).json({ error: 'Unauthorized' });                       // send 401 if not logged in
  }
  const userId = req.session.user.id;                                             // get user Id from session

  // query to get minimal order info
  const orderListQuery = `
  SELECT 
    oi.id AS order_id,
    oi.order_date,
    oi.total_price
  FROM order_info oi
  WHERE oi.user_id = ?
  ORDER BY oi.order_date DESC
`;

  db.query(orderListQuery, [userId], (err, orders) => {                           // run query with user Id
    if (err) {                                                                    // if error occurs
      console.error('Error fetching order list:', err);                           // print error to console
      return res.status(500).json({ error: 'Database error' });                   // send 500 error response
    }
    res.json({ orders });                                                         // send 500 error
  });
});

// route to get details of specific order by Id
app.get('/orderDetails/:orderId', (req, res) => {
  
  if (!req.session.user) {                                                        // check if the user is logged in
    return res.status(401).json({ error: 'Unauthorized' });                       // if not, return error
  }

  
  const userId = req.session.user.id;                                             // get user Id 
  const orderId = req.params.orderId;                                             // get order Id 

  
  const checkOrderQuery = 'SELECT * FROM order_info WHERE id = ? AND user_id = ?'; // check if the order belongs to the logged-in user
  db.query(checkOrderQuery, [orderId, userId], (err, orderInfo) => {
    
    if (err) {                                                                    // if there's a database error, return an error response
      console.error('Error checking order:', err);                                // log the error
      return res.status(500).json({ error: 'Database error' });                   // return an error response
    }
    
    if (orderInfo.length === 0) {                                                 // if order not found or doesn't belong to user, return not found error
      return res.status(404).json({ error: 'Order not found' });                  // return "not found" error
    }

    // get the details of the order (products, quantity, price, etc.)
    const orderDetailsQuery = `
      SELECT 
        p.name,
        p.image_url,
        o.quantity,
        o.total_price
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.order_info_id = ?
    `;

    db.query(orderDetailsQuery, [orderId], (err, orderDetails) => {      
      if (err) {                                                                  // handle any errors in fetching the order details
        console.error('Error fetching order details:', err);                      // log the error
        return res.status(500).json({ error: 'Database error' });                 // return error response
      }

      // combine order info and details to send as response
      const details = {
        order_id: orderInfo[0].id,
        order_date: orderInfo[0].order_date,
        total_price: orderInfo[0].total_price,
        delivery_address: orderInfo[0].address,
        phone: orderInfo[0].phone,
        first_name: orderInfo[0].first_name,
        last_name: orderInfo[0].last_name,
        payment_method: orderInfo[0].payment_method,
        products: orderDetails
      };
      
      res.json({ details });                                                      // send the order details
    });
  });
});

// route to get checkout data
app.get('/checkoutData', (req, res) => {  
  if (!req.session.user) {                                                        // check if user is logged in
    return res.status(401).json({ error: 'User not logged in' });                 // return error if user not logged in
  }

  const userId = req.session.user.id;                                             // get user Id from session  
  const userQuery = 'SELECT first_name, last_name, phone, email, address FROM users WHERE id = ?';  // SQL query to get user information
  db.query(userQuery, [userId], (err, result) => {                                // run query using user Id
    if (err) {                                                                    // check for database error
      console.error('Error fetching user data:', err);                            // log error
      return res.status(500).json({ error: 'Database error' });                   // send database error
    }

    if (result.length > 0) {                                                      // if user data is found
      res.json({ user: result[0] });                                              // send user data
    } else {
      res.status(404).json({ error: 'User not found' });                          // send error if user not found
    }
  });
});



// run server on port 3000
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// handle 404 errors
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'static', 'error-404.html'));     // render 404 error page
});

// handle 500 server errors
app.use((err, req, res, next) => {
  console.error(err.stack);                                                       // log error stack
  res.status(500).sendFile(path.join(__dirname, 'static', 'error-500.html'));     // render 500 error page
});
