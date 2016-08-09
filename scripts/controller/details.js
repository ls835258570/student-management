/**
 * Created by ls-pc on 2016/8/4.
 */
angular.module('app')
    .controller('details',['$rootScope','$scope','serviceStudent','$state',
        function($rootScope,$scope,serviceStudent,$state){
            var vm=this;
            var detailsId=$state.params.id;
            console.log(detailsId);

            serviceStudent.checkStudent(detailsId).then(function(res){
                console.log(res);
                if (res.data.code===200){
                    console.log(detailsId);
                    $scope.details=res.data;
                    //if ($scope.details.wish==)
                    console.log($scope.details.wish)
                }

            })
        }]);