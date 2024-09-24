// make sure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {  
  updCartCount();                                                        // call a function to update the counter of items in the cart  
  updLogin();                                                            // call a function to update the user's login status
});

// function to update the cart count
function updCartCount() {
 
  fetch('/cartData')                                                     // fetch cart data from the server
    .then(response => response.json())                                   // convert response to JSON
    .then(data => {
      // calculate the total number of items
      const total = data.cart.reduce((accumulator, item) => {        
        const quantity = parseInt(item.quantity, 10);                    // ensure quantity is a number
        return accumulator + (isNaN(quantity) ? 0 : quantity);           // add valid quantities
      }, 0);
      
      const cartCountElement = document.getElementById('cartCount');     // update the cart count in the navbar
      if (cartCountElement) {
        cartCountElement.textContent = total;                            // display total number of items
      } else {
        console.error('Cart count element not found');                   // log if element is missing
      }
    })
    .catch(error => {
      console.error('Error fetching cart data:', error);                 // log any errors
    });
}

// update the login status shown on the webpage
function updLogin() {
  
  fetch('/loginStatus')                                                  // fetch login status from the server
    .then(response => response.json())                                   // convert response to JSON
    .then(data => {
      var lgItem = document.getElementById('loginItem');                 // get login link
      var lgoutItem = document.getElementById('logoutItem');             // get logout link
      
      if (data.isLoggedIn) {
        // if the user is logged in, show "logout" and hide "login"
        lgoutItem.style.display = 'block';
        lgItem.style.display = 'none';
      } else {
        // if the user is not logged in, show "login" and hide "logout"
        lgoutItem.style.display = 'none';
        lgItem.style.display = 'block';
      }
    })
    .catch(error => {
      console.error('Error fetching login status:', error);              // log any errors
    });
}
