# Burger Express - Fast Food Ordering Web Application

Burger Express is a web-based application for ordering burgers online. The app includes user authentication, session management, a shopping cart, and checkout functionality.

## Features

- **User Authentication**: users can register and log in.
- **Session Management**: session-based cart and user login tracking. A new secret key is generated for each session.
- **Product Menu**: users can view the burger menu fetched from a database.
- **Shopping Cart**: users can add, update, and remove items from their cart.
- **Order Confirmation**: after placing an order, the cart is cleared and a confirmation page is displayed.
- **Contact Page**: fetches and displays contact information from the database.
- **Custom Error Pages**: displays 404 and 500 error pages when appropriate.

## Installation

1. Clone the repository:
   git clone https://github.com/Dev-Dreams/Burger-Express.git
2. Navigate to the project directory:
   cd burger-express
3. Install dependencies:
   npm install
4. Run the application:
   node app.js
5. Open your browser and navigate to:
   http://localhost:3000

## Project Structure
- app.js – main application file.
- views/ – contains EJS templates for rendering HTML pages.
- static/ – directory for static files (e.g., images, CSS, JavaScript).
- modules/ – includes custom modules like auth.js for authentication and db.js for database connection.

## Dependencies
- Express: web framework for Node.js.
- EJS: template engine for rendering HTML.
- bcrypt: library for password hashing.
- express-session: middleware for session management.
- body-parser: middleware for parsing request bodies.
