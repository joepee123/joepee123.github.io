var map, infoWindow, nearbyVenues, clientID, clientSecret, radius, userCoords;
var markers = new Array();
$('#setRadius').on('click', getVenues);


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
        navigator.geolocation.getCurrentPosition(showLocation, function () {
            //error getting location
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

//Show current location of the user
function showLocation(position) {
    pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };

    //Place little blue dot marker to show user's location
    marker = new google.maps.Marker({
        position: pos,
        icon: 'location.png',
        map: map
    });
    userCoords = marker.position;

    infoWindow = new google.maps.InfoWindow;
    google.maps.event.addListener(marker, 'click', (function (marker) {
        return function () {
            infoWindow.setContent('You are here!');
            infoWindow.open(map, marker);
            map.panTo(userCoords);
        }
    })(marker)); //TODO figure out what this does... Make this a seperate function like you did with other markers

    map.setCenter(pos);
    getVenues(); //Load closest venues
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
    //Create request for 10 nearest places, based on current location TODO let user enter how many locations
    var request = new XMLHttpRequest();
    //This request: within specified radius (TODO let choose), open now, food-related (TODO let choose categories)
    radius = document.getElementById("radius").value;
    console.log('radius: ' + radius);
    request.open('GET', 'https://api.foursquare.com/v2/venues/search?ll=' + pos.lat + ',' + pos.lng + '&client_id=' + config.clientID + '&client_secret=' + config.clientSecret + '&v=20180921&categoryId=4d4b7105d754a06374d81259&radius=' + radius + '&limit=10&openNow=1', true);

    // Send request
    request.send();

    request.onload = function () {

        // Begin accessing JSON data here
        var venues = JSON.parse(this.response).response.venues;
        console.log(venues);

        //If response is OK, call method to show venue markers on map
        if (request.status >= 200 && request.status < 400) {
            //Pass the response data to a method that places the venues on a map
            showVenueMarkers(venues);
        } else {
            console.log('Error connecting to API, error code: ' + request.status);
        }
    }
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

        //Add marker to results list
        $('#results-list').append(
            $('<li />')
            .attr('id', 'listMarker' + i)
            //.attr('class', 'depot-result')
            .html('<b>' + letterID + '</b>: ' + venue.name)
        );

        $('#listMarker' + i).on('click', showMarkerInfo(marker, venue));

        markers.push(marker);
    }

    //Make sure all markers are visible within the initial zoom level on map
    bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }

    map.fitBounds(bounds);
    
    //Make sure no markers are on the edge by zooming out one level
    map.setZoom(map.getZoom()-1); 
    
    //Set minimum zoom level
    if(map.getZoom()> 18){
    map.setZoom(18);
}

}

function showMarkerInfo(marker, venue) {
    return function () {
        infoWindow.setContent(venue.name + ' Distance: ' + venue.location.distance + 'm');
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