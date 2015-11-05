'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Todo = new Schema({
	github: {
		id: String,
	},
	google :{
		id: String,
	},
   todo: {
      title: String,
      message: String
   }
});

module.exports = mongoose.model('Todo', Todo);
