var https = require('https');
var qs = require('querystring');
var Shakes = require('../lib/shakes');
var nconf = require('nconf');

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

    res.render('moves_auth', {
        title: 'Shakes Example',
        auth_url: auth_url,
        mobile_auth_url: mobile_auth_url,
        token: t,
        has_token: hasToken
    });
};

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

            res.render('moves_token', {
                'title': 'Token info',
                'token': JSON.stringify(t)
            });
        });
    }
};

exports.token_info = function(req, res) {
    console.log(req);
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

        res.render('moves_profile', {
            'title': 'Your Profile',
            'profile': data,
            'firstDate': new Date(year, month, day).toLocaleDateString()
        });
    });
};

exports.dailySummary = function(req, res) {
    var day = req.params.date ? req.params.date : moment().format('YYYYMMDD');
    moves.get('dailySummary', {
        date: day
    }, req.cookies.m_token, function(data) {

        console.log(data[0]);
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
        res.render('summary', {
            'title': 'Monthly Summary',
            'summary': data
        });
    });
};

exports.dailyActivity = function(req, res) {
    var day = req.params.date ? req.params.date : moment().format('YYYYMMDD');
    console.log(day);
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

exports.dailyPlaces = function(req, res) {
    var day = req.params.date ? req.params.date : moment().format('YYYYMMDD');

    moves.get('dailyPlaces', {

        date: day
    }, req.cookies.m_token, function(data) {
        res.render('places', {
            'title': 'Daily Places',
            'activity': data
        });
    });
};

exports.weeklyPlaces = function(req, res) {
    var week = req.params.date ? req.params.date : moment().format('YYYY-[W]ww');
    moves.get('weeklyPlaces', {
        week: week
    }, req.cookies.m_token, function(data) {
        res.render('places', {
            'title': 'Weekly Places',
            'activity': data
        });
    });
};

exports.dailyStoryline = function(req, res) {
    var day = req.params.date ? req.params.date : moment().format('YYYYMMDD');
    moves.get('dailyStoryline', {
        date: day
    }, req.cookies.m_token, function(data) {
        res.render('storyline', {
            'title': 'Daily Storyline',
            'activity': data
        });
    });
};

exports.weeklyStoryline = function(req, res) {
    var week = req.params.date ? req.params.date : moment().format('YYYY-[W]ww');
    moves.get('weeklyStoryline', {
        week: week
    }, req.cookies.m_token, function(data) {
        res.render('storyline', {
            'title': 'Weekly Storyline',
            'activity': data
        });
    });
};