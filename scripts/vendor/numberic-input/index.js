angular.module('app').controller('numbericInputCtrl', function($scope) {
    var vm = this;


    vm.quantity = 0;
    vm.subtraction = function() {
        if (vm.quantity > 0) {
            vm.quantity--;
        }

    };
    vm.addition = function() {
        vm.quantity++;
    };
});