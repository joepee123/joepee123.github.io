var map, infoWindow, nearbyVenues, clientID, clientSecret, radius, userCoords, FOOD_ID, COFFEE_ID, url, userMarker, maxVenues, categoryID;
var markers = new Array();
FOOD_ID = '4d4b7105d754a06374d81259';
COFFEE_ID = '4bf58dd8d48988d1e0931735';
JUICE_ID = '4bf58dd8d48988d112941735';
VEG_ID = '4bf58dd8d48988d1d3941735';
$("#configForm").submit(function (e) {
    e.preventDefault();
});
$('#configForm').submit(getVenues);
$('.unhungry').on('click', function () {
    location.href = "main.html";
});


//This function is called when the google maps script is loaded from index.html
function initMap() {
    //creates the map object
    map = new google.maps.Map(document.getElementById('map'), {
        //Set starting point of map
        center: {
            lat: 52.37757470592022,
            lng: 4.90163840353489
        },
        zoom: 18
    });


    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        //the below method takes in the parameters (successMethod, failMethod)
        navigator.geolocation.getCurrentPosition(loadUserLocation, function () {
            //error getting location
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

//Show current location of the user
function loadUserLocation(position) {
    userCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };

    //Place little blue dot marker to show user's location
    userMarker = new google.maps.Marker({
        position: userCoords,
        icon: 'blueLocation.png',
        map: map
    });

    infoWindow = new google.maps.InfoWindow;
    google.maps.event.addListener(userMarker, 'click', (function (marker) {
        return function () {
            infoWindow.setContent('You are here!');
            infoWindow.open(map, userMarker);
            map.panTo(userCoords);
        }
    })(userMarker)); //TODO figure out what this does... Make this a seperate function like you did with other markers

    map.setCenter(userCoords);
    infoWindow.setContent('You are here!');
    infoWindow.open(map, userMarker);

    getVenues(); //Load closest venues
}

function showUserLocation(marker) {
    infoWindow.setContent('You are here!');
    infoWindow.open(map, userMarker);
    map.panTo(userCoords);
}


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

//This functions gets the requested number of nearest food stalls
function getVenues() {
    $('#results-list').empty();
    //Create request for 10 nearest places, based on current location TODO let user enter how many locations
    var request = new XMLHttpRequest();
    url = getURL();
    console.log('url: ' + url);
    request.open('GET', url, true);

    // Send request
    request.send();

    request.onload = function () {

        // Begin accessing JSON data here
        var venues = JSON.parse(this.response).response.venues;
        console.log(venues);
        console.log(venues.length);

        //If response is OK, call method to show venue markers on map
        if (request.status >= 200 && request.status < 400) {
            if (venues.length > 0) {
                //Pass the response data to a method that places the venues on a map
                showVenueMarkers(venues);
            } else {
                $('#results-list').append(
                    $('<li />')
                    .html('No results found! Try expanding the range or applying less filters.')
                );
            }

        } else {
            console.log('Error connecting to API, error code: ' + request.status);
        }
    }
}

function getURL() {

    radius = $('#radius').val();
    //If radius has been set by user, use that value
    if (radius) {
        $('#radius').attr('value', radius);
    }
    //Else set radius to default 100 metres
    else {
        $('#radius').attr('value', '100');
        radius = '100';
    }

    maxVenues = $('#maxVenues').val();
    if (maxVenues) {
        $('#maxVenues').attr('value', maxVenues);
    } else {
        $('#maxVenues').attr('value', '10');
        maxVenues = '10';
    }

    //Default URL has radius == 100, maxVenues == 10 and category == food (all food stores)
    url = 'https://api.foursquare.com/v2/venues/search?ll=' + userCoords.lat + ',' + userCoords.lng + '&client_id=' + config.clientID + '&client_secret=' + config.clientSecret + '&v=20180921&radius=' + radius + '&limit=' + maxVenues + '&openNow=1';

    categoryID = undefined;

    //Add any selected category filters
    if ($('#juiceChecked').prop('checked')) {
        console.log('Juice checked');
        (categoryID) ? categoryID += "," + JUICE_ID: categoryID = 'categoryId=' + JUICE_ID;
    }
    if ($('#coffeeChecked').prop('checked')) {
        console.log('Coffee checked');
        (categoryID) ? categoryID += "," + COFFEE_ID: categoryID = 'categoryId=' + COFFEE_ID;
    }
    if ($('#vegChecked').prop('checked')) {
        console.log('Veg checked');
        (categoryID) ? categoryID += "," + VEG_ID: categoryID = 'categoryId=' + VEG_ID;
    }
    //if food checked, or nothing checked
    if ($('#foodChecked').prop('checked') || !($('#juiceChecked').prop('checked') || $('#coffeeChecked').prop('checked') || $('#vegChecked').prop('checked'))) {
        categoryID = 'categoryId=' + FOOD_ID;
    }

    console.log(categoryID);
    url += '&' + categoryID;
    return url;
}

//Takes a list of venues and creates markers, placing them on the map
function showVenueMarkers(venues) {
    deleteMarkers();
    infoWindow = new google.maps.InfoWindow;
    var i, venue, letterID, bounds;
    for (i = 0; i < venues.length; i++) {
        letterID = String.fromCharCode("A".charCodeAt(0) + i);
        venue = venues[i];
        marker = new google.maps.Marker({
            position: {
                lat: venue.location.lat,
                lng: venue.location.lng
            },
            map: map,
            label: letterID
        });

        google.maps.event.addListener(marker, 'click', showMarkerInfo(marker, venue));

        addMarkerToList(venue, letterID, i);

        $('#listMarker' + i).on('click', showMarkerInfo(marker, venue));
        markers.push(marker);
    }

    fitMapToMarkers(markers);

    //cover loading hamburger image once function is complete
    $('#left-panel').css('background-color', 'powderblue');
}

//Make sure all markers are visible within the initial zoom level on map
function fitMapToMarkers(markers) {

    bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }

    map.fitBounds(bounds);

    //Make sure no markers are on the edge by zooming out one level
    map.setZoom(map.getZoom() - 1);

    //Set minimum zoom level
    if (map.getZoom() > 18) {
        map.setZoom(18);
    }

    map.setCenter(userCoords)
}

function addMarkerToList(venue, letterID, id) {
    //Add marker to results list
    $('#results-list').append(
        $('<li />')
        .attr('id', 'listMarker' + id)
        .html('<div class = "listVenue"><b><u>' + letterID + ': ' + venue.name + '</u></b><br>' + venue.categories[0].name + '<br>' + venue.location.address + '<br> Distance: ' + venue.location.distance + 'm</div>')
    );

}

//Get this working again for the lists
function showMarkerInfo(marker, venue) {
    console.log("showing marker info");
    return function () {
        infoWindow.setContent('<div><b>' + venue.name + '</b><br>' + venue.categories[0].name + '<br>' + venue.location.address + '<br> Distance: ' + venue.location.distance + 'm</div>');
        infoWindow.open(map, marker);
        map.panTo(marker.position);
    }
}

function deleteMarkers() {
    //Remove all elements from list of venues
    $('#results-list').empty();

    //Loop through all the markers on map and remove
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}