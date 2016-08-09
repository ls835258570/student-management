/**
 * Created by ls-pc on 2016/8/2.
 */
angular.module('app')
    .controller('main',['$rootScope','$scope','$state','serviceStudent',
        function($rootScope,$scope,$state,serviceStudent){
            var vm=this;
            vm.types= ["CSS", "JS", "Java", "运维", "DBA", "产品", "IOS", "Android"];
            vm.talents=['学霸','学渣'];
            vm.levels=['0基础','修行3个月以内','修行6个月以内','修行1年以内','修行3年以内','修行3年以上']
            console.log(vm.timestamp1);
            console.log(vm.timestamp);
            serviceStudent.checkStudentList().then(function(res){
                console.log(res);
                if(res.data.code===200){
                    $scope.list=res.data.data;
                    console.log($scope.list);
                    vm.timestamp1 = Date.parse(new Date());
                }
            })

        }]);
