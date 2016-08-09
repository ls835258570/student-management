/**
 * Created by ls-pc on 2016/8/4.
 */

angular.module('app')
    .controller('search',['$rootScope','$scope','$state','serviceStudent',
        function($rootScope,$scope,$state,serviceStudent){
            var vm=this;

            console.log();
            console.log(vm.timestamp1)
            //var myDate = new Date();
            vm.timestamp = parseInt(new Date().getTime()/1000);
            console.log(vm.timestamp);
            vm.timestamp1 = Date.parse(new Date());

            serviceStudent.checkStudentList().then(function(res){
                console.log(res);
                if(res.data.code===200){
                    $scope.list=res.data.data;
                    console.log($scope.list)
                    //$state.go('home.main.search',{},{reload: true})
                }
            })

        }]);