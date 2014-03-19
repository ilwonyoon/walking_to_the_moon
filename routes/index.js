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