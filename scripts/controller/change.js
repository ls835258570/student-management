/**
 * Created by ls-pc on 2016/8/4.
 */
angular.module('app')
    .controller('change',['$rootScope','$scope','$state','serviceStudent',
        function($rootScope,$scope,$state,serviceStudent){
            var vm=this;
            var changeId=$state.params.id;
            console.log($state.params.name);
            console.log($state.params.id);
            var wish=UM.getEditor('editor');
            vm.changeStu=function(){
                vm.p.wish=wish.getPlainTxt();
                console.log(v.p.wish);
                serviceStudent.changeStudent(changeId,vm.p).then(function(res){
                    console.log(res);
                    console.log(vm.p);
                    if(res.data.code===200){
                        //$state.go('home',{},{reload: true})
                        $state.go('home.main.main',{},{reload: true})
                    }
                })
            }
        }]);
