//script for managing the carousel and showing random photos
//make sure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function () {
  //script gets a link to the carousel element
  var cElement = document.getElementById('carouselExampleIndicators');
  // script retrieves all carousel elements
  var cItems = document.querySelectorAll('.carousel-item');
  //count  the total number of carousel elements
  var total = cItems.length;
  var chIndexes = [];

  //all carousel items are reset to an inactive state so that active items can be reassigned without conflicting with previous states
  cItems.forEach((item) => item.classList.remove('active'));

  // an array is created to store the indexes of the elements that will be shown
  while (chIndexes.length < 3) {
    const randIndex = Math.floor(Math.random() * total);
    if (!chIndexes.includes(randIndex)) {
      chIndexes.push(randIndex);
    }
  }

  //script clears current indicators and elements inside the carousel
  var cInner = document.querySelector('.carousel-inner');
  var indicators = document.querySelector('.carousel-indicators');
  cInner.innerHTML = '';
  indicators.innerHTML = '';

  //script сreates new carousel elements and indicators
  chIndexes.forEach((index, i) => {
    // add new carousel element
    var newItem = document.createElement('div');
    newItem.className = 'carousel-item' + (i === 0 ? ' active' : '');
    newItem.innerHTML = `<img src="/images/carousel${
      index + 1
    }.jpg" class="d-block w-100" alt="Slide ${index + 1}">`;
    cInner.appendChild(newItem);

    // add new indicator for each carousel item
    var newI = document.createElement('button');
    newI.setAttribute('type', 'button');
    newI.setAttribute('data-bs-target', '#carouselExampleIndicators');
    newI.setAttribute('data-bs-slide-to', i);
    newI.className = i === 0 ? 'active' : '';
    newI.setAttribute('aria-current', i === 0 ? 'true' : '');
    newI.setAttribute('aria-label', `Slide ${i + 1}`);
    indicators.appendChild(newI);
  });

  
  var myCarousel = new bootstrap.Carousel(cElement, {                     // reinitialize carousel with new settings
    interval: 2000,
    wrap: true,
  });
});
