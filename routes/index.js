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
var expires = 14 * 24 * 3600000; // 2 weeks

var getDate = function() {
    today = new Date();
    var dd = today.getDate().toString();

    //getMonth() only returns 0-12, but we need 01,02...12 for data format
    var mm = today.getMonth() + 1; //January is 0!
    if (mm < 9) {
        mm = mm.toString();
        var add_zero = "0";
        mm = add_zero.concat(mm);
    } else {
        mm.toString();

    }
    var yyyy = today.getFullYear().toString();
    var today = Number(yyyy.concat(mm, dd));
    return today;
}

var getTime = function() {
    var currentdate = new Date();
    var hour = currentdate.getHours().toString();
    var minute = currentdate.getMinutes().toString();
    var currentTime = Number(hour.concat(minute));
    return currentTime;

}

exports.index = function(req, res) {
    res.render('index.ejs'); // load the index.ejs file
}

exports.login = function(req, res) {
    // render the page and pass in any flash data if it exists
    console.log("LOG IN PAGE");
    res.render('login.ejs', {
        message: req.flash('loginMessage')
    });
}

exports.login_post = function(req, res) {
    console.log("LOG IN POST PAGE");
    passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    });

}
exports.signup = function(req, res) {
    console.log("SIGN UP PAGE");
    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', {
        message: req.flash('signupMessage')
    });
}
exports.signup_post = function(req, res) {
    console.log("SIGN UP POST PAGE");

    passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    });

}
exports.profile = function(req, res) {
    console.log("profile page");
    var moves = new Shakes(shakesOpts);
    var auth_url = moves.authorize({
        'scope': 'activity location'
    });
    var mobile_auth_url = moves.authorize({
        'scope': 'activity location',
        'urlScheme': 'mobile',
        'redirect_uri': 'http://192.168.1.129:5000/moves/auth/token'
    });
    var t,
        hasToken = false;
    //If user doesn't have a token for Moves, redirect to Moves Auth page
    if (!req.cookies.m_token || req.cookies.m_token === 'undefined') {
        res.redirect(auth_url);
        //if user has a token for Moves, update the data.    
    } else {
        t = req.cookies.m_token;
        hasToken = true;
        console.log(req.user.todayMoves.date);
        console.log();
        if (today.date - req.user.todayMoves.date > 0) {
            //Get the last day left over data
            console.log("You haven't logged in a while! Let's collect past data");
            res.redirect('/leftoverUpdate');

        } else if (today.date == req.user.todayMoves.date) {
            //Get the samedayUpdate 
            console.log("same day update page.");
            var filter = {
                "_id": req.user._id
            }
            User.findOne(filter, function(err, user) {
                if (err) console.error(err);
                else {
                    //Let's get first data update
                    moves.get('dailySummary', {
                        date: user.todayMoves.date
                    }, req.cookies.m_token, function(data) {
                        var tDist = 0;
                        var addDist = 0;
                        var addSteps = 0;
                        var tSteps = 0;
                        var wlkIndex = 0;
                        var runIndex = 2;
                        console.log("1.start update :" + user.todayMoves.date);

                        // Does data summary exist? if yes, get data.
                        if (data[0].summary !== null) {

                            console.log("3.get wlk data");
                            addDist += (data[0].summary[wlkIndex].distance - user.todayMoves.walkDist);
                            addSteps += (data[0].summary[wlkIndex].steps - user.todayMoves.walksteps);
                            console.log("addSteps : " + addSteps);
                            user.todayMoves.walkDist = data[0].summary[wlkIndex].distance;
                            user.todayMoves.walksteps = data[0].summary[wlkIndex].steps;

                            if (data[0].summary[runIndex] !== undefined && data[0].summary[runIndex] !== null) {
                                console.log("3.get run data");
                                addDist += (data[0].summary[runIndex].distance - user.todayMoves.runDist);
                                addSteps += (data[0].summary[runIndex].steps - user.todayMoves.runSteps);
                                console.log("addSteps : " + addSteps);
                                user.todayMoves.runDist = data[0].summary[runIndex].distance;
                                user.todayMoves.runSteps = data[0].summary[runIndex].steps;
                            }

                            tDist = user.totalMoves.distance + addDist;
                            if (addDist == 0 || addSteps == 0) {
                                console.log("(:)Data is up to date.");
                            } else {
                                console.log("Total Dist : " + tDist + " = current Total : " + user.totalMoves.distance + "  +  add : " + addDist);
                            }
                            tSteps = user.totalMoves.steps + addSteps;
                            user.totalMoves.distance = tDist;
                            user.totalMoves.steps = tSteps;
                            user.save();
                            console.log("4.leftover_update completed");
                        }
                    });
                }
            }); //User.findOne line
        }
    }



    res.render('profile.ejs', {
        auth_url: auth_url,
        mobile_auth_url: mobile_auth_url,
        token: t,
        has_token: hasToken,
        user: req.user, // get the user out of session and pass to template
        distance: req.user.totalMoves.distance * 0.001,
        steps: req.user.totalMoves.steps,
        lastUpdatedDate: today.date,
        lastUpdatedTime: now.time
    });

}

exports.leftoverUpdate = function(req, res) {
    //Get the samedayUpdate 
    console.log("1.start update_leftover");
    var filter = {
        "_id": req.user._id
    }


    User.findOne(filter, function(err, user) {
        if (err) console.error(err);
        else {

            //Let's get first data update
            moves.get('dailySummary', {
                date: user.todayMoves.date
            }, req.cookies.m_token, function(data) {
                console.log("Start Updating_leftover : " + user.todayMoves.date);
                var tDist = 0;
                var addDist = 0;
                var addSteps = 0;
                var tSteps = 0;
                var wlk = 0;
                var run = 2;
                var from = user.todayMoves.date + 1;
                var to = today.date;
                console.log("Let's see what leftover data is : " + JSON.stringify(data[0]));

                // Does data summary exist? if yes, get data.
                if (data[0].summary !== null) {

                    console.log("2.get wlk data_leftover");
                    addDist += Math.abs(data[0].summary[wlk].distance - user.todayMoves.walkDist);
                    console.log("cDist_wlk : " + data[0].summary[wlk].distance + " pDist_wlk :" +
                        user.todayMoves.walkDist + "addDist_wlk:" + addDist);
                    addSteps += Math.abs(data[0].summary[wlk].steps - user.todayMoves.walksteps);
                    user.todayMoves.walkDist = data[0].summary[wlk].distance;
                    user.todayMoves.walksteps = data[0].summary[wlk].steps;

                    if (data[0].summary[run] !== undefined) {
                        console.log("2.get run data_leftover");
                        addDist += Math.abs(data[0].summary[run].distance - user.todayMoves.runDist);
                        console.log("cDist_run : " + data[0].summary[run].distance + " pDist_run :" + user.todayMoves.runDist + "addDist_run:" + addDist);
                        addSteps += Math.abs(data[0].summary[run].steps - user.todayMoves.runSteps);
                        user.todayMoves.runDist = data[0].summary[run].distance;
                        user.todayMoves.runSteps = data[0].summary[run].steps;
                    }
                    console.log("addDist is : " + addDist + " / " + "addSteps is : " + addSteps);
                    var d = user.todayMoves.date + 1;
                    user.todayMoves.date = d;
                    tDist = user.totalMoves.distance + addDist;
                    //console.log("Total Dist : " + tSteps + " = current Total : " + user.totalMoves.steps + "  +  add : " + addSteps);
                    tSteps = user.totalMoves.steps + addSteps;
                    user.totalMoves.distance = tDist;
                    user.totalMoves.steps = tSteps;
                    user.save();
                    console.log("4.update completed_leftover");


                }
                if (today.date !== user.todayMoves.date) {
                    console.log("complete update last date data. Now update from last day+1 to today");
                    res.redirect('/moves/summary/rangefrom=' + from + '&to=' + to + '');
                } else if (today.date == user.todayMoves.date) {
                    console.log('data is up to date. Go to profile');
                    res.redirect('/profile');
                }
            }); //moves.get()

        }
        //res.send(JSON.stringify(user));
    }); //User.findOne line

}

//moves_auth page should be in the same page with profile
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