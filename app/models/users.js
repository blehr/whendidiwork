'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
  google: {
    id: String,
    token: String,
    displayName: String,
    email: String
  }
});

module.exports = mongoose.model('User', User);
