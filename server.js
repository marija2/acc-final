const Datastore = require ( 'nedb' );
const myDB = new Datastore ( 'database.db' );

var express = require ( 'express' );

var app = express();

var port = process.env.PORT || 3000;
var server = app.listen ( port );

app.use ( express.static ( 'public' ) );            // use files in public folder

var socket = require ( 'socket.io' );

var io = socket ( server );      

myDB.loadDatabase( function ( err ) {
    io.sockets.on ( 'connection', newConnection );
});

function newConnection ( socket ) {
    
    // send all data
    myDB.find ( {}, function ( err, docs ) {
        socket.emit ( 'heresData', docs );
    });

    // if anybody added a new pin, send new pin data to everyone else annd instert it into the db
    socket.on ( 'newPin', function ( data ) {
        myDB.insert ( data );
        socket.broadcast.emit ( 'newPin', data );
    });
}