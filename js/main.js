
'use strict';

let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
  skipMap();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoibWhpenRlcnBhdWwiLCJhIjoiY2puZTdwaW44MGswaTN2bnl5bzJ2NHo3aCJ9.6CoiKcYQ8c9xxZXjj6x6CA',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}


/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} restaurant`;
  li.append(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.append(name);
  li.setAttribute('aria-label', restaurant.name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `view more details on ${restaurant.name} restaurant`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

//register service worker
(function regServiceWorker(){
  //if browser doesn't support service worker return;
  if (!navigator.serviceWorker) return;
  // register a service worker 
  navigator.serviceWorker.register('sw.js').then((reg) => {
    //if there is no active service worker return
    if (!navigator.serviceWorker.controller) return;

    //check to see if the newly registered service worker is ready
    //if new service worker is waiting handle it appropraitely
    if (reg.waiting){
      updateServiceWorker(reg.waiting);
      return;
    }
    //if new service worker is installing then handle it appropraitely
    if (reg.installing){ 
      updateServiceWorker(reg.installing);
      return;
    }

    // if new service worker is yet to install 
    reg.addEventListener('updatefound', () => 
       updateServiceWorker(reg.installing)
       );
  });

    const updateServiceWorker = (sw) => {
      if(sw.state === 'installed'){
        sw.postMessage({updateServiceWorker: true});
        return;
      }
      sw.addEventListener('statechange', () => {
        if(sw.state === 'installed') 
          sw.postMessage({updateServiceWorker: true});
      });

    }

    //reload current window to activate service worker
  navigator.serviceWorker.addEventListener('controllerchange', () => 
    window.location.reload(false)
  );

})();

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 

//add skip link
const skipMap = () => {
   const skipLink = document.querySelector('.skip-link');
   const nextSection = document.querySelector('.filter-options');
   const map = document.getElementById('map');
   const removeskipLink = () => skipLink.classList.remove('prompt');

   skipLink.setAttribute('tabindex', '-1');
   nextSection.setAttribute('tabindex', '0');


   map.addEventListener('keydown', (e) => {
    if(document.activeElement !== map || e.shiftKey) return;
    if(e.keyCode === 9){
      skipLink.focus(); 
      e.preventDefault();
    }
   });
   skipLink.addEventListener('keydown', (e) => {
    if(e.keyCode === 32 || e.keyCode === 13){
        nextSection.focus();
        e.preventDefault();
      }
    });
   skipLink.addEventListener('focus', () => skipLink.classList.add('prompt'));
   skipLink.addEventListener('blur', () => removeskipLink());
   skipLink.addEventListener('click', () => nextSection.focus());
};
