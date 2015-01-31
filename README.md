Walkingto the Moon
====================
###ExpressJS w/ Passport Facebook + Moves.API
For Moves API authentication, [shakes](https://github.com/jonezy/shakes) library for Node.js is used here.
To connect Moves API, you need to create an app from [https://dev.moves-app.com/](Moves API Dev)
**alert** Once you created an app, you need to provide valid url for your project and redirect url
For instance, 

* url : http://localhost:3000
* redirect url : http://localhost:3000/auth/token

Don't forget to include  "**http://**" in your url, otherwise it will say that it's not valid url.


#### Pacakge.json

The **package.json** file defines the name of our NodeJS app and any dependencies that are needed.

    {
        "name": "walking-to-the-moon",
        "main": "app.js",
        "dependencies": {
            "express": "~3.4.4",
            "ejs": "~0.8.5",
            "mongoose": "~3.8.1",
            "passport": "~0.1.17",
            "passport-local": "~0.1.6",
            "passport-facebook": "~1.0.2",
            "passport-twitter": "~1.0.2",
            "passport-google-oauth": "~0.1.5",
            "connect-flash": "~0.1.1",
            "bcrypt-nodejs": "~0.0.3",
            "node-oauth": ">= 0.1.3",
            "mocha": "~1.11.0",
            "underscore": "~1.4.4",
            "moment": "~2.0.0",
            "nconf": ">= 0.6.7",
            "connect-mongo": "0.3.x"
        }
    }
    
* [mongoose](http://mongoosejs.com/)  : mongodb object modeling for node.js
* [passport](http://passportjs.org/)  : Passport is authentication middleware for Node.js
* [connect-flash](https://github.com/jaredhanson/connect-flash) : The flash is a special area of the session used for storing messages.
* [bcrypt-nodejs](https://github.com/shaneGirish/bcrypt-nodejs) : validate the password and hash it w/ bcrypt
* [node-oauth](https://github.com/ciaranj/node-oauth) : A simple oauth API for Node.js
* [underscore](http://underscorejs.org/) : functional programming helper w/o extending any built-in objects.
* [moment](http://momentjs.com/)  : javascript date library for parsing, validating, manipulating and forming dates.
* [nconf](https://github.com/flatiron/nconf) : node.js configuration with files, environment variables, command-line arguments, and atomic object merging
* [connect-mongo](https://github.com/kcbanner/connect-mongo) : MongoDB session store for Express/Connect
