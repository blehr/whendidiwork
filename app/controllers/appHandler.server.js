'use strict';

var request = require('request');
var moment = require('moment');
var Event = require('../models/event.js');
var Spreadsheet = require('edit-google-spreadsheet');

/* use a function for the exact format desired... */
function ISODateString(d) {
  function pad(n) {
    return n < 10 ? '0' + n : n
  }
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z'
}



var today = moment();
var weekPast = moment().subtract(7, 'days').toDate();
var weekAhead = moment().add(7, 'days').toDate();

var weekPastGCF = ISODateString(weekPast);
var weekAheadGCF = ISODateString(weekAhead);


function GoogleApiHandler() {

  this.getCalendarList = function(req, res) {
    var token = req.user.google.token;

    var options = {
      url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      auth: {
        bearer: token
      }
    };

    request(options, function(err, response, body) {
      if (err) throw err;
      res.send(body);
    });

  }


  this.getEvents = function(req, res) {
    var token = req.user.google.token;
    var CalId = req.params.calendarId;
    console.log(CalId);

    var options = {
      url: 'https://www.googleapis.com/calendar/v3/calendars/' +
        CalId + '/events?orderBy=startTime&singleEvents=true&timeMin=' +
        weekPastGCF +
        '&timeMax=' +
        weekAheadGCF,
      auth: {
        bearer: token
      }
    };

    request.get(options, function(err, response, body) {
      if (err) throw err;
      res.send(body);
    });
  }



  this.createEvent = function(req, res) {
    var token = req.user.google.token;
    var CalId = req.params.calendarId;
    var sheetId = req.params.sheetId;
    var nextRow = req.params.nextRow;
    var event = req.body.event;
    var startDate = moment(event.start.dateTime).format('ddd MM/DD/YYYY');
    var startTime = moment(event.start.dateTime).format('hh:mm A');
    var endDate = moment(event.end.dateTime).format('ddd MM/DD/YYYY');
    var endTime = moment(event.end.dateTime).format('hh:mm A');
    var summary = event.summary;


    // send to sheet
    var add = {};
    add[nextRow] = {
      1: startDate,
      2: startTime,
      3: endDate,
      4: endTime,
      5: summary
    };

    Spreadsheet.load({
      debug: true,
      spreadsheetId: sheetId,
      worksheetId: 'od6',
      accessToken: {
        type: 'Bearer',
        token: token
      },
    }, function sheetReady(err, spreadsheet) {
      if (err) throw err;

      spreadsheet.add(add);

      spreadsheet.send({
        autoSize: true
      }, function(err) {
        if (err) throw err;
        // res.end();
      });

    });


    // send to calendar and create Event doc
    var options = {
      method: 'POST',
      url: 'https://www.googleapis.com/calendar/v3/calendars/' + CalId + '/events',
      json: req.body.event,
      auth: {
        bearer: token
      }
    }

    request(options, function(err, response, body) {
      if (err) throw err;

      var newEvent = new Event({
        google: {
          id: req.user.google.id,
        },
        sheet: {
          id: sheetId,
          row: nextRow
        },
        calendar: {
          id: CalId,
          eventId: body.id
        }
      });

      newEvent.save(function(err, doc) {
        if (err) {
          throw err;
        }
      });

      res.send(body);
    });


  }


  this.updateEvent = function(req, res) {
    var eventId = req.params.eventId;
    var token = req.user.google.token;
    var CalId = req.params.calendarId;
    var event = req.body.event;
    var startDate = moment(event.start.dateTime).format('ddd MM/DD/YYYY');
    var startTime = moment(event.start.dateTime).format('HH:mm A');
    var endDate = moment(event.end.dateTime).format('ddd MM/DD/YYYY');
    var endTime = moment(event.end.dateTime).format('HH:mm A');
    var summary = event.summary;

    Event.findOne({
      $and: [{
        'google.id': req.user.google.id
      }, {
        'calendar.eventId': eventId
      }]
    }).exec(function(err, result) {
      if (err) throw err;
      console.log(result);
      var row = result.sheet.row;
      var sheetId = result.sheet.id;

      // send to sheet
      var add = {};
      add[row] = {
        1: startDate,
        2: startTime,
        3: endDate,
        4: endTime,
        5: summary
      };

      Spreadsheet.load({
        debug: true,
        spreadsheetId: sheetId,
        worksheetId: 'od6',
        accessToken: {
          type: 'Bearer',
          token: token
        },
      }, function sheetReady(err, spreadsheet) {
        if (err) throw err;

        spreadsheet.add(add);

        spreadsheet.send({
          autoSize: true
        }, function(err) {
          if (err) throw err;
          res.end();
        });

      });

    });

    var options = {
      method: 'PUT',
      url: 'https://www.googleapis.com/calendar/v3/calendars/' + CalId + '/events/' + eventId,
      json: req.body.event,
      auth: {
        bearer: token
      }
    }

    request(options, function(err, response, body) {
      if (err) throw err;
      res.send(body);
    });

  }


  this.deleteEvent = function(req, res) {
    var token = req.user.google.token;
    var eventId = req.params.eventId;
    var CalId = req.params.calendarId;

    // find db doc
    Event.findOne({
      $and: [{
        'google.id': req.user.google.id
      }, {
        'calendar.eventId': eventId
      }]
    }).exec(function(err, result) {
      if (err) throw err;
      var row = result.sheet.row;
      var sheetId = result.sheet.id;

      // send to sheet
      var add = {};
      add[row] = {
        1: 'Deleted Event',
        2: 'leave this row',
        3: 'to maintain',
        4: 'order',
        5: ''
      };

      Spreadsheet.load({
        debug: true,
        spreadsheetId: sheetId,
        worksheetId: 'od6',
        accessToken: {
          type: 'Bearer',
          token: token
        },
      }, function sheetReady(err, spreadsheet) {
        if (err) throw err;

        spreadsheet.add(add);

        spreadsheet.send(function(err) {
          if (err) throw err;
          res.end();
        });

      });

    });

    // delete from calendar
    var options = {
      method: 'DELETE',
      url: 'https://www.googleapis.com/calendar/v3/calendars/' + CalId + '/events/' + eventId,
      json: req.body.event,
      auth: {
        bearer: token
      }
    }

    request(options, function(err, response, body) {
      if (err) throw err;
      res.send(response);
    });

  }


  this.getFiles = function(req, res) {
    var token = req.user.google.token;

    var options = {
      method: 'GET',
      url: 'https://www.googleapis.com/drive/v2/files?q=title%20contains%20%27whendidiwork%27%20and%20mimeType%20%3D%20%27application%2Fvnd.google-apps.spreadsheet%27%20and%20trashed%3Dfalse',
      auth: {
        bearer: token
      }
    }

    request(options, function(err, response, body) {
      if (err) throw err;
      res.send(body);
    });
  }


  this.getSheetMeta = function(req, res) {
    var token = req.user.google.token;
    var sheetId = req.params.sheetId;

    Spreadsheet.load({
      debug: true,
      spreadsheetId: sheetId,
      worksheetId: 'od6',

      accessToken: {
        type: 'Bearer',
        token: token
      },
    }, function sheetReady(err, spreadsheet) {
      if (err) throw err;

      spreadsheet.receive(function(err, rows, info) {
        if (err) throw err;
        res.send([info, rows]);
      });

    });

  }

  this.createCalendar = function(req, res) {
    var token = req.user.google.token;
    console.log(req.body.newCalendar);

    var options = {
      method: 'POST',
      url: 'https://www.googleapis.com/calendar/v3/calendars',
      json: req.body.newCalendar,
      auth: {
        bearer: token
      }
    }

    request(options, function(err, response, body) {
      if (err) throw err;
      res.send(body);
    });

  }

  this.createSheet = function(req, res) {
    var token = req.user.google.token;
    console.log(req.body.newSheet);

    var options = {
      method: 'POST',
      url: 'https://www.googleapis.com/drive/v2/files',
      json: req.body.newSheet,
      auth: {
        bearer: token
      }
    }

    request(options, function(err, response, body) {
      if (err) throw err;
      res.send(body);
    });

  }


}

module.exports = GoogleApiHandler;
