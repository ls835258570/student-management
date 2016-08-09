var app=angular.module("app",['ui.router','oc.lazyLoad','mgcrea.ngStrap'])//只能启动一次
    .run(function ($rootScope, $state, $stateParams) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
    })
    .config(function ($stateProvider, $urlRouterProvider, $ocLazyLoadProvider) {
        var _lazyLoad = function (loaded) {
            return function ($ocLazyLoad) {
                return $ocLazyLoad.load(loaded, {serie: true});
            }
        };
        $ocLazyLoadProvider.config({
            debug: false,
            events: true
        });
        $urlRouterProvider.when("", '/home');
        $stateProvider
            .state('home',{
                templateUrl:'views/home.html'
            })
            .state('home.main',{
                views:{
                    'header':{
                        templateUrl:'views/header.html'
                        //controller:'header'
                    },
                    'main':{
                        templateUrl:'views/content.html'
                    },
                    'nav':{
                        templateUrl:'views/nav.html'
                        //controller:'nav'
                    },
                    'landing':{
                        templateUrl:'views/landing.html',
                        controller:'landing',
                        controllerAs:'vm',
                        resolve:{
                            loadMyFile:_lazyLoad([
                                'scripts/controller/landing.js'
                            ])
                        }
                    }
                }

            })
            .state('home.main.main',{
                url:'/home',
                templateUrl:'views/main.html',
                controller:'main',
                controllerAs:'vm',
                resolve:{
                    loadMyFile:_lazyLoad([
                        'scripts/controller/main.js'
                    ])
                }
            })
            .state('home.main.add',{
                url:'/main',
                templateUrl:'views/add.html',
                controller:'add',
                controllerAs:'vm',
                resolve:{
                    loadMyFile:_lazyLoad([
                        'scripts/controller/add.js'
                    ])
                }
            })
            .state('home.main.details',{
                url:'/details/:id',
                templateUrl:'views/details.html',
                controller:'details',
                controllerAs:'vm',
                resolve:{
                    loadMyFile:_lazyLoad([
                        'scripts/controller/details.js'
                    ])
                }
            })
            .state('home.main.change',{
                url:'/change/?id?name',
                templateUrl:'views/change.html',
                controller:'change',
                controllerAs:'vm',
                resolve:{
                    loadMyFile:_lazyLoad([
                        'scripts/controller/change.js'
                    ])
                }
            })
            .state('home.main.del',{
                url:'/del/:id',
                //templateUrl:'views/del.html',
                controller:'del',
                controllerAs:'vm',
                resolve:{
                    loadMyFile:_lazyLoad([
                        'scripts/controller/del.js'
                    ])
                }
            })
            .state('home.main.search',{
                url:'/search',
                templateUrl:'views/search.html',
                controller:'search',
                controllerAs:'vm',
                resolve:{
                    loadMyFile:_lazyLoad([
                        'scripts/controller/search.js'
                    ])
                }
            })
    });
