var https = require('https');
var qs = require('querystring');
var Shakes = require('../lib/shakes');
var nconf = require('nconf');
var moment = require('moment');
var today = require('../config/today');
//Get User data and store moves info
var User = require('../app/models/user');
var jsonQuery = require('json-query');

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
var sameday = false;
var index;

exports.token = function(req, res) {
    if (req.query.code) {
        moves.token(req.query.code, function(t) {
            console.log(t);
            res.clearCookie('m_token');
            res.clearCookie('m_rtoken');

            res.cookie('m_token', t.access_token, {
                maxAge: expires
            });
            res.cookie('m_rtoken', t.refresh_token, {
                maxAge: expires
            });
            var filter = {
                "_id": req.user._id
            }

            User.findOne(filter, function(err, user) {
                if (err) console.error(err);
                else {
                    user.firstDate = today.date;
                    user.initiate = false;
                    user.save();
                }
            });
            res.redirect('/moves/initData')

        });
    }
};

exports.initData = function(req, res) {
    console.log("########################");
    console.log("INIT DATA");
    console.log("########################");
    var filter = {
        "_id": req.user._id
    }
    var wlk = 0;
    var run = 2;

    User.findOne(filter, function(err, user) {
        if (err) console.error(err);
        else {
            if (user.initiate === false) {
                user.initiate = true;
                user.moveAuth = false;
                console.log("init all data for game");
                user.todayMoves.date = user.firstDate;
                //Let's get first data update
                moves.get('dailySummary', {
                    date: today.date
                }, req.cookies.m_token, function(data) {
                    var tDist = 0;
                    var tSteps = 0;
                    if (data[0].summary !== null) {
                        console.log("The date is :" + today.date);
                        console.log("Get wlk data");
                        user.todayMoves.walkDist = data[0].summary[wlk].distance;
                        user.todayMoves.walksteps = data[0].summary[wlk].steps;
                        if (data[0].summary[run] !== undefined) {
                            console.log("if there is run data, get run data");
                            user.todayMoves.runDist = data[0].summary[run].distance;
                            user.todayMoves.runSteps = data[0].summary[run].steps;
                            tDist = data[0].summary[wlk].distance + data[0].summary[run].distance;
                            tSteps = data[0].summary[wlk].steps + data[0].summary[run].steps
                        } else {
                            tDist = data[0].summary[wlk].distance;
                            tSteps = data[0].summary[wlk].steps;
                        }
                        console.log("INIT :  todayMoves == totalMoves");
                        console.log("total Dist :" + tDist + ", total Steps :" + tSteps);
                        tDist = data[0].summary[wlk].distance + data[0].summary[run].distance;
                        tSteps = data[0].summary[wlk].steps + data[0].summary[run].steps

                        user.firstDate = today.date;
                        user.totalMoves.distance = tDist;
                        user.totalMoves.steps = tSteps;
                        user.save();
                        console.log("init data completed");
                    }
                });
            }
        }
        console.log("re-direct to /profile");
        res.redirect('/profile');
        //res.send(JSON.stringify(user));
    });
}



exports.resetmodel = function(req, res) {
    console.log("reset data model date");
    var filter = {
        "_id": req.user._id
    }

    User.findOne(filter, function(err, user) {
        if (err) console.error(err);
        else {
            user.todayMoves.date = 20140301;
            // Reset totalMoves dist/steps to current data
            user.totalMoves.distance = 0;
            user.totalMoves.steps = 0;
            user.todayMoves.walksteps = 0;
            user.todayMoves.walkDist = 0;
            user.todayMoves.runSteps = 0;
            user.todayMoves.runDist = 0;
            user.save();
        }
        res.send(JSON.stringify(user));
    });
}

exports.token_info = function(req, res) {

    if (!req.cookies.m_token)
        res.render('moves_token', {
            'title': 'Token info'
        });

    moves.token_info(req.cookies.m_token, function(t) {
        res.render('moves_token', {
            'title': 'Token info',
            'token': JSON.stringify(t)
        });
    });
};

exports.refresh_token = function(req, res) {
    if (!req.cookies.m_rtoken)
        res.render('token', {
            'title': 'Token info'
        });

    moves.refresh_token(req.cookies.m_rtoken, function(t) {
        res.clearCookie('m_token');
        res.clearCookie('m_rtoken');

        res.cookie('m_token', t.access_token, {
            maxAge: expires
        });
        res.cookie('m_rtoken', t.refresh_token, {
            maxAge: expires
        });

        res.render('moves_token', {
            'title': 'Token info',
            'token': JSON.stringify(t)
        });
    });
};



//Different month implementation should be updated. Not now. :(
exports.rangefrom = function(req, res) {
    console.log("start rangefrom data update");
    var wlk = 0; //index of walking in data[0].summary[0]
    var run = 2; //index of running in data[0].summary[2]
    var from = req.params.from;
    var to = req.params.to;
    console.log("from:" + from + ", to : " + to);
    var monthQuery = from.slice(0, 6);

    var fromIndex = Number(from.slice(6, 8)) - 1; // index of 20140301 is 0. Date - 1 = index of array
    var toIndex = Number(to.slice(6, 8)); //don't subtract -1 since it's length of the range
    var addDist = 0;
    var addSteps = 0;
    var tDist;
    var tSteps;
    //Get how many days in each Month
    var howManyDaysInMonth = {
        "01": 31,
        "02": 28,
        "03": 31,
        "04": 30,
        "05": 31,
        "06": 30,
        "07": 31,
        "08": 31,
        "09": 30,
        "10": 31,
        "11": 30,
        "12": 31
    }

    //check if the range in the same month
    var fromMonth = from.substring(4, 6);
    var toMonth = to.substring(4, 6);

    if (fromMonth !== toMonth) {
        console.log("####################################");
        console.log("Get data from past months");
        console.log("####################################");
        var year = "2014";
        var date = "01";
        var month = toMonth.toString();
        var updateDate = year.concat(month.concat(date));

        moves.get('monthlySummary', {
            month: monthQuery
        }, req.cookies.m_token, function(data) {
            for (var i = fromIndex; i < howManyDaysInMonth[fromMonth] - 1; i++) {
                if (data[0].summary !== null) {

                    console.log("data: " + data[i].date);
                    addDist += data[i].summary[wlk].distance;
                    addSteps += data[i].summary[wlk].steps;
                    if (data[i].summary[run] !== undefined) {
                        addDist += data[i].summary[run].distance;
                        addSteps += data[i].summary[wlk].steps;
                    }
                } else {
                    console.log("data is missing");
                }
            }
            var filter = {
                "_id": req.user._id
            }
            User.findOne(filter, function(err, user) {
                if (err) console.error(err);
                else {
                    tDist = user.totalMoves.distance + addDist;
                    tSteps = user.totalMoves.steps + addSteps;
                    user.totalMoves.distance = tDist;
                    user.totalMoves.steps = tSteps;
                    user.todayMoves.date = updateDate;
                    user.save();
                    console.log("Update date to first date of this month : " + updateDate);
                    console.log("Redirect");
                    res.redirect('/moves/summary/rangefrom=' + updateDate + '&to=' + to + '');
                }
            });
        });


    } else {
        console.log("####################################");
        console.log("Same Month");
        console.log("####################################");
        moves.get('monthlySummary', {
            month: monthQuery
        }, req.cookies.m_token, function(data) {
            for (var i = fromIndex; i < toIndex; i++) {
                if (data[0].summary !== null) {

                    console.log("data: " + data[i].date);
                    addDist += data[i].summary[wlk].distance;
                    addSteps += data[i].summary[wlk].steps;
                    if (data[i].summary[run] !== undefined) {
                        addDist += data[i].summary[run].distance;
                        addSteps += data[i].summary[wlk].steps;
                    }
                } else {
                    console.log("data is missing");
                }

            }
            var filter = {
                "_id": req.user._id
            }
            User.findOne(filter, function(err, user) {
                if (err) console.error(err);
                else {
                    if (data[toIndex - 1].summary !== null) {
                        user.todayMoves.walksteps = data[toIndex - 1].summary[wlk].steps;
                        user.todayMoves.walkDist = data[toIndex - 1].summary[wlk].distance;
                        if (data[toIndex - 1].summary.length >= 3) {
                            user.todayMoves.runSteps = data[toIndex - 1].summary[run].steps;
                            user.todayMoves.runDist = data[toIndex - 1].summary[run].distance;
                        }
                    }

                    tDist = user.totalMoves.distance + addDist;
                    tSteps = user.totalMoves.steps + addSteps;
                    user.totalMoves.distance = tDist;
                    user.totalMoves.steps = tSteps;
                    user.todayMoves.date = today.date;
                    user.save();
                    console.log("update all past data,but today data");
                    res.send(JSON.stringify(user));
                }

            });
            // res.redirect('/profile');

        });

    }



}



exports.errormessage = function(req, res) {
    res.send("You put the wrong date\<br><a href='/profile'>home</a>");
}