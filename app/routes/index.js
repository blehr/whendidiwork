'use strict';

var path = process.cwd();
var ClickHandler = require(path + '/app/controllers/clickHandler.server.js');

var TodoHandler = require(path + '/app/controllers/todoHandler.server.js');

module.exports = function(app, passport) {

  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/login');
    }
  }

  var clickHandler = new ClickHandler();

  var todoHandler = new TodoHandler();

  app.route('/')
    .get(isLoggedIn, function(req, res) {
      res.sendFile(path + '/public/index.html');
    });

  app.route('/login')
    .get(function(req, res) {
      res.sendFile(path + '/public/login.html');
    });

  app.route('/logout')
    .get(function(req, res) {
      req.logout();
      res.redirect('/login');
    });

  app.route('/profile')
    .get(isLoggedIn, function(req, res) {
      res.sendFile(path + '/public/profile.html');
    });

  app.route('/api/:id')
    .get(isLoggedIn, function(req, res) {
      res.json(req.user);
    });


  //  Github routes

  app.route('/auth/github')
    .get(passport.authenticate('github'));

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', {
      successRedirect: '/',
      failureRedirect: '/login'
    }));

  app.route('/connect/github')
    .get(passport.authorize('github'));

  app.route('/connect/github/callback')
    .get(passport.authorize('github', {
      successRedirect: '/profile',
      failureRedirect: '/profile'
    }))

  app.route('/unlink/github')
    .get(function(req, res) {
      var user = req.user;
      user.github.token = undefined;
      user.save(function(err) {
        res.redirect('/profile');
      });
    });


  // Google routes

  app.route('/auth/google')
    .get(passport.authenticate('google', {
      scope: ['profile', 'email']
    }));

  app.route('/auth/google/callback')
    .get(passport.authenticate('google', {
        failureRedirect: '/login'
      }),
      function(req, res) {
        res.redirect('/');
      });

  app.route('/connect/google')
    .get(passport.authorize('google', {
      scope: ['profile', 'email']
    }));


  app.route('/connect/google/callback')
    .get(passport.authorize('google', {
      successRedirect: '/profile',
      failureRedirect: '/profile'
    }));


  app.route('/unlink/google')
    .get(function(req, res) {
      var user = req.user;
      user.google.token = undefined;
      user.save(function(err) {
        res.redirect('/profile');
      });
    });

  // Facebook routes

  app.route('/auth/facebook')
    .get(passport.authenticate('facebook', {
      scope: 'email'
    }));

  app.route('/auth/facebook/callback')
    .get(passport.authenticate('facebook', {
        failureRedirect: '/login'
      }),
      function(req, res) {
        res.redirect('/');
      });

  app.route('/connect/facebook')
    .get(passport.authorize('facebook', {
      scope: 'email'
    }));

  app.route('/connect/facebook/callback')
    .get(passport.authorize('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/profile'
    }));

  app.route('/unlink/facebook')
    .get(function(req, res) {
      var user = req.user;
      user.facebook.token = undefined;
      user.save(function(err) {
        res.redirect('/profile');
      });
    });





  app.route('/api/:id/clicks')
    .get(isLoggedIn, clickHandler.getClicks)
    .put(isLoggedIn, clickHandler.addClick)
    .delete(isLoggedIn, clickHandler.resetClicks);

  app.route('/api/:id/todo')
    .get(todoHandler.getTodosArray)
    .post(todoHandler.addTodoNew)
    .put(todoHandler.editTodo);

  app.route('/api/:id/todo/:id')
    .delete(todoHandler.removeTodo);


};
