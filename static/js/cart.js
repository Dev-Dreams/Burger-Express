// make sure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {  
  fetch('/cartData')                                                          // fetch cart data from the server
    .then(response => response.json())                                        // convert response to JSON
    .then(data => {
      dispCart(data.cart);                                                    // display the cart received from the server
    })
    .catch(err => console.error('Error fetching cart data:', err));           // log any errors
});

// function to display items in the cart
function dispCart(cart) {
  var cartCont = document.getElementById('cartItems');                        // get the cart container
  let total = 0;                                                              // initialize total price

  if (cart.length > 0) {
    // initialize the HTML for the cart table
    let tableH = `<table class="table">
              <thead>
                  <tr>
                      <th scope="col" class="col-5">Product</th>
                      <th scope="col" class="col-2">Price</th>
                      <th scope="col" class="col-2">Quantity</th>
                      <th scope="col" class="col-2 text-center">Total</th>
                      <th scope="col" class="col-1">Actions</th>
                  </tr>
              </thead>
              <tbody>`;
    
    cart.forEach((item, index) => {                                           // loop through each item in the cart
      var items = item.productPrice * item.quantity;                          // calculate total price for each item
      total += items;                                                         // add to total
      // create table rows for each cart item
      tableH += `<tr>
                  <td class="align-middle">${item.productName}</td>
                  <td class="align-middle">$${item.productPrice.toFixed(2)}</td>
                  <td class="align-middle">
                      <input type="number" class="form-control" value="${item.quantity}" min="1" onchange="updQuantity(${index}, this.value)">
                  </td>
                  <td class="align-middle text-center">$${items.toFixed(2)}</td>
                  <td class="align-middle">
                      <button class="btn btn-danger btn-sm" onclick="rmItem(${index})">Remove</button>
                  </td>
              </tr>`;
    });
    tableH += `</tbody></table>`;
    cartCont.innerHTML = tableH;                                              // insert table into cart container
  } else {
    cartCont.innerHTML = '<div class="alert alert-warning text-center" role="alert">Your cart is empty!</div>'; // show message if cart is empty
  }
  document.getElementById('totalPrice').textContent = total.toFixed(2);       // update total price
}

// function to update the quantity of a cart item
function updQuantity(index, quantity) {  
  quantity = parseInt(quantity, 10);                                          // ensure quantity is a valid number
  if (isNaN(quantity) || quantity < 1) {
    console.error('Invalid quantity:', quantity);                             // log invalid quantity
    return;
  }

  // send a request to the server to update the item quantity
  fetch('/updateQuantity', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ index: index, quantity: quantity }),               // send index and updated quantity
  })
  .then(response => response.json())                                          // convert response to JSON
  .then(data => {
    dispCart(data.cart);                                                      // update the cart display on the client    
    updCartCount();                                                           // update the cart item count
  })
  .catch(error => {
    console.error('Error updating quantity:', error);                         // log error if update fails
  });
}

// function to delete an item from the cart
function rmItem(index) {
  
  fetch('/removeItem', {                                                      // send a request to the server to remove the item
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ index: index }),                                   // send index of item to remove
  })
  .then(response => response.json())                                          // convert response to JSON
  .then(data => {
    dispCart(data.cart);                                                      // update cart display after item is removed    
    updCartCount();                                                           // update the cart item count
  })
  .catch(error => {
    console.error('Error removing item:', error);                             // log error if remove fails
  });
}

// function to verify user login status
function checkLogin() {
  fetch('/loginStatus')                                                       // request server for login status
    .then(response => response.json())                                        // convert response to JSON
    .then(data => {
      if (!data.isLoggedIn) {                                                 // if not logged in, redirect to login page
        window.location.href = '/login';
      } else {                                                                // if logged in, fetch cart data
        fetch('/cartData')
          .then(response => response.json())                                  // convert cart data to JSON
          .then(cartData => {
            if (cartData.cart.length === 0) {                                 // if cart is empty, show empty cart modal
              var emptyCartModal = new bootstrap.Modal(document.getElementById('emptyCartModal'));
              emptyCartModal.show();
            } else {                                                          // if cart has items, fetch user data
              fetch('/checkoutData')
                .then(response => response.json())                            // convert user data to JSON
                .then(userData => {
                  if (userData.user) {                                        // if user data exists, fill form fields
                    document.getElementById('firstName').value = userData.user.first_name;
                    document.getElementById('lastName').value = userData.user.last_name;
                    document.getElementById('email').value = userData.user.email;
                    document.getElementById('phone').value = userData.user.phone;
                    document.getElementById('address').value = userData.user.address;
                  }
                  
                  var checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
                  checkoutModal.show();                                       // show the checkout modal
                })
                .catch(err => console.error('Error fetching checkout data:', err)); // handle errors if fetching user data fails
            }
          });
      }
    })
    .catch(err => console.error('Error checking login status:', err));        // handle errors if fetching login status fails
}




// function to validate the order form
function validate() {
  let isValid = true;                                                         
  var firstName = document.getElementById('firstName');                       // get first name 
  var lastName = document.getElementById('lastName');                         // get last name 
  if (firstName.value.trim() === '') {                                        // if first name is empty
    firstName.classList.add('is-invalid');                                    // mark as invalid
    isValid = false;                                                          // set form as invalid
  } else {
    firstName.classList.remove('is-invalid');                                 // remove invalid mark if filled
  }

  if (lastName.value.trim() === '') {                                         // if last name is empty
    lastName.classList.add('is-invalid');                                     // mark as invalid
    isValid = false;                                                          // set form as invalid
  } else {
    lastName.classList.remove('is-invalid');                                  // remove invalid mark if filled
  }

  var email = document.getElementById('email');                               // get email
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;                               // email validation pattern
  if (email.value.trim() === '') {                                            // if email is empty
    email.classList.add('is-invalid');                                        // mark as invalid
    isValid = false;                                                          // set form as invalid
  } else if (!pattern.test(email.value)) {                                    // if email doesn't match pattern
    email.classList.add('is-invalid');                                        // mark as invalid
    isValid = false;                                                          // set form as invalid
  } else {
    email.classList.remove('is-invalid');                                     // remove invalid mark if correct
  }

  var address = document.getElementById('address');                           // get address field
  if (address.value.trim() === '') {                                          // if address is empty
    address.classList.add('is-invalid');                                      // mark as invalid
    isValid = false;                                                          // set form as invalid
  } else {
    address.classList.remove('is-invalid');                                   // remove invalid mark if filled
  }   

  var paymentMethod = document.getElementById('paymentMethod');               // get payment method field
  if (paymentMethod.value === '') {                                           // if no payment method selected
    paymentMethod.classList.add('is-invalid');                                // mark as invalid
    isValid = false;                                                          // set form as invalid
  } else {
    paymentMethod.classList.remove('is-invalid');                             // remove invalid mark if selected
  }

  return isValid;                                                             // return the validation result
}

// Event handler for submitting the order form
document.getElementById('orderForm').addEventListener('submit', function (event) {
  event.preventDefault();                                                     

  if (validate()) {                                                           // make sure validate function works
    const firstName = document.getElementById('firstName').value;             // get first name 
    const lastName = document.getElementById('lastName').value;               // get last name 
    const email = document.getElementById('email').value;                     // get email 
    const phone = document.getElementById('phone').value;                     // get phone 
    const address = document.getElementById('address').value;                 // get address 
    const paymentMethod = document.getElementById('paymentMethod').value;     // get payment method 
    
    fetch('/placeOrder', {                                                    // send data to server
      method: 'POST',                                                         // POST request method
      headers: {
        'Content-Type': 'application/json',                                   // set content type to JSON
      },
      body: JSON.stringify({ firstName, lastName, email, phone, address, paymentMethod }), // send form data
    })
      .then(response => response.json())                                      // convert response to JSON
      .then(data => {
        if (data.success) {
          dispCart([]);                                                       // clear the cart on client side
          document.getElementById('totalPrice').textContent = '0.00';         // reset total price to 0
          window.location.href = '/orderConfirmation';                        // redirect to order confirmation page
        } else {
          console.error('Error placing order:', data.error);                  // log error if order failed
        }
      })
      .catch(err => console.error('Error placing order:', err));              // catch any fetch errors
  }
});






