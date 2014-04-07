// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth': {
        'clientID': '281745585317108', // your App ID
        'clientSecret': 'd9d3374d6bbb8960cc323c373348b8b7', // your App Secret
        'callbackURL': 'http://walkingtothemoon.herokuapp.com/auth/facebook/callback'
    }
};

// 'twitterAuth' : {
// 	'consumerKey' 		: 'your-consumer-key-here',
// 	'consumerSecret' 	: 'your-client-secret-here',
// 	'callbackURL' 		: 'http://localhost:8080/auth/twitter/callback'
// },

// 'googleAuth' : {
// 	'clientID' 		: 'your-secret-clientID-here',
// 	'clientSecret' 	: 'your-client-secret-here',
// 	'callbackURL' 	: 'http://localhost:8080/auth/google/callback'
// }