var promise = angular.module('promiseButton', []);

promise.directive('promiseBtn', ['promiseBtnSet', '$parse', function (promiseBtnSet, $parse)
    {
        'use strict';

        var CLICK_EVENT = 'click';
        var CLICK_ATTR = 'ngClick';
        var SUBMIT_EVENT = 'submit';
        var SUBMIT_ATTR = 'ngSubmit';

        return {
            restrict: 'EA',
            scope: {
                promiseBtn: '=',
                promiseBtnOptions: '=?'
            },
            link: function (scope, el, attrs)
            {
                var providerCfg = promiseBtnSet.config;
                var cfg = providerCfg;
                var promiseWatcher;


                function handleLoading(btnEl)
                {
                    if (cfg.btnLoadingClass && !cfg.addClassToCurrentBtnOnly) {
                        btnEl.addClass(cfg.btnLoadingClass);
                    }
                    if (cfg.disableBtn && !cfg.disableCurrentBtnOnly) {
                        btnEl.attr('disabled', 'disabled');
                    }
                }

                function handleLoadingFinished(btnEl)
                {
                    if (cfg.btnLoadingClass) {
                        btnEl.removeClass(cfg.btnLoadingClass);
                    }
                    if (cfg.disableBtn) {
                        btnEl.removeAttr('disabled');
                    }
                }

                function initPromiseWatcher(watchExpressionForPromise, btnEl)
                {
                    // 监视promise是resolve还是fail
                    scope.$watch(watchExpressionForPromise, function (mVal)
                    {
                        // for then
                        if (mVal && mVal.then) {
                            handleLoading(btnEl);
                            mVal.finally(function ()
                            {
                                handleLoadingFinished(btnEl);
                            });
                        }
                        // for $promise
                        else if (mVal && mVal.$promise) {
                            handleLoading(btnEl);
                            mVal.$promise.finally(function ()
                            {
                                handleLoadingFinished(btnEl);
                            });
                        }
                    });
                }

                function getCallbacks(expression)
                {
                    return expression
                        // 用;分割多个函数
                        .split(';')
                        .map(function (callback)
                        {
                            // 返回getter
                            return $parse(callback);
                        });
                }

                function appendSpinnerTpl(btnEl)
                {
                    btnEl.append(cfg.spinnerTpl);
                }

                function addHandlersForCurrentBtnOnly(btnEl)
                {
                    // 按钮有设置addClassToCurrentBtnOnly/disableCurrentBtnOnly时，点击则
                    if (cfg.addClassToCurrentBtnOnly) {
                        btnEl.on(CLICK_EVENT, function ()
                        {
                            btnEl.addClass(cfg.btnLoadingClass);
                        });
                    }

                    if (cfg.disableCurrentBtnOnly) {
                        btnEl.on(CLICK_EVENT, function ()
                        {
                            btnEl.attr('disabled', 'disabled');
                        });
                    }
                }

                function initHandlingOfViewFunctionsReturningAPromise(eventToHandle, attrToParse, btnEl)
                {
                    // 把要执行的操作在当前digest周期的末尾进行排队，不会导致在scope修改后的另一个digest周期。
                    scope.$evalAsync(function ()
                    {
                        var callbacks = getCallbacks(attrs[attrToParse]);

                        // 先接绑
                        el.unbind(eventToHandle);

                        // 再绑定, 但这次监视它的返回值
                        el.bind(eventToHandle, function ()
                        {
                            // 确保能把监视循环跑起来
                            scope.$apply(function ()
                            {
                                callbacks.forEach(function (cb)
                                {
                                    // execute function on parent scope
                                    // as we're in an isolate scope here
                                    // 这里面是独立作用域的，执行函数要传入父级作用域
                                    var promise = cb(scope.$parent, {$event: eventToHandle});

                                    // 如果之前没有的情况下，初始化监视器
                                    if (!promiseWatcher) {
                                        promiseWatcher = initPromiseWatcher(function ()
                                        {
                                            return promise;
                                        }, btnEl);
                                    }
                                });
                            });
                        });
                    });
                }


                // 初始化
                // 检查attrs.promiseBtn是否有任何值
                if (!attrs.promiseBtn) {
                    // handle ngClick
                    if (attrs.hasOwnProperty(CLICK_ATTR)) {
                        appendSpinnerTpl(el);
                        addHandlersForCurrentBtnOnly(el);
                        initHandlingOfViewFunctionsReturningAPromise(CLICK_EVENT, CLICK_ATTR, el);
                    }
                    // handle ngSubmit
                    else if (attrs.hasOwnProperty(SUBMIT_ATTR)) {
                        appendSpinnerTpl(el);
                        addHandlersForCurrentBtnOnly(el);
                        initHandlingOfViewFunctionsReturningAPromise(SUBMIT_EVENT, SUBMIT_ATTR, el);
                    }
                }
                // 否则用scope.promiseBtn的值
                else {
                    appendSpinnerTpl(el);
                    addHandlersForCurrentBtnOnly(el);
                    initPromiseWatcher(function ()
                    {
                        return scope.promiseBtn;
                    }, el);
                }


                // 监视和更新option
                scope.$watch('promiseBtnOptions', function (newVal)
                {
                    if (angular.isObject(newVal)) {
                        cfg = angular.extend({}, providerCfg, newVal);
                    }
                }, true);
            }
        };
    }]);
// 基本配置option
promise.provider('promiseBtnSet', function promiseBtnSetProvider()
    {
        'use strict';

        var config = {
            //spinnerTpl: '<span class="btn-spinner"></span>',
            disableBtn: true,
            btnLoadingClass: 'is-loading',
            addClassToCurrentBtnOnly: false,
            disableCurrentBtnOnly: false
        };

        return {
            extendConfig: function (newConfig)
            {
                config = angular.extend(config, newConfig);
            },

            $get: function ()
            {
                return {
                    config: config
                };
            }
        };
    });

