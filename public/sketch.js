
// token for mapbox map
var mapboxToken = "pk.eyJ1IjoibWFyaWphdHJpZmtvdmljIiwiYSI6ImNqd3djNjQyejAybmw0NG93emoxeGRmZWYifQ.Xh54TQijAjg1CDy6pvBInw";

var map;    // to hold the mapbox map
var mappa = new Mappa ( 'Mapbox', mapboxToken );      // get the mapbox map
var options = {
  lat: 40,
  lng: 0,
  zoom: 2,
  minZoom: 1,
  studio: true, 
  style: 'mapbox://styles/mapbox/traffic-night-v2',
};
var canvas;     // to hold the canvas

var pins = [];
var pos;

var newPinBubble;

var clickLabel;
var addPinLabel;
var deleteLabel;
var colorLabel;
var textLabel;
var textInput;
var pinBtn;
var closeBtn;

var socket;
var notificationBubble;

class NotificationBubble {

  constructor() {
    this.text = "";
    this.color = color ( 0, 0, 0 );
    this.timer = 0;
  }

  setFields ( text, color ) {
    this.text = text;
    this.color = color;
    this.timer = 5;
  }

  getTimer() { return this.timer; }

  decrementTimer() { this.timer--; }

  putOnMap () {

    if ( this.timer == 0 ) return;

    noStroke ();
    var bubbleColor = color ( this.color );
    bubbleColor.setAlpha ( 200 );
    fill ( bubbleColor );
    rect ( windowWidth - 310, windowHeight - 100, 290, 70, 20 );
    if ( bubbleColor.levels[0] + bubbleColor.levels[1] + bubbleColor.levels[2] >= 381 ) fill ( 0 );
    else fill ( 255 );
    textAlign ( CENTER, CENTER );
    text ( this.text, windowWidth - 300, windowHeight - 90, 270, 50 );
  }
};

class NewPinBubble {

  constructor ( ) {
    this.x = 0;
    this.y = 0;
    this.opened = false;
  }

  isOpen() { return this.opened; }

  getX() { return this.x; }

  getY() { return this.y; }

  draw() {

    if ( !this.opened ) return;

    pos = map.latLngToPixel ( this.x, this.y );
    noStroke();
    var bubbleColor = color ( 80, 80, 80 );
    bubbleColor.setAlpha ( 255 );
    fill ( bubbleColor );
    triangle ( pos.x, pos.y, pos.x - 10, pos.y - 20, pos.x + 10, pos.y - 20 );
    rect ( pos.x - 140, pos.y - 160, 280, 140, 20 );

    colorLabel.position ( pos.x - 125, pos.y - 155 );
    colorPicker.position ( pos.x + 50, pos.y - 148 );
    textLabel.position ( pos.x - 125, pos.y - 135 );
    textInput.position ( pos.x - 125, pos.y - 105 );
    pinBtn.position ( pos.x - 100, pos.y - 50 );
    closeBtn.position ( pos.x + 35, pos.y - 50 );
  }

  open ( x, y ) {

    colorLabel.removeClass ( 'hide' );
    colorPicker.removeClass ( 'hide' );
    textLabel.removeClass ( 'hide' );
    textInput.removeClass ( 'hide' );
    pinBtn.removeClass ( 'hide' );
    closeBtn.removeClass ( 'hide' );

    var latlng = map.fromPointToLatLng( x, y );
    this.x = latlng.lat;
    this.y = latlng.lng;
    this.opened = true;
    this.draw();
  }

  close() {

    colorLabel.addClass ( 'hide' );
    colorPicker.addClass ( 'hide' );
    textLabel.addClass ( 'hide' );
    textInput.addClass ( 'hide' );
    pinBtn.addClass ( 'hide' );
    closeBtn.addClass ( 'hide' );
    this.opened = false;
  }

};

class Pin {
  constructor ( lat, lng, color, text, id ) {

    this.lat = lat;
    this.lng = lng;
    this.color = color;
    this.text = text;
    this.isClicked = false; // true if pin was clicked
    this.id = id;
  }

  getID() { return this.id; }

  clicked() {

    pos = map.latLngToPixel( this.lat, this.lng );

    if ( dist ( pos.x, pos.y - map.zoom() * 5, mouseX, mouseY ) < 10 && !this.isClicked ) { this.isClicked = !this.isClicked; }
    if ( dist ( pos.x, pos.y - map.zoom() * 20, mouseX, mouseY ) < map.zoom() * 15 && this.isClicked ) { this.isClicked = !this.isClicked; }
  }

  putInfoOnMap() {

    var zoom = map.zoom();
    if ( map.zoom() > 7 ) zoom = 7;

    stroke ( 255 );
    line ( pos.x, pos.y, pos.x, pos.y - zoom * 5 );
    fill ( this.color );
    circle( pos.x, pos.y - zoom * 20, zoom * 30 );
    fill ( 0 );
    strokeWeight ( 2 );
    textAlign ( CENTER, CENTER );
    text ( this.text, pos.x - zoom * 10, pos.y - zoom * 30, zoom * 20, zoom * 20 );
    strokeWeight ( 1 );
  }

  putOnMap() {

    pos = map.latLngToPixel ( this.lat, this.lng );

    if ( this.isClicked ) { 
      this.putInfoOnMap();
      return;
    }
    
    strokeWeight ( 1 );
    stroke ( 255 );
    line ( pos.x, pos.y, pos.x, pos.y - map.zoom() * 5 );
    fill ( this.color );
    circle( pos.x, pos.y - map.zoom() * 5, map.zoom() * 2.5 );
  }

  delete() {

    pos = map.latLngToPixel( this.lat, this.lng );

    if ( dist ( pos.x, pos.y - map.zoom() * 5, mouseX, mouseY ) < 10 ) return true;
    return false;
  }

};

function  timeIt() {
  
  if ( notificationBubble.getTimer() > 0 ) notificationBubble.decrementTimer();
  else mapMoved();
}

function setup() {

  setInterval ( timeIt, 1000 );

  newPinBubble = new NewPinBubble();
  notificationBubble = new NotificationBubble();

  socket = io.connect ( 'https://acc-final.herokuapp.com' );
  //socket = io.connect ( 'http://localhost:3000' );

  socket.on ( 'heresData', function ( data ) {

    for ( var i = 0; i < data.length; ++i ) {
      pins.push ( new Pin ( data[i].lat, data[i].lng, data[i].color, data[i].text, data[i]._id ) );
    }
  });

  socket.on ( 'newPin', function ( data ) {

    pins.push ( new Pin ( data.lat, data.lng, data.color, data.text, data._id ) );
    mapMoved();
  });

  socket.on ( 'notify', function ( data ) {

    notificationBubble.setFields ( data.text, data.color );
    mapMoved();
  });

  socket.on ( 'deleted', function ( data ) {

    var found = false;
    for ( var i = 0; i < pins.length; ++i ) {

      if ( pins[i].getID() == data ) found = true;
      if ( found && i != pins.length - 1 ) pins[i] = pins[i + 1];
    }
    if ( found ) pins.pop();
    mapMoved();
  });

  clickLabel = createElement ( 'p', 'Click on a pin to read more about it' );
  clickLabel.position ( windowWidth - 250, 15 );
  clickLabel.addClass ( 'whiteLabel' );

  addPinLabel = createElement ( 'p', 'Double click on the map to add a pin' );
  addPinLabel.position ( windowWidth - 250, 45 );
  addPinLabel.addClass ( 'whiteLabel' );

  deleteLabel = createElement ( 'p', 'Put your mouse over a pin and press backspace to delete' );
  deleteLabel.position ( windowWidth - 250, 75 );
  deleteLabel.addClass ( 'whiteLabel' );

  canvas = createCanvas ( windowWidth, windowHeight );
  map = mappa.tileMap ( options );
  map.overlay ( canvas );
  map.onChange ( mapMoved );

  colorLabel = createElement ( 'p', 'Choose the color of your pin:' );
  colorLabel.addClass ( 'hide' );
  colorLabel.addClass ( 'whiteLabel' );

  colorPicker = createColorPicker ( "blue" );
  colorPicker.addClass ( 'hide' );

  textLabel = createElement ( 'p', 'Tell us about this place' );
  textLabel.addClass ( 'hide' );
  textLabel.addClass ( 'whiteLabel' );

  textInput = createElement ( 'textarea' );
  textInput.attribute ( "rows", "3" );
  textInput.attribute ( "cols", "32" );
  textInput.addClass ( 'hide' );

  pinBtn = createButton ( 'Pin' );
  pinBtn.addClass ( 'hide' );
  pinBtn.addClass ( 'btns' );
  pinBtn.mousePressed ( createNewPin );

  closeBtn = createButton ( 'Close' );
  closeBtn.addClass ( 'hide' );
  closeBtn.addClass ( 'btns' );
  closeBtn.mousePressed ( closeNewPinBubble );
}


function closeNewPinBubble() {

  newPinBubble.close();
  mapMoved();
}

function mapMoved () { 

  clear();
  for ( var i = 0; i < pins.length; ++i ) { pins[i].putOnMap(); }
  newPinBubble.draw();
  notificationBubble.putOnMap ();
}

function mousePressed () {
  // change status of pin if it is clicked
  if ( pins.length == 0 ) return;
  for ( var i = 0; i < pins.length; ++i ) { pins[i].clicked(); }
  mapMoved();
}

function doubleClicked() { newPinBubble.open ( mouseX, mouseY ); }

function createNewPin() {

  socket.emit ( 'newPin', { 
    lat: newPinBubble.getX(),  
    lng: newPinBubble.getY(),
    color: colorPicker.value(),
    text: textInput.value()
  });

  textInput.value ( '' );
  closeNewPinBubble();
}

function keyPressed() {
  
  if ( keyCode === BACKSPACE ) {
    
    for ( var i = 0; i < pins.length; ++i ){

      if ( pins[i].delete() ) {

        socket.emit ( 'deleted', pins[i].getID() );
        return;
      }
    }
  }
}
