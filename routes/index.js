var https = require('https');
var qs = require('querystring');
var Shakes = require('../lib/shakes');
var nconf = require('nconf');
//Get User data and store moves info
var User = require('../app/models/user');

nconf.argv().env().file({
    file: 'settings.json'
});
var shakesOpts = {
    'client_id': nconf.get('client_id'),
    'client_secret': nconf.get('client_secret'),
    'redirect_uri': nconf.get('redirect_uri')
};

var moves = new Shakes(shakesOpts);
var expires = 14 * 24 * 3600000; // 2 weeks

exports.index = function(req, res) {
    res.render('index.ejs'); // load the index.ejs file
}

exports.login = function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('login.ejs', {
        message: req.flash('loginMessage')
    });
}

exports.login_post = function(req, res) {
    passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    });

}
exports.signup = function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', {
        message: req.flash('signupMessage')
    });
}
exports.signup_post = function(req, res) {
    passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    });

}
exports.allprofile = function(req, res) {
    var t,
        hasToken = false;
    if (req.cookies.m_token) {
        t = req.cookies.m_token;
        hasToken = true;
    }
    var moves = new Shakes(shakesOpts);
    var auth_url = moves.authorize({
        'scope': 'activity location'
    });
    var mobile_auth_url = moves.authorize({
        'scope': 'activity location',
        'urlScheme': 'mobile',
        'redirect_uri': 'http://192.168.1.129:5000/moves/auth/token'
    });

    res.render('profile.ejs', {
        auth_url: auth_url,
        mobile_auth_url: mobile_auth_url,
        token: t,
        has_token: hasToken,
        user: req.user // get the user out of session and pass to template

    });

}

//Moves API authorization
exports.moves_auth = function(req, res) {
    var t,
        hasToken = false;
    if (req.cookies.m_token) {
        t = req.cookies.m_token;
        hasToken = true;
    }

    var moves = new Shakes(shakesOpts);
    var auth_url = moves.authorize({
        'scope': 'activity location'
    });
    var mobile_auth_url = moves.authorize({
        'scope': 'activity location',
        'urlScheme': 'mobile',
        'redirect_uri': 'http://192.168.1.129:5000/moves/auth/token'
    });
    console.log(auth_url);
    res.render('moves_auth', {
        title: 'Shakes Example',
        auth_url: auth_url,
        mobile_auth_url: mobile_auth_url,
        token: t,
        has_token: hasToken
    });
};