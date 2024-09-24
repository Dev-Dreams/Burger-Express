function addToCart(productId, productName, productPrice) {
  // check if all parameters are provided correctly
  if (!productId || !productName || isNaN(productPrice)) {    
    return;                                                   // exit if any data is invalid
  }

  // create an object for the new product
  const product = {
    productId: productId,                                     // product Id
    productName: productName,                                 // product name
    productPrice: parseFloat(productPrice),                   // convert price to a number
    quantity: 1,                                              // set quantity to 1
  };  

  // send product data to the server to update the cart
  fetch('/addToCart', {
    method: 'POST',                                           // use POST method to send data
    headers: {
      'Content-Type': 'application/json',                     // data is in JSON format
    },
    body: JSON.stringify(product),                            // convert product object to JSON and send it
  })
  .then(response => response.json())                          // convert server response to JSON
  .then(data => {    
    updCartCount();                                           // update the cart item count on the client side
  })
  .catch(error => {
    console.error('Error updating cart:', error);             // log error if the update fails
  });
}
