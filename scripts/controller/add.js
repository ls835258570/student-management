/**
 * Created by ls-pc on 2016/8/4.
 */
'use strict';
angular.module('app')
    .controller('add',['$rootScope','$scope','$state','serviceStudent',
        function($rootScope,$scope,$state,serviceStudent){
            var vm=this;

            console.log($scope);
            vm.params = $state.params;
            console.log(vm.params);
            var ue= UM.getEditor('editor');
            vm.addStu=function(){
                vm.p.wish=ue.getPlainTxt();
                console.log(vm.p.wish);
                serviceStudent.addStudent( vm.p ).then(function(res){
                    console.log(res);
                    if(res.data.code===200){
                        //$state.go("home",{}, {reload: true})
                        $state.go('home.main.main',{},{reload: true})
                    }
                    console.log(vm.p);
                    //console.log($state.params)
                })};
            //



        }]);