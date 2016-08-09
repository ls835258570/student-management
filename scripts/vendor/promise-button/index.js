
angular.module('app').factory('promiseService', function($q, $timeout, $log, $http) {
    var standardDelay = 1000;
    return {
        success: function ()
        {
            var defer = $q.defer();
            $timeout(function ()
            {
                $log.info('resolve');
                defer.resolve({
                    msg: 'SUCCESS'
                });
            }, standardDelay);
            return defer.promise;
        },
        login: function(params) {
            var defer = $q.defer();
            $http.post("/ajax/a/login/", params)
                .success(defer.resolve).error(defer.reject);

            return defer.promise;
        },
        //getList: function() {
        //    var defer = $q.defer();
        //    $http.get("/ajax/u/teacher/search/")
        //        .success(function(res) {
        //            defer.resolve(res.data);
        //        }).error(defer.reject);
        //
        //    return defer.promise;
        //},
        getList: function() {
            return $http.get("/ajax/u/teacher/search/").then(function(res) {
                return res.data;
            });
        }


    }
});

angular.module('app').controller('promiseButtonCtrl', function($scope, promiseService) {
    var vm = this;
    vm.success = function ($event)
    {
        console.log($event);
        vm.successPromise = false;
        vm.successPromise = promiseService.success();
    };

    vm.login = function() {
        var params = {name: 'admin', pwd: '123456'};
        vm.loginPromise = promiseService.login(params);
        return vm.loginPromise;

    };

    vm.getList = function() {
        vm.getListPromise = promiseService.getList();
        vm.getListPromise.then(function(res) {
            vm.teacherList = res.data;
        });

    }
});
