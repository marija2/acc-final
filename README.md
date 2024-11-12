# acc-final
Final Project for Advanced Creative Coding Spring 21

<img width="1205" alt="Screen Shot 2021-04-25 at 2 32 12 PM" src="https://github.com/user-attachments/assets/63a190fd-7311-4410-91f5-4b28a9c29d17">

This application supports adding pins to a map in order to mark places that are important to you. You will be able to see all of the pins that anybody has ever added to the map. You can also delete pins if you like. If somebody else adds a pin to the map while you are looking at the map, you will be notified.

## How to use this application:

There are three main functionalities that this application supports:

###### 1. Viewing the text attached to each pin

    In order to see the text for each pin, simply click on a pin for which you 
    want to get more information. The pin will get larger and you will be able 
    to see the text associated to that pin.

###### 2. Adding a new pin

    In order to add a pin of your own, double click on the spot on the map where 
    you would like to place your pin. You will see a new bubble pop up. Choose 
    the color of your pin and tell us why you are pinning that place. Now click 
    the "Pin" button. You will see your new pin on the map. If at any point you 
    decide you do not what to proceed with pinning the place, click the "Close"
    button.

###### 3. Deleting a pin

    In order to delete a pin, place your mouse over the pin you want to delete 
    and press the backspace button. The pin will be deleted and will disappear 
    from the map.

## Keep in mind:

Everyone can see the pins that you add. If you delete a pin, it will be 
deleted from the database, therefore, nobody else will be able to see it 
any more.

## How this application was implemented:

This application uses node.js to run the server code. Additionally, the "express" 
and "socket.io" npm packages were used to enable the client code to communicate 
with the server code. Lastly, the "nedb" npm package was used to create and maintain
a database which stores the pins on the map. A MapBox map was used for the front end.
