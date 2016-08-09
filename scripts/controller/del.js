/**
 * Created by ls-pc on 2016/8/4.
 */
angular.module('app')
    .controller('del',['$rootScope','$scope','serviceStudent','$state',
        function($rootScope,$scope,serviceStudent,$state){
            var vm=this;
            var delId=$state.params.id;
            serviceStudent.delStudent(delId).then(function(res){
                console.log(res);
                if (res.data.code===200){
                    console.log(delId);
                    $scope.details=res.data;
                    $state.go('home.main.main',{},{reload: true})
                }
            })
        }]);