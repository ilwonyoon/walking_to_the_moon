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
exports.profile = function(req, res) {
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

    if (today.date - req.user.todayMoves.date > 0) {
        //Get the last day left over data
        //if date is not up to date, go to otherday page to update
        console.log("You haven't logged in a while!Let's collect past data");
        res.redirect('/samedayUpdate');

    } else if (today.date == req.user.todayMoves.date) {
        //Get the samedayUpdate 
        console.log("same day-profile page.");
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
                    var wlkIndex = null;
                    var runIndex = null;
                    console.log("1.start update");

                    // Does data summary exist? if yes, get data.
                    if (data[0].summary !== null) {
                        for (var i = 0; i < data[0].summary.length; i++) {
                            if (data[0].summary[i].activity == 'wlk') {
                                console.log("2.get wlk index");
                                wlkIndex = i;
                            } else if (data[0].summary[i].activity == 'run') {
                                console.log("2.get run index");
                                wlkIndex = i;
                            }
                        }
                        if (wlkIndex !== null) {
                            console.log("3.get wlk data");
                            addDist += (data[0].summary[wlkIndex].distance - user.todayMoves.walkDist);
                            addSteps += (data[0].summary[wlkIndex].steps - user.todayMoves.walksteps);
                            user.todayMoves.walkDist = data[0].summary[wlkIndex].distance;
                            user.todayMoves.walksteps = data[0].summary[wlkIndex].steps;
                        }

                        if (runIndex !== null) {
                            console.log("3.get run data");
                            addDist += (data[0].summary[i].distance - user.todayMoves.walkDist);
                            addSteps += (data[0].summary[i].steps - user.todayMoves.walksteps);
                            user.todayMoves.runDist = data[0].summary[i].distance;
                            user.todayMoves.runSteps = data[0].summary[i].steps;
                        }

                        tDist = user.totalMoves.distance + addDist;
                        console.log("Total Dist : " + tSteps + " = current Total : " + user.totalMoves.steps + "  +  add : " + addSteps);
                        tSteps = user.totalMoves.steps + addSteps;
                        user.totalMoves.distance = tDist;
                        user.totalMoves.steps = tSteps;
                        user.save();
                        console.log("4.update completed");
                    }
                });
            }
            if (today.date !== user.todayMoves.date) {
                res.redirect('/pastdayUpdate');
            }
            //console.log(user);
        }); //User.findOne line

    }

    res.render('profile.ejs', {
        auth_url: auth_url,
        mobile_auth_url: mobile_auth_url,
        token: t,
        has_token: hasToken,
        user: req.user, // get the user out of session and pass to template
        distance: req.user.totalMoves.distance,
        steps: req.user.totalMoves.steps
    });

}

exports.samedayUpdate = function(req, res) {
    console.log("sameday Update Page.");
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
                console.log("update");
                if (data[0].summary !== null) {
                    for (var i = 0; i < data[0].summary.length; i++) {
                        if (data[0].summary[i].activity == 'wlk') {
                            addDist += (data[0].summary[i].distance - user.todayMoves.walkDist);
                            addSteps += (data[0].summary[i].steps - user.todayMoves.walksteps);
                            user.todayMoves.walkDist = data[0].summary[i].distance;
                            user.todayMoves.walksteps = data[0].summary[i].steps;

                        } else if (data[0].summary[i].activity == 'run') {
                            addDist += (data[0].summary[i].distance - user.todayMoves.walkDist);
                            addSteps += (data[0].summary[i].steps - user.todayMoves.walksteps);
                            user.todayMoves.runDist = data[0].summary[i].distance;
                            user.todayMoves.runSteps = data[0].summary[i].steps;
                        }
                        tDist = user.totalMoves.distance + addDist;
                        tSteps = user.totalMoves.steps + addSteps;
                        user.totalMoves.distance = tDist;
                        user.totalMoves.steps = tSteps;
                        user.save();
                        console.log("update completed");
                    }
                }
            });
        }
        if (today.date !== user.todayMoves.date) {
            res.redirect('/pastdayUpdate');
        }
        //console.log(user);
    });
}

exports.pastdayUpdate = function(req, res) {
    console.log("PastdayUpdate page");
    var filter = {
        "_id": req.user._id
    }
    var pastDate;
    User.findOne(filter, function(err, user) {
        if (err) console.error(err);
        else {
            pastDate = user.todayMoves.date + 1;
            moves.get('dailySummary', {
                date: pastDate
            }, req.cookies.m_token, function(data) {
                var tDist = 0;
                var addDist = 0;
                var addSteps = 0;
                var tSteps = 0;
                console.log("get past date data");
                for (var i = 0; i < data[0].summary.length; i++) {
                    if (data[0].summary[i].activity == 'wlk') {
                        addDist += (data[0].summary[i].distance);
                        addSteps += (data[0].summary[i].steps);
                        user.todayMoves.walkDist = data[0].summary[i].distance;
                        user.todayMoves.walksteps = data[0].summary[i].steps;

                    } else if (data[0].summary[i].activity == 'run') {
                        addDist += (data[0].summary[i].distance);
                        addSteps += (data[0].summary[i].steps);
                        user.todayMoves.runDist = data[0].summary[i].distance;
                        user.todayMoves.runSteps = data[0].summary[i].steps;
                    }
                    tDist = user.totalMoves.distance + addDist;
                    tSteps = user.totalMoves.steps + addSteps;
                    user.totalMoves.distance = tDist;
                    user.totalMoves.steps = tSteps;
                    user.save();
                }
            });
            user.todayMoves.date = pastDate;
            user.save();
            res.redirect('/profile');
        }
    });

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