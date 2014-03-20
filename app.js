// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
var mongoose = require('mongoose');
var mongoStore = require('connect-mongo')(express);
var passport = require('passport');
var flash = require('connect-flash');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

app.configure(function() {

    // set up our express application
    app.use(express.logger('dev')); // log every request to the console
    app.use(express.cookieParser(process.env.COOKIEHASH)); // read cookies (needed for auth)
    app.use(express.bodyParser()); // get information from html forms

    app.set('view engine', 'ejs'); // set up ejs for templating

    // STORE SESSION IN MONGODB
    // mongoStore for session storage is using the connect-mongodb module
    app.use(express.session({
        store: new mongoStore({
            url: configDB.url
        }),
        maxAge: 300000,
        secret: "letswalkingtothemoon"
    }));

    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session

});

// routes ======================================================================
var routes = require('./routes/index');
var moves = require('./routes/moves');


app.get('/', routes.index);
app.get('/login', routes.login);
app.post('/login', routes.login_post);
app.get('/signup', routes.signup);
app.post('/signup', routes.signup_post);
// app.get('/profile', isLoggedIn, function(req, res) {
//     res.render('profile.ejs', {
//         user: req.user // get the user out of session and pass to template
//     });
// });

app.get('/profile', isLoggedIn, routes.allprofile);
app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: 'email'
}));
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/'
    }));
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
//Deal with all moves file authentication and data communication
//app.get('/moves/auth', isLoggedIn, routes.moves_auth);
app.get('/moves/auth/token', isLoggedIn, moves.token);
app.get('/moves/auth/token_info', moves.token_info);
app.get('/moves/auth/refresh_token', moves.refresh_token);
app.get('/moves/profile', moves.moves_profile);
app.get('/moves/summary/daily/:date?', moves.dailySummary);
app.get('/moves/summary/weekly/:date?', moves.weeklySummary);
app.get('/moves/summary/monthly/:date?', moves.monthlySummary);
app.get('/moves/activity/daily/:date?', moves.dailyActivity);
app.get('/moves/activity/weekly/:date?', moves.weeklyActivity);
app.get('/moves/places/daily/:date?', moves.dailyPlaces);
app.get('/moves/places/weekly/:date?', moves.weeklyPlaces);
app.get('/moves/storyline/daily/:date?', moves.dailyStoryline);
app.get('/moves/storyline/weekly/:date?', moves.weeklyStoryline);
// route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect('/');
}



// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);