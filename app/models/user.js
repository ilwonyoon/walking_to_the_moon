// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var moment = require('moment');

// define the schema for our user model
var userSchema = new mongoose.Schema({

    local: {
        email: String,
        password: String,
    },
    facebook: {
        id: String,
        token: String,
        email: String,
        name: String,
        createdAt: {
            type: Date,
            Default: Date.now()
        }
    },
    initiate: Boolean,
    firstDate: Number,

    //Save today's moves data to model
    todayMoves: {
        time: Number,
        date: Number,
        walkDist: Number,
        walksteps: Number,
        runDist: Number,
        runSteps: Number
    },
    //Update total Moves data
    totalMoves: {
        distance: Number,
        steps: Number,
        lastUpdated: Number
    }
});

// checking if password is valid using bcrypt
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};


// this method hashes the password and sets the users password
userSchema.methods.hashPassword = function(password) {
    var user = this;

    // hash the password
    bcrypt.hash(password, null, null, function(err, hash) {
        if (err)
            return next(err);

        user.local.password = hash;
    });

};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);