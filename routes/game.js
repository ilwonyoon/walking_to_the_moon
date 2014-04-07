var https = require('https');
var qs = require('querystring');
var Shakes = require('../lib/shakes');
var nconf = require('nconf');
var moment = require('moment');
var now = require('../config/now');
var today = require('../config/today');
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
var expires = 365 * 24 * 3600000; // 2 weeks

exports.startgame = function(req, res) {
    console.log("start game");

    res.render('game.ejs', {

        steps: req.user.totalMoves.steps,

    });

}