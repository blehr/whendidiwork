'use strict';

(function() {

  angular.module('app', ['ui.bootstrap.datetimepicker', 'angular-loading-bar', 'ui.bootstrap', 'ngAnimate'])

  .service('UserService', ['$http', '$window', '$q', function($http, $window, $q) {

    var appUrl = $window.location.origin;
    var apiUrl = appUrl + '/api/:id';

    var deferred = $q.defer();
    var deferred2 = $q.defer();
    var deferred3 = $q.defer();

    this.getUser = function() {
      $http.get(apiUrl).then(function(result) {
        deferred.resolve(result);
      });

      return deferred.promise;
    };

    this.getCalendarsList = function() {
      $http.get('/api/:id/calendarlist').then(function(data) {
        deferred2.resolve(data);
      })
      return deferred2.promise;
    };

    this.getFiles = function() {
      $http.get('api/:id/drivelist').then(function(data) {
        deferred3.resolve(data);
      })
      return deferred3.promise;
    }

  }])

  .directive('scrollOnClick', function() {
    return {
      restrict: 'A',
      link: function(scope, $elm) {
        $elm.on('click', function() {
          $("body").animate({
            scrollTop: $('.top-row').offset().top
          }, "slow");
        });
      }
    }
  })

  .controller('CreateCalendarCtrl', ['$uibModal', 'UserService', '$http', '$window', function($uibModal, UserService, $http, $window) {
    var cal = this;

    cal.isCollapsed = true;

    cal.getUser = function() {
      UserService.getUser().then(function(result) {
        cal.user = result.data;
      });
    };


    cal.getCalendarsList = function() {
      UserService.getCalendarsList().then(function(data) {
        cal.listCalendars = data.data.items;
        cal.listCalendars.forEach(function(calendar) {
          if (calendar.primary === true) {
            cal.timeZone = calendar.timeZone;
          }
        })
      })
    }

    cal.createCalendar = function() {
      cal.isCollapsed = true;
      var newCalendar = {};
      newCalendar.summary = 'whendidiwork@' + cal.newCalendar;
      newCalendar.timeZone = cal.timeZone;

      $http.post('/api/:id/create-calendar', {
        newCalendar
      }).then(function(data) {
        $window.location.reload();
      })
    }

    cal.getUser();
    cal.getCalendarsList();

  }])

  .controller('CreateSheetCtrl', ['$uibModal', 'UserService', '$http', '$window',
    function($uibModal, UserService, $http, $window) {
      var sheet = this;

      sheet.isCollapsed = true;

      sheet.getUser = function() {
        UserService.getUser().then(function(result) {
          sheet.user = result.data;
        });
      };

      sheet.createSheet = function() {
        sheet.isCollapsed = true;
        var newSheet = {};
        newSheet.title = 'whendidiwork@' + sheet.newSheet;
        newSheet.mimeType = 'application/vnd.google-apps.spreadsheet'

        $http.post('api/:id/create-sheet', {
          newSheet
        }).then(function(data) {
          $window.location.reload();
        })

      }

      sheet.getUser();

    }
  ])

  .controller('AppCtrl', ['$scope', '$http', 'UserService', '$window', '$uibModal', function($scope, $http, UserService, $window, $uibModal) {

    var self = this;

    self.isCollapsed = true;

    self.myForm = {};
    self.myForm.clockIn = new Date();
    self.myForm.clockOut = new Date();
    self.myForm.calendar = '';
    self.myForm.eventId = '';
    self.sheetId = '';

    self.confirmedSummary = '';

    self.isEditing = false;



    self.getUser = function() {
      UserService.getUser().then(function(result) {
        self.user = result.data;
        self.myForm.calendar = self.user.lastUsed.calendar;
        self.myForm.sheet = self.user.lastUsed.sheet;
        if (self.myForm.calendar != '') {
          self.getCalendarEvents();
        }
        self.getFiles();
      });
    };

    self.getFiles = function() {
      self.isCollapsed = true;
      UserService.getFiles().then(function(data) {
        self.sheets = data.data.items;
        self.updateSheetProps();
      });
    };

    self.getCalendarsList = function() {
      UserService.getCalendarsList().then(function(data) {
        self.listCalendars = data.data.items;
        self.listCalendars.forEach(function(cal) {
          if (cal.primary === true) {
            self.timeZone = cal.timeZone;
          }
        })
      })
    }




    self.eventEditing = function(id, start, end, summary) {
      self.isEditing = true;
      self.myForm.clockIn = start;
      self.myForm.clockOut = end;
      self.myForm.eventId = id;
      self.myForm.summary = summary;
    }

    self.logout = function() {
      $window.location.href = '/logout';
    }

    self.updateEvent = function() {
      self.isCollapsed = true;
      var event = {
        "summary": self.myForm.summary,
        "start": {
          "dateTime": self.myForm.clockIn,
          "timeZone": self.timeZone
        },
        "end": {
          "dateTime": self.myForm.clockOut,
          "timeZone": self.timeZone
        }
      }

      if (event.end.dateTime < event.start.dateTime) {
        alert('Event end time must come after start time!');
        return;
      }

      if (self.sheetId === '') {
        $window.alert('Please select a Sheet');
        return;
      }

      if (self.myForm.calendar === '') {
        $window.alert('Please select a calendar');
        return;
      }

      if (self.sheetId != '' && self.myForm.calendar != '') {
        $http.put('/api/:id/calendarevents/' + self.myForm.calendar + '/' + self.myForm.eventId, {
          event
        }).then(function(data) {
          self.eventConfirmation(data);
          self.cancelEdit();
          self.getCalendarEvents();
        })
      }
    }


    self.removeEvent = function(eventId) {
      self.isCollapsed = true;
      $http.delete('/api/:id/delete-event/' + self.myForm.calendar + '/' + eventId).then(function(data) {
        if (data.data.body != "") {
          self.confirmedSummary = 'This event can\'t be deleted';
          self.confirmedStart = '';
          self.confirmedEnd = '';
        } else {
          self.confirmedSummary = 'Event successfully deleted';
          self.confirmedStart = '';
          self.confirmedEnd = '';
        }
        self.cancelEdit();
        self.getCalendarEvents();
      })
    }

    self.cancelEdit = function() {
      self.isEditing = false;
      self.myForm.clockIn = new Date();
      self.myForm.clockOut = new Date();
      self.myForm.eventId = "";
      self.updateSheetProps();
    }

    self.getCalendarEvents = function() {
      self.isCollapsed = true;
      $http.get('/api/:id/calendarevents/' + self.myForm.calendar).then(function(data) {
        self.events = data.data.items;
      })
    }

    self.submitForm = function() {
      self.isCollapsed = true;

      var event = {
        "summary": self.myForm.summary,
        "start": {
          "dateTime": self.myForm.clockIn,
          "timeZone": self.timeZone
        },
        "end": {
          "dateTime": self.myForm.clockOut,
          "timeZone": self.timeZone
        }
      }

      if (event.end.dateTime < event.start.dateTime) {
        alert('Event end time must come after start time!');
        return;
      }

      if (self.sheetId === '') {
        $window.alert('Please select a Sheet');
        return;
      }

      if (self.myForm.calendar === '') {
        $window.alert('Please select a calendar');
        return;
      }

      if (self.sheetId != '' && self.myForm.calendar != '') {
        $http.post('api/:id/create-event/' + self.myForm.calendar + '/' + self.sheetId + '/' + self.nextRow, {
          event
        }).then(function(data) {
          self.eventConfirmation(data);
          self.cancelEdit();
          self.getCalendarEvents();
        })
      }
    }

    self.updateSheetProps = function() {
      if (self.myForm.sheet === '') {
        self.sheetLink = '';
        self.myForm.summary = '';
        self.sheetId = '';
      } else {
        angular.forEach(self.sheets, function(sheet) {
          if (sheet.id === self.myForm.sheet) {
            self.sheetLink = 'https://docs.google.com/spreadsheets/d/' + sheet.id;
            self.myForm.summary = sheet.title.substring(12) + ': ';
            self.sheetId = sheet.id;
            self.getSheetMeta();
          }
        });
      }

    }

    self.getSheetMeta = function() {
      if (self.sheetId != '') {
        $http.get('api/:id/sheet/' + self.sheetId).then(function(data) {
          self.nextRow = data.data[0].nextRow;
          var sheetRows = data.data[1];
          var sheetRowsProps = [];
          self.rowsArray = [];

          for (var row in sheetRows) {
            sheetRowsProps.push(row);
          }

          var lastTenRows = sheetRowsProps.slice(-14);

          lastTenRows.forEach(function(row) {
            return self.rowsArray.push(sheetRows[row]);
          })
        })
      }
    }

    self.revealSheet = function() {
      self.isCollapsed = !self.isCollapsed;
      if (self.isCollapsed === false) {
        self.updateSheetProps();
      }
    }

    self.eventConfirmation = function(data) {
      if (!data.data.summary) {
        self.confirmedSummary = 'This event can\'t be updated';
        self.confirmedStart = '';
        self.confirmedEnd = '';
      } else {
        self.confirmedSummary = data.data.summary;
        self.confirmedStart = data.data.start.dateTime;
        self.confirmedEnd = data.data.end.dateTime;
      }
    }

    //initial calls
    self.getCalendarsList();
    self.getUser();


  }])

})();
