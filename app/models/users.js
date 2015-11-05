'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
  github: {
    id: String,
    token: String,
    displayName: String,
    username: String,
		email: String,
    publicRepos: Number
  },
  google: {
    id: String,
    token: String,
    displayName: String,
    email: String
  },
  facebook: {
    id: String,
    token: String,
    displayName: String,
    email: String
  },
  nbrClicks: {
    clicks: Number
  }
});

module.exports = mongoose.model('User', User);
