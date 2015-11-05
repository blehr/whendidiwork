'use strict';

(function() {
    angular
        .module('clementineTodoApp', [])
        .controller('TodoCtrl', ['$scope', '$http', '$window',

            function($scope, $http, $window) {

                var appUrl = $window.location.origin;
                var todoUrl = appUrl + '/api/:id/todo';

                $scope.title = "";
                $scope.message = "";


                $scope.hideEditedTodo = "";

                $scope.getTodos = function() {
                    $http.get(todoUrl).then(function(response) {
                        $scope.todoList = response.data;
                        console.log($scope.todoList);

                    });
                };


                $scope.getTodos();

                $scope.addTodo = function() {
                    if ($scope.title != "" && $scope.message != "") {

                        $http.post(todoUrl, {
                            'title': $scope.title,
                            'message': $scope.message
                        }).then(function(response) {
                            $scope.getTodos();
                            $scope.title = "";
                            $scope.message = "";
                        });
                    }
                };

                $scope.editTodo = function(id, title, message) {
                    $scope.title = title;
                    $scope.message = message;
                    $scope.hideEditedTodo = id;
                };




                $scope.cancelEdit = function() {
                    $scope.title = "";
                    $scope.message = "";
                    $scope.hideEditedTodo = "";
                };



                $scope.putTodo = function() {
                    $http.put(todoUrl, {
                        'id': $scope.hideEditedTodo,
                        'title': $scope.title,
                        'message': $scope.message
                    }).then(function(response) {
                        $scope.getTodos();
                        $scope.title = "";
                        $scope.message = "";
                        $scope.hideEditedTodo = "";
                    });
                };



                $scope.deleteTodo = function(id) {
                    $http({
                        url: todoUrl + "/" + id,
                        method: "DELETE"
                    }).
                    then(function(data) {
                        $scope.getTodos();
                    });
                };

            }
        ]);

})();
