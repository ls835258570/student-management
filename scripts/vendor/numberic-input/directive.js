var app = angular.module("numbericInput", []);



app.directive('numbericInput', function() {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                var transformedInput = text.replace(/[^0-9]/g, '');
                if(transformedInput !== text) {
                    // $setViewValue 更新视图值
                    // 视图值改变时会被调用，比如input/select指令就会调用这个函数
                    ngModelCtrl.$setViewValue(transformedInput);
                    // 更新视图
                    ngModelCtrl.$render();
                }
                return transformedInput;
            }

            // 推入将要执行的函数数组，
            // 其中的函数依次被调用，并将结果传递给下一个，
            // 最后出来的值会被传递到model中，
            // 还会包括验证和转换值的过程，验证中会使用$setValidity方法
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});
app.directive('floatnumbericInput', function() {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {
            console.log(attr);
            function fromUser(text) {
                var transformedInput = text.trim().replace(/[^^\d+(\.\d)?$]/g, '');

                if( transformedInput.indexOf('.') != -1
                    && (transformedInput.indexOf('.') < transformedInput.length - (Number(attr.floatLength) + 1)) ){
                    transformedInput = transformedInput.substring(0, transformedInput.length-1);
                }

                if(transformedInput !== text) {
                    // $setViewValue 更新视图值
                    // 视图值改变时会被调用，比如input/select指令就会调用这个函数
                    ngModelCtrl.$setViewValue(transformedInput);
                    // 更新视图
                    ngModelCtrl.$render();
                }
                return transformedInput;
            }

            // 推入将要执行的函数数组，
            // 其中的函数依次被调用，并将结果传递给下一个，
            // 最后出来的值会被传递到model中，
            // 还会包括验证和转换值的过程，验证中会使用$setValidity方法
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});