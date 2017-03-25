// -------------------------------------------------------------------------------------------------
// Module : Controller
// Author : Christoph Reif
// Date	  : 2017-03-09
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// DEBUG
// -------------------------------------------------------------------------------------------------

var DEBUG = false;

function debugConsole(text) {
	var console = document.getElementById("console");
	console.innerHTML = console.innerHTML + text + "<br/>";
}

// -------------------------------------------------------------------------------------------------
// INIT
// -------------------------------------------------------------------------------------------------

//
// initAirportsDataList 
//
function initAirportsDataList() {

	var airportsDataList = document.getElementById('airports-list');
	
	var addOption = function(airport) {
		
		var option = document.createElement('option');
		
		option.value = airport.name;
		airportsDataList.appendChild(option);
		
	};
		
	airports.forEach(addOption);
}

//
// init 
//
function init() {

	airports = parseAirports(airportsCsv); 	debugConsole("Initialized airports");
	
	initAirportsDataList();

	initMap(); 								debugConsole("Initialized map");
	
	items = []; 							debugConsole("Initialized model");
	
	itemsChangedFunc = function(item, itemChangedType) {
		updateList(items);
		updateMap(items, item, itemChangedType);
	};
}

//
// addFromTo
//
function addFromTo(addressFrom, addressTo, callOnResults) {

	// ---- SNIP -----------------------------------------------------
	
	var geocoderRequestFrom = {
		address: addressFrom
	};

	// ---- FROM -----
	
	geocoder.geocode(
		geocoderRequestFrom,
		function(resultsFrom, statusFrom) {
		
			if (statusFrom == "OK") {
	
				var resultFrom = resultsFrom[0];
		
				var geocoderRequestTo = {
					address : addressTo
				};

				// ---- TO ----
								
				geocoder.geocode(
					geocoderRequestTo,
					function(resultsTo, statusTo) {
					
						if (statusTo == "OK") {
						
							var resultTo = resultsTo[0];
							
							callOnResults(resultFrom, resultTo);
							
						} else {
							if (status == "ZERO_RESULTS") {
								debugConsole("Address '" + harbourAddressTo + "' not found.");
							}
						}
					}
				);
	
			} else {
				if (status == "ZERO_RESULTS") {
					debugConsole("Address '" + harbourAddressFrom + "' not found.");
				}
			}
		}
	);
}

//
// addFromToOnRoad
//
function addFromToOnRoad(addressFrom, addressTo, addressOver) {


	function addressFound(status) {
		return status == "OK";
	}
	
	function takeFirstResult(results) {
		return results[0];
	}
	

	function getLocation(addresses, getRouteFunc) {
	
		var foo = {
			address: addresses.addressOver
		};
	
		geocoder.geocode(
			foo,
			function(results, status) {
			
				if (addressFound(status)) {
				
					var firstResult = takeFirstResult(results);
					
					var wayPoints = createWayPoints(firstResult);
					
					getRouteFunc(addresses, wayPoints);
					
				}
			}
			
		)
				
	}

	function createWayPoints(addressResult) {

		var wayPoints = [];
		
		var wayPoint = {
        	location : addressResult.geometry.location,
        	stopover : true
    	}

    	wayPoints.push(wayPoint);
    	
    	return wayPoints;
    }
 /*   
    function debugRoute(route) {
    
		for (var i = 0; i < route.legs.length; i++) {
		
			var text = "";
		
			var routeSegment = i + 1;
			text += '<b>Route Segment: ' + routeSegment + '</b><br>';
			text += route.legs[i].start_address + ' to ';
			text += route.legs[i].end_address + '<br>';
			text += route.legs[i].distance.text + '<br><br>';
			
			debugConsole(text);
		}
    }
   */ 
/*
    function createRouteItem(response) {
    
    	// Create Item with response
		// add this route to display
			
		directionsDisplay.setDirections(response);
			
		var route = response.routes[0];
			
		debugRoute(route);
					
    }
 */   
    function getRoute(addresses, wayPoints) {
    
		directionsService.route(
			{
				origin		: addresses.addressFrom,
				destination	: addresses.addressTo,
				waypoints	: wayPoints,
				optimizeWaypoints : true,
				travelMode	: google.maps.TravelMode.DRIVING
			}, 
			function(response, status) {
	
				if (status === google.maps.DirectionsStatus.OK) {
			
					var firstRoute = response.routes[0];
					

				} else {
					debugConsole('Directions request failed due to ' + status);
				}
			}
		);
  	}
  	
  	var addresses = {
  		addressFrom : addressFrom, 
  		addressTo 	: addressTo, 
  		addressOver : addressOver, 
  	};
  	
  	getLocation(addresses, getRoute);
    
}

// -------------------------------------------------------------------------------------------------
// COMMANDS 
// -------------------------------------------------------------------------------------------------

//
// addFlight
//
function addFlight() {
	
	var airportNameFrom = document.getElementById("airportFromTextBox").value;
	var airportNameTo   = document.getElementById("airportToTextBox"  ).value;
	
	function callOnResults(resultFrom, resultTo) {
	
		var item = createFlightItem(resultFrom, resultTo);
		addItem(item);

		debugConsole("Add flight from " + airportNameFrom + " to " + airportNameTo);
	}
	
	addFromTo(airportNameFrom, airportNameTo, callOnResults);
}

//
// addShip
//
function addShip() {
	
	var harbourAddressFrom = document.getElementById("harbourFromTextBox").value;
	var harbourAddressTo   = document.getElementById("harbourToTextBox"  ).value;
	
	function callOnResults(resultFrom, resultTo) {
	
		var item = createShipItem(resultFrom, resultTo);
		addItem(item);

		debugConsole("Add ship from " + harbourAddressFrom + " to " + harbourAddressTo);
	}
	
	addFromTo(harbourAddressFrom, harbourAddressTo, callOnResults);
}

//
// addRoad
//
function addRoad() {

	function getSelectedSubType() {

		var subtypes = document.getElementsByName('subtype');
		var subtype;

		for (var i = 0; i < subtypes.length; i++){
			if (subtypes[i].checked) {
				subtype = subtypes[i].value;
			}
		}
	
		switch (subtype) {
			case "car"  : return ITEM_SUB_TYPE.CAR;
			case "bus"  : return ITEM_SUB_TYPE.BUS;
			case "train": return ITEM_SUB_TYPE.TRAIN;
		}
	
	}
	
	var roadAddressFrom = document.getElementById("roadFromTextBox").value;
	var roadAddressTo   = document.getElementById("roadToTextBox"  ).value;
	
	function callOnResults(resultFrom, resultTo) {
	
		var item = createCarBusTrainItem(resultFrom, resultTo, getSelectedSubType());
		addItem(item);

		debugConsole("Add car/bus/train from " + roadAddressFrom + " to " + roadAddressTo);
	}
	
	addFromTo(roadAddressFrom, roadAddressTo, callOnResults);
	
}

//
// addRoadtest
//
function addRoadTest() {

	var roadAddressFrom   = document.getElementById("roadTestFromTextBox").value;
	var roadAddressTo     = document.getElementById("roadTestToTextBox"  ).value;
	var roadAddressOver   = document.getElementById("roadTestOverTextBox").value;
	
	addFromToOnRoad(roadAddressFrom, roadAddressTo, roadAddressOver);
	
}

//
// addLocation 
//
function addLocation() {
  
    var addressName = document.getElementById("positionAddress").value;
	
	var foo = {
		address: addressName
	};
	
    geocoder.geocode( 
		foo,
		function(results, status) {
      
			if (status == "OK") {
			
				var result = results[0];
			
				var position = result.geometry.location;
		
				var item = createLocationItem(position, result);
				
				addItem(item);
				
				debugConsole("Add position for " + addressName);
				
			} else {
				if (status == "ZERO_RESULTS") {
					debugConsole("Address '" + addressName + "' not found.");
				}
			}
		}
	);
}

//
// showHideList
//
function toggleList() {
	showHideList();
}






