'use strict';

var express = require('express');
var routes = require('./app/routes/index.js');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var morgan = require('morgan');
var request = require('request');


var app = express();
require('dotenv').load();
require('./app/config/google-passport')(passport);



app.use(morgan('dev'));
app.use(bodyParser.json({}));

mongoose.connect(process.env.MONGOLAB_URI);//MONGO_URI

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

routes(app, passport);

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log('Node.js listening on port ' + port + '...');
});
