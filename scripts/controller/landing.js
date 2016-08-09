/**
 * Created by ls-pc on 2016/8/3.
 */
angular.module('app')
    .controller('landing',function($scope){
        $scope.userData={};
        $scope.submitForm=function(){
            console.log($scope.userData);
            if($scope.submitForm.$invalid){
                alert("请核对您的信息是否符合要求")
            }else {
                alert('您已注册成功')
            }
        }

    })
//.directive('compare',function(){
//
//})

