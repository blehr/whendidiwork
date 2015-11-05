'use strict';

var GitHubStrategy = require('passport-github').Strategy;
var User = require('../models/users');
var configAuth = require('./auth');

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new GitHubStrategy({
      clientID: configAuth.githubAuth.clientID,
      clientSecret: configAuth.githubAuth.clientSecret,
      callbackURL: configAuth.githubAuth.callbackURL,
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, token, refreshToken, profile, done) {
      process.nextTick(function() {

        // check if the user is already logged in
        if (!req.user) {

          User.findOne({
            'github.id': profile.id
          }, function(err, user) {
            if (err) {
              return done(err);
            }
            if (user) {


              // if there is a user id already but no token (user was linked at one point and then removed)
              // just add our token and profile information
              if (!user.github.token) {
                user.github.token = token;
                user.github.username = profile.username;
                user.github.displayName = profile.displayName;
                user.github.publicRepos = profile._json.public_repos;
                user.github.email = profile.emails[0].value;


                user.save(function(err) {
                  if (err)
                    throw err;
                  return done(null, user);
                });

              }
              
              return done(null, user);

            } else {
              var newUser = new User();

              newUser.github.id = profile.id;
              newUser.github.username = profile.username;
              newUser.github.displayName = profile.displayName;
              newUser.github.publicRepos = profile._json.public_repos;
              newUser.github.email = profile.emails[0].value;
              newUser.github.token = token;
              newUser.nbrClicks.clicks = 0;

              newUser.save(function(err) {
                if (err) {
                  throw err;
                }

                return done(null, newUser);
              });
            }
            return done(null, user); // user found, return that user
          });
        } else {
          // user already exists and is logged in, we have to link accounts
          var user = req.user; // pull the user out of the session

          // update the current users github credentials
          user.github.id = profile.id;
          user.github.token = token;
          user.github.username = profile.username;
          user.github.displayName = profile.displayName;
          user.github.email = profile.emails[0].value;

          // save the user
          user.save(function(err) {
            if (err)
              throw err;
            return done(null, user);
          });
        }
      });
    }));
};
