'use strict';

var FacebookStrategy = require('passport-facebook').Strategy;

var User = require('../models/users');

var configAuth = require('./auth');



module.exports = function(passport) {
  // These functions are in the github passport.js

  // passport.serializeUser(function(user, done) {
  //   done(null, user.id);
  // });
  //
  // passport.deserializeUser(function(id, done) {
  //   User.findById(id, function(err, user) {
  //     done(err, user);
  //   });
  // });

  passport.use(new FacebookStrategy({
      clientID: configAuth.facebookAuth.clientID,
      clientSecret: configAuth.facebookAuth.clientSecret,
      callbackURL: configAuth.facebookAuth.callbackURL,
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, accessToken, refreshToken, profile, done) {
      process.nextTick(function() {

        if (!req.user) {

          User.findOne({
            'facebook.id': profile.id
          }, function(err, user) {
            if (err) {
              return done(err);
            }

            if (user) {

              // if there is a user id already but no token (user was linked at one point and then removed)
              // just add our token and profile information
              if (!user.facebook.token) {

                user.facebook.token = accessToken;
                user.facebook.displayName = profile.displayName; // look at the passport user profile to see how names are returned


                user.save(function(err) {
                  if (err)
                    throw err;
                  return done(null, user);
                });

              }

              return done(null, user);

            } else {
              var newUser = new User();

              newUser.facebook.id = profile.id;
              newUser.facebook.token = accessToken;
              newUser.facebook.displayName = profile.displayName; // look at the passport user profile to see how names are returned
              newUser.nbrClicks.clicks = 0;

              newUser.save(function(err) {
                if (err) {
                  throw err;
                }

                return done(null, newUser);
              });
            }
          });
        } else {
          // user already exists and is logged in, we have to link accounts
          var user = req.user; // pull the user out of the session

          // update the current users facebook credentials
          user.facebook.id = profile.id;
          user.facebook.token = accessToken;
          user.facebook.displayName = profile.displayName; // look at the passport user profile to see how names are returned

          // save the user
          user.save(function(err) {
            if (err)
              throw err;
            return done(null, user);
          });
        }
      });

    }
  ));
};
