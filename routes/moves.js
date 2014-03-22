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
var expires = 14 * 24 * 3600000; // 2 weeks
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
                    user.initiate = true;
                    user.save();
                }
            });
            res.redirect('/moves/initData')

        });
    }
};

exports.initData = function(req, res) {
    var filter = {
        "_id": req.user._id
    }
    User.findOne(filter, function(err, user) {
        if (err) console.error(err);
        else {
            user.initiate = true;
            if (user.initiate === true) {
                console.log("init all data set");
                user.todayMoves.date = user.firstDate;
                user.todayMoves.time = today.date;
                //Let's get first data update
                moves.get('dailySummary', {
                    date: today.date
                }, req.cookies.m_token, function(data) {
                    var tDist = 0;
                    var tSteps = 0;
                    for (var i = 0; i < data[0].summary.length; i++) {
                        if (data[0].summary[i].activity == 'wlk') {
                            user.todayMoves.walkDist = data[0].summary[i].distance;
                            user.todayMoves.walksteps = data[0].summary[i].steps;
                            tDist += data[0].summary[i].distance;
                            tSteps += data[0].summary[i].steps;

                        } else if (data[0].summary[i].activity == 'run') {
                            user.todayMoves.runDist = data[0].summary[i].distance;
                            user.todayMoves.runSteps = data[0].summary[i].steps;
                            tSteps += data[0].summary[i].steps;
                            tDist += data[0].summary[i].distance;
                        }
                        user.totalMoves.distance = tDist;
                        user.totalMoves.steps = tSteps;
                        user.save();
                    }
                });
            }
        }
        res.redirect('/profile');
        //res.send(JSON.stringify(user));
    });
}



//check the status of user and update all of data upto now
exports.update = function(req, res) {
    //Call user model object first
    var filter = {
        "_id": req.user._id
    }
    User.findOne(filter, function(err, user) {
        if (err) console.error(err);
        else {
            //init all Moves data set
            if (user.initiate == true) {
                //Get date from first date of moves to current date
                moves.get('dailySummary', {
                    date: user.firstDate
                }, req.cookies.m_token, function(data) {
                    // /console.log(data[0].summary);
                    console.log(user.todayMoves);
                    user.todayMoves[0].date = user.firstDate;
                    user.initiate = false;
                    user.save();
                    console.log(user.toayMoves[0]);
                });
            }
        }
    });
    res.send("go to <a href='/moves/summary/daily/user.firstDate+'>daily summary </a>");
};

exports.resetmodel = function(req, res) {
    console.log("reset data model date");
    var filter = {
        "_id": req.user._id
    }

    User.findOne(filter, function(err, user) {
        if (err) console.error(err);
        else {
            user.todayMoves.date = 20140320;
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

exports.moves_profile = function(req, res) {
    moves.get('userProfile', null, req.cookies.m_token, function(data) {
        var firstDate = data.profile.firstDate.toString();
        var year = firstDate.substring(0, 4);
        var month = firstDate.substring(4, 6);
        var day = firstDate.substring(6, 8);
        console.log(data);
        res.render('moves_profile', {
            'title': 'Your Profile',
            'profile': data,
            'convertedDate': new Date(year, month, day).toLocaleDateString(),
            'firstDate': firstDate
        });
    });
};

exports.dailySummary = function(req, res) {
    var day = req.params.date ? req.params.date : moment().format('YYYYMMDD');
    moves.get('dailySummary', {
        date: day
    }, req.cookies.m_token, function(data) {
        res.render('summary', {
            'title': 'Daily Summary',
            'summary': data
        });
    });
};

exports.weeklySummary = function(req, res) {
    var week = req.params.date ? req.params.date : moment().format('YYYY-[W]ww');
    moves.get('weeklySummary', {
        week: week
    }, req.cookies.m_token, function(data) {
        res.render('summary', {
            'title': 'Weekly Summary',
            'summary': data
        });
    });
};

exports.monthlySummary = function(req, res) {
    var month = req.params.date ? req.params.date : moment().format('YYYYMM');
    moves.get('monthlySummary', {
        month: month
    }, req.cookies.m_token, function(data) {

        res.send(JSON.stringify(data));
        // res.render('summary', {
        //     'title': 'Monthly Summary',
        //     'summary': data
        // });
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
    from = from.slice(6, 8);
    to = to.slice(6, 8);
    var fromIndex = Number(from) - 1; // index of 20140301 is 0. Date - 1 = index of array
    var toIndex = Number(to); //don't subtract -1 since it's length of the range
    var addDist = 0;
    var addSteps = 0;
    var tDist;
    var tSteps;

    moves.get('monthlySummary', {
        month: monthQuery
    }, req.cookies.m_token, function(data) {
        for (var i = fromIndex; i < toIndex; i++) {
            if (data[0].summary !== null) {
                console.log("data: " + data[i].date);
                addDist += data[i].summary[wlk].distance;
                addSteps += data[i].summary[wlk].steps;
                if (data[i].summary.length >= 3) {
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
                        user.todayMoves.runSteps = data[toIndex - 1].summary[wlk].steps;
                        user.todayMoves.runDist = data[toIndex - 1].summary[wlk].distance;
                    }
                }

                tDist = user.totalMoves.distance + addDist;
                tSteps = user.totalMoves.steps + addSteps;
                user.totalMoves.distance = tDist;
                user.totalMoves.steps = tSteps;
                user.todayMoves.date = today.date;
                user.save();
                console.log("update all past data,but today data");
            }
            //res.send(JSON.stringify(data));
        });
        res.redirect('/profile');

    });
    //res.send("Hell NO");
}

//get today's Moves data
exports.dailyActivity = function(req, res) {
    var day = req.params.date ? req.params.date : moment().format('YYYYMMDD');

    moves.get('dailyActivity', {
        date: day
    }, req.cookies.m_token, function(data) {
        res.render('activity', {
            'title': 'Daily Activity',
            'activity': data
        });
    });
};

exports.weeklyActivity = function(req, res) {
    var week = req.params.date ? req.params.date : moment().format('YYYY-[W]ww');
    moves.get('weeklyActivity', {
        week: week
    }, req.cookies.m_token, function(data) {
        res.render('activity', {
            'title': 'Weekly Activity',
            'activity': data
        });
    });
};



exports.errormessage = function(req, res) {
    res.send("You put the wrong date\<br><a href='/profile'>home</a>");
}