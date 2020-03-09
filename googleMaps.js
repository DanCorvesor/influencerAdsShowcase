var map;
var geocoder = new google.maps.Geocoder();
var radiusCircle = null;
var marker = null;
//arrays that allow for accessing of relevant objects and info across functions
var markerReference = [];
var circleReference = [];
var infowindowReference = [];
var radiusReference = [];
var addressReference= [];
//this is going to be the JSON with radius, address and coords that will be
//written to the database
var locationoutputDetails = [];
var markercounter = 0;
//SET THIS TO BE SOMETHING - the max number of markers allowed
var markerlimit = 6;


initMap();
function initMap(){
//defines a new google map centred on my home address
var map = new google.maps.Map(document.getElementById('map-holder'), {
    center: {lat: 51.955080, lng: -0.550000},
    zoom: 13
});
//sets address input to top of map
  var popup = document.getElementById('popup');
  var counterbox = document.getElementById('locationCounter');
  map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(popup);
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(counterbox);
  var autocomplete = new google.maps.places.Autocomplete(userInput);
  document.getElementById('sbutton').addEventListener('click', function() {
    if (markercounter < markerlimit){
      geocodeAddress(geocoder,map);
    }
    else{
      alert('Too many markers added, please delete some old ones before you proceed')
    }
  });
  document.getElementById('mapsoutput').value = "[]";
  document.getElementById('locationCounter').innerHTML = markercounter;
  //listener for submitStep2 button
  document.getElementById('s2next').addEventListener('click',function(){
    //push info to body`
    for(var i = 0; i < markercounter ; i++){
      var entry={
        formatted_address: addressReference[i],
        coordinates: String(markerReference[i].position),
        radius: radiusReference[i]
      };
      locationoutputDetails.push(entry);
      console.log(addressReference[i] + " " + markerReference[i].position + " " + radiusReference[i]);
      };
      document.getElementById('mapsoutput').value = JSON.stringify(locationoutputDetails);
      document.getElementById('locationdone').value = true;
      console.log(locationoutputDetails);
  });
  //click on map to add marker
  map.addListener('click', function(e){
    if (markercounter < markerlimit){
      markerInit(e.latLng,map);
      geocodeLatLng(geocoder,map,markerReference[markerReference.length-1],e.latLng,false);
      var point = markerReference[markerReference.length-1].getPosition();
      map.panTo(point);
    }
    else{
      alert('Too many markers added, please delete some old ones before you proceed')
    }
  });

}
//pop-up function
function popUp() {
  var popup = document.getElementById("myPopup");
  popup.classList.toggle("show");
}
//geocode function takes the map and the geocoder and pushes the results to the html
function geocodeAddress(geocoder, resultsMap){
     var address = document.getElementById('userInput').value;
     infowindow = new google.maps.InfoWindow();
     geocoder.geocode({'address': address}, function(results, status) {
       if (status === 'OK') {
         //create marker
         markerInit(results[0].geometry.location,resultsMap);
         addressDetailer(results[0],markerReference.length-1,false);
         resultsMap.setCenter(results[0].geometry.location);
         infowindow.setContent(results[0].formatted_address);
         infowindow.open(resultsMap,markerReference[markerReference.length -1]);
         infowindowReference.push(infowindow);
       }
      else {
         window.alert('Geocoder failed due to: ' + status);
         remove
       };
     });
}
//reverse geocode function, similar to geocode function, takes a coordinate with
//an associated marker that has been moved or clicked in and returns the new address
function geocodeLatLng(geocoder, map, marker, latlng, update) {
    infowindow = new google.maps.InfoWindow();
    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === 'OK') {
        if (results[0]) {
          if(results[0].geometry.location_type == 'APPROXIMATE'){
            alert("Can't put a pin there, sorry");
            deleteMarker(marker.store_id, false);
          }
          else{
            addressDetailer(results[0],marker.store_id,update);
            infowindow.setContent(results[0].formatted_address);
            infowindow.open(map,markerReference[marker.store_id]);
            infowindowReference.push(infowindow);
          }
        } else {
          window.alert('No results found');
        }
      } else {
        window.alert('Geocoder failed due to: ' + status);
        deleteMarker(marker.store_id, false);
      }
    });
  }

//function that builds a circle with given radius
function circleInit(location,map){
  //gets the radius from the form and sets it to 0 if it's not there
   radiusCircle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: map,
      editable: true
    });
    if (document.getElementById('target_radius_in_miles').value != ""){
      radiusCircle.setRadius(document.getElementById('target_radius_in_miles').value *1609);
      radiusReference.push(document.getElementById('target_radius_in_miles').value);
    }
    else {
      radiusCircle.setRadius(1609);
      radiusReference.push(1);
    }
    //listener for the physical change of radius on the map
    google.maps.event.addListener(radiusCircle, 'radius_changed', function(){
      document.getElementById('radius-' + radiusCircle.store_id).value = Math.round(radiusCircle.radius/1609 * 10) / 10;
    });
    //give the circle a number so it can be accessed later in the array
    //this corresponds to the number of the associated marker
    radiusCircle.setValues({type:'point', store_id:markerReference.length-1});
    //add it to the array
    circleReference.push(radiusCircle);
    radiusCircle.bindTo('center',markerReference[markerReference.length-1],'position');

}
//function that adds a marker to the map
function markerInit(location,map){
  var marker = new google.maps.Marker({
    map: map,
    position: location,
    draggable : true,
    title : 'drag the fucker'
  });
  //add it to the array
  markerReference.push(marker);
  //circle of radius equal to amount of miles inputted
  circleInit(location, map);
  //give the marker a number so it can be acccessed later in the array
  marker.setValues({type:'point', store_id:markerReference.length-1});
  markercounter ++;
  document.getElementById('locationCounter').innerHTML = markercounter;
  var markerholder = markerReference[markerReference.length-1];
  //circle should disappear when you drag it
  google.maps.event.addListener(markerholder,'drag',function(){
    //ensuring we are removing correct circle
    var currid1 = markerholder.store_id;
    //circleReference[currid1].setMap(null);
  });
  //when drag is done, reload functions with new marker function
  google.maps.event.addListener(markerholder,'dragend',function(event){
    console.log(circleReference);
    circleReference[markerholder.store_id].setCenter = event.latLng;
    var currid2 = markerholder.store_id;
    //circleReference.splice(currid2,1);
    var point = markerReference[currid2].getPosition();
    map.panTo(point);
    geocodeLatLng(geocoder,map,markerholder,event.latLng,true);
    infowindowReference[markerholder.store_id].close();
    infowindowReference.splice([markerholder.store_id],1)
  });
  //double click and marker disappears
  google.maps.event.addListener(markerholder,'dblclick',function(){
    var currid3 = markerholder.store_id;
    deleteMarker(currid3, true);
  });
}
//function that gets an address and pushes it into the form
//also builds the box and radius editer on side of map for each address
function addressDetailer(address,markerno,update){
  if (update == false){
    //address to be outputted under the map
    var formatted_address = address.formatted_address;
    var address_components = address.address_components;
    //make the two outputs so it's in the nice list group form
    //this not currently used but can be outputted if needed
    var formatted_address_output = `<ul class = "list-group">
    <li class = "list-group-item">${formatted_address}</li>
    </ul>`;
    var address_components_output = '<ul class = "list-group">'
    for(var i = 0; i < address_components.length;i++){
      address_components_output += `
      <li class = "list-group-item"><strong>${address_components[i].types[0]}
      </strong> : ${address_components[i].long_name}</li>
      `;
    }
    address_components_output += '</ul>';
      //document.getElementById('output_comps').innerHTML = address_components_output;

    //update address
    addressReference[markerno] = formatted_address;

    //build a box that displays the address of the marker we have just added
    const flexrow = document.createElement('div');
    flexrow.setAttribute('id','flexrow');
    //flexrow.className = 'bigbox';
    flexrow.className = 'row d-inline-flex';
    //flexrow.style = 'align-items: center; display: flex;'
    //document.getElementById('addressboxes').innerHTML = flexrow;
    const addressBox = document.createElement('p');
    const editableRadius = document.createElement('input');
    editableRadius.type = 'number';
    editableRadius.className = 'box radiusbox';
    editableRadius.setAttribute('id', 'radius-' + markerno.toString());
    addressBox.className = 'box';
    addressBox.setAttribute('id', markerno.toString());

    if (document.getElementById('target_radius_in_miles').value != ""){
      editableRadius.value = document.getElementById('target_radius_in_miles').value;
    }
    else {
      editableRadius.value = 1;
    }
    // <button id = 'close-${markerno.toString()}' class = 'cross' onClick = "numberfromID(this.id)"><strong>x</strong></button>
    addressBox.innerHTML += `
      <div id = 'deets-${markerno.toString()}'>${formatted_address}<span class = close id = 'close-${markerno.toString()}' onClick = "numberfromID(this.id)"">x</span></div>
      `

    flexrow.innerHTML += `
    <div class = "col-xs-12 col-sm-10 col-md-10 col-lg-10" id = 'addresses-${markerno.toString()}'>
    </div>
    <div class = "col-xs-12 col-sm-2 col-md-2 col-lg-2" id = 'radiuses-${markerno.toString()}'>
    </div>`
    document.getElementById('addressboxes').appendChild(flexrow);
    document.getElementById(`addresses-${markerno.toString()}`).appendChild(addressBox);
    document.getElementById(`radiuses-${markerno.toString()}`).appendChild(editableRadius);
    //editableRadius.setAttribute('height', $('#'+markerno.toString()).height());
    //document.getElementById('radius-' + markerno.toString()).style.height = "30px";
    //document.getElementById(markerno.toString()).style.height = "30px";

    google.maps.event.addDomListener(
       document.getElementById('radius-' + markerno.toString()), 'change', function() {
       circleReference[markerno].setRadius(document.getElementById('radius-' + markerno.toString()).value*1609);
   });
  }
  else{
    //address to be outputted under the map
    var formatted_address = address.formatted_address;
    var address_components = address.address_components;
    //make the two outputs so it's in the nice list group form
    var formatted_address_output = `<ul class = "list-group">
    <li class = "list-group-item">${formatted_address}</li>
    </ul>`;
    var address_components_output = '<ul class = "list-group">'
    for(var i = 0; i < address_components.length;i++){
      address_components_output += `
      <li class = "list-group-item"><strong>${address_components[i].types[0]}
      </strong> : ${address_components[i].long_name}</li>
      `;
    }
    address_components_output += '</ul>';
    //update address
    addressReference[markerno] = formatted_address;
    document.getElementById('deets-' + markerno.toString()).innerHTML = formatted_address;
  }
}
//function that updates the position and store_ids of markers
function removeToken(array, markerpos){
  array.splice(markerpos,1);
  for (var i = markerpos; i < array.length; i++){
    //every marker after removed one needs to have store_id updated
    var oldid = array[i].store_id ;
    array[i].store_id--;
    //get correct box
    var stringy = 'close' + "-" + oldid.toString();
    var rstringy = 'radius' + "-" + oldid.toString();
    //update new id of close button and of box to match markers deleted
    var stringy2 = 'close' + "-" + array[i].store_id.toString();
    var rstringy2 = 'radius' + "-" + array[i].store_id.toString();
    document.getElementById(stringy).setAttribute('id',stringy2);
    document.getElementById(rstringy).setAttribute('id',rstringy2);
    document.getElementById(oldid).setAttribute('id',array[i].store_id);
  }
}
//helper function to sort get number from id of cross button
function numberfromID(id){
  var corrMarker = id.split("-")[1];
  deleteMarker(corrMarker ,true);
}
//function that deletes a boxes and corresponding markers when removed from the front end
function deleteMarker(corrMarker, boxes){
  if (boxes == true){
    //remove address box
    var elem = document.getElementById(corrMarker.toString());
    elem.remove();
    //remove radius box
    var elemRad = document.getElementById('radius-' + corrMarker.toString());
    elemRad.remove();
  }
  markercounter--;
  document.getElementById('locationCounter').innerHTML = markercounter;
  markerReference[corrMarker].setMap(null);
  circleReference[corrMarker].setMap(null);
  removeToken(markerReference,corrMarker);
  circleReference.splice(corrMarker,1);

}
//function that takes a marker id and updates it for new info after it's been dragged
function updateMarker(markerno,map){
  var marker = markerReference[markerno];
  var location = marker.center;
  geocodeLatLng(geocoder,map,marker,location,true);

}
