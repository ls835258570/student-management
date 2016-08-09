/**
 * @license AngularJS v1.3.15
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 * ngCookies
 */
(function (window, angular, undefined) {
    'use strict';

    /**
     * @ngdoc module
     * @name ngCookies
     * @description
     *
     * # ngCookies
     *
     * The `ngCookies` module provides a convenient wrapper for reading and writing browser cookies.
     *
     *
     * <div doc-module-components="ngCookies"></div>
     *
     * See {@link ngCookies.$cookies `$cookies`} and
     * {@link ngCookies.$cookieStore `$cookieStore`} for usage.
     */


    angular.module('ngCookies', ['ng']).
    /**
     * @ngdoc service
     * @name $cookies
     *
     * @description
     * Provides read/write access to browser's cookies.
     *
     * Only a simple Object is exposed and by adding or removing properties to/from this object, new
     * cookies are created/deleted at the end of current $eval.
     * The object's properties can only be strings.
     *
     * Requires the {@link ngCookies `ngCookies`} module to be installed.
     *
     * @example
     *
     * ```js
     * angular.module('cookiesExample', ['ngCookies'])
     *   .controller('ExampleController', ['$cookies', function($cookies) {
   *     // Retrieving a cookie
   *     var favoriteCookie = $cookies.myFavorite;
   *     // Setting a cookie
   *     $cookies.myFavorite = 'oatmeal';
   *   }]);
     * ```
     */
    factory('$cookies', ['$rootScope', '$browser', function ($rootScope, $browser) {
        var cookies = {},
            lastCookies = {},
            lastBrowserCookies,
            runEval = false,
            copy = angular.copy,
            isUndefined = angular.isUndefined;

        //creates a poller fn that copies all cookies from the $browser to service & inits the service
        $browser.addPollFn(function () {
            var currentCookies = $browser.cookies();
            if (lastBrowserCookies != currentCookies) { //relies on browser.cookies() impl
                lastBrowserCookies = currentCookies;
                copy(currentCookies, lastCookies);
                copy(currentCookies, cookies);
                if (runEval) $rootScope.$apply();
            }
        })();

        runEval = true;

        //at the end of each eval, push cookies
        //TODO: this should happen before the "delayed" watches fire, because if some cookies are not
        //      strings or browser refuses to store some cookies, we update the model in the push fn.
        $rootScope.$watch(push);

        return cookies;


        /**
         * Pushes all the cookies from the service to the browser and verifies if all cookies were
         * stored.
         */
        function push() {
            var name,
                value,
                browserCookies,
                updated;

            //delete any cookies deleted in $cookies
            for (name in lastCookies) {
                if (isUndefined(cookies[name])) {
                    $browser.cookies(name, undefined);
                }
            }

            //update all cookies updated in $cookies
            for (name in cookies) {
                value = cookies[name];
                if (!angular.isString(value)) {
                    value = '' + value;
                    cookies[name] = value;
                }
                if (value !== lastCookies[name]) {
                    $browser.cookies(name, value);
                    updated = true;
                }
            }

            //verify what was actually stored
            if (updated) {
                updated = false;
                browserCookies = $browser.cookies();

                for (name in cookies) {
                    if (cookies[name] !== browserCookies[name]) {
                        //delete or reset all cookies that the browser dropped from $cookies
                        if (isUndefined(browserCookies[name])) {
                            delete cookies[name];
                        } else {
                            cookies[name] = browserCookies[name];
                        }
                        updated = true;
                    }
                }
            }
        }
    }]).


    /**
     * @ngdoc service
     * @name $cookieStore
     * @requires $cookies
     *
     * @description
     * Provides a key-value (string-object) storage, that is backed by session cookies.
     * Objects put or retrieved from this storage are automatically serialized or
     * deserialized by angular's toJson/fromJson.
     *
     * Requires the {@link ngCookies `ngCookies`} module to be installed.
     *
     * @example
     *
     * ```js
     * angular.module('cookieStoreExample', ['ngCookies'])
     *   .controller('ExampleController', ['$cookieStore', function($cookieStore) {
   *     // Put cookie
   *     $cookieStore.put('myFavorite','oatmeal');
   *     // Get cookie
   *     var favoriteCookie = $cookieStore.get('myFavorite');
   *     // Removing a cookie
   *     $cookieStore.remove('myFavorite');
   *   }]);
     * ```
     */
    factory('$cookieStore', ['$cookies', function ($cookies) {

        return {
            /**
             * @ngdoc method
             * @name $cookieStore#get
             *
             * @description
             * Returns the value of given cookie key
             *
             * @param {string} key Id to use for lookup.
             * @returns {Object} Deserialized cookie value.
             */
            get: function (key) {
                var value = $cookies[key];
                return value ? angular.fromJson(value) : value;
            },

            /**
             * @ngdoc method
             * @name $cookieStore#put
             *
             * @description
             * Sets a value for given cookie key
             *
             * @param {string} key Id for the `value`.
             * @param {Object} value Value to be stored.
             */
            put: function (key, value) {
                $cookies[key] = angular.toJson(value);
            },

            /**
             * @ngdoc method
             * @name $cookieStore#remove
             *
             * @description
             * Remove given cookie
             *
             * @param {string} key Id of the key-value pair to delete.
             */
            remove: function (key) {
                delete $cookies[key];
            }
        };

    }]);


})(window, window.angular);

/**
 * @license AngularJS v1.3.15
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 * ngAnimate
 */
(function (window, angular, undefined) {
    'use strict';

    /* jshint maxlen: false */

    /**
     * @ngdoc module
     * @name ngAnimate
     * @description
     *
     * The `ngAnimate` module provides support for JavaScript, CSS3 transition and CSS3 keyframe animation hooks within existing core and custom directives.
     *
     * <div doc-module-components="ngAnimate"></div>
     *
     * # Usage
     *
     * To see animations in action, all that is required is to define the appropriate CSS classes
     * or to register a JavaScript animation via the `myModule.animation()` function. The directives that support animation automatically are:
     * `ngRepeat`, `ngInclude`, `ngIf`, `ngSwitch`, `ngShow`, `ngHide`, `ngView` and `ngClass`. Custom directives can take advantage of animation
     * by using the `$animate` service.
     *
     * Below is a more detailed breakdown of the supported animation events provided by pre-existing ng directives:
     *
     * | Directive                                                                                                | Supported Animations                                                     |
     * |----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|
     * | {@link ng.directive:ngRepeat#animations ngRepeat}                                                        | enter, leave and move                                                    |
     * | {@link ngRoute.directive:ngView#animations ngView}                                                       | enter and leave                                                          |
     * | {@link ng.directive:ngInclude#animations ngInclude}                                                      | enter and leave                                                          |
     * | {@link ng.directive:ngSwitch#animations ngSwitch}                                                        | enter and leave                                                          |
     * | {@link ng.directive:ngIf#animations ngIf}                                                                | enter and leave                                                          |
     * | {@link ng.directive:ngClass#animations ngClass}                                                          | add and remove (the CSS class(es) present)                               |
     * | {@link ng.directive:ngShow#animations ngShow} & {@link ng.directive:ngHide#animations ngHide}            | add and remove (the ng-hide class value)                                 |
     * | {@link ng.directive:form#animation-hooks form} & {@link ng.directive:ngModel#animation-hooks ngModel}    | add and remove (dirty, pristine, valid, invalid & all other validations) |
     * | {@link module:ngMessages#animations ngMessages}                                                          | add and remove (ng-active & ng-inactive)                                 |
     * | {@link module:ngMessages#animations ngMessage}                                                           | enter and leave                                                          |
     *
     * You can find out more information about animations upon visiting each directive page.
     *
     * Below is an example of how to apply animations to a directive that supports animation hooks:
     *
     * ```html
     * <style type="text/css">
     * .slide.ng-enter, .slide.ng-leave {
 *   -webkit-transition:0.5s linear all;
 *   transition:0.5s linear all;
 * }
     *
     * .slide.ng-enter { }        /&#42; starting animations for enter &#42;/
     * .slide.ng-enter.ng-enter-active { } /&#42; terminal animations for enter &#42;/
     * .slide.ng-leave { }        /&#42; starting animations for leave &#42;/
     * .slide.ng-leave.ng-leave-active { } /&#42; terminal animations for leave &#42;/
     * </style>
     *
     * <!--
     * the animate service will automatically add .ng-enter and .ng-leave to the element
     * to trigger the CSS transition/animations
     * -->
     * <ANY class="slide" ng-include="..."></ANY>
     * ```
     *
     * Keep in mind that, by default, if an animation is running, any child elements cannot be animated
     * until the parent element's animation has completed. This blocking feature can be overridden by
     * placing the `ng-animate-children` attribute on a parent container tag.
     *
     * ```html
     * <div class="slide-animation" ng-if="on" ng-animate-children>
     *   <div class="fade-animation" ng-if="on">
     *     <div class="explode-animation" ng-if="on">
     *        ...
     *     </div>
     *   </div>
     * </div>
     * ```
     *
     * When the `on` expression value changes and an animation is triggered then each of the elements within
     * will all animate without the block being applied to child elements.
     *
     * ## Are animations run when the application starts?
     * No they are not. When an application is bootstrapped Angular will disable animations from running to avoid
     * a frenzy of animations from being triggered as soon as the browser has rendered the screen. For this to work,
     * Angular will wait for two digest cycles until enabling animations. From there on, any animation-triggering
     * layout changes in the application will trigger animations as normal.
     *
     * In addition, upon bootstrap, if the routing system or any directives or load remote data (via $http) then Angular
     * will automatically extend the wait time to enable animations once **all** of the outbound HTTP requests
     * are complete.
     *
     * ## CSS-defined Animations
     * The animate service will automatically apply two CSS classes to the animated element and these two CSS classes
     * are designed to contain the start and end CSS styling. Both CSS transitions and keyframe animations are supported
     * and can be used to play along with this naming structure.
     *
     * The following code below demonstrates how to perform animations using **CSS transitions** with Angular:
     *
     * ```html
     * <style type="text/css">
     * /&#42;
     *  The animate class is apart of the element and the ng-enter class
     *  is attached to the element once the enter animation event is triggered
     * &#42;/
     * .reveal-animation.ng-enter {
 *  -webkit-transition: 1s linear all; /&#42; Safari/Chrome &#42;/
 *  transition: 1s linear all; /&#42; All other modern browsers and IE10+ &#42;/
 *
 *  /&#42; The animation preparation code &#42;/
 *  opacity: 0;
 * }
     *
     * /&#42;
     *  Keep in mind that you want to combine both CSS
     *  classes together to avoid any CSS-specificity
     *  conflicts
     * &#42;/
     * .reveal-animation.ng-enter.ng-enter-active {
 *  /&#42; The animation code itself &#42;/
 *  opacity: 1;
 * }
     * </style>
     *
     * <div class="view-container">
     *   <div ng-view class="reveal-animation"></div>
     * </div>
     * ```
     *
     * The following code below demonstrates how to perform animations using **CSS animations** with Angular:
     *
     * ```html
     * <style type="text/css">
     * .reveal-animation.ng-enter {
 *   -webkit-animation: enter_sequence 1s linear; /&#42; Safari/Chrome &#42;/
 *   animation: enter_sequence 1s linear; /&#42; IE10+ and Future Browsers &#42;/
 * }
     * @-webkit-keyframes enter_sequence {
 *   from { opacity:0; }
 *   to { opacity:1; }
 * }
     * @keyframes enter_sequence {
 *   from { opacity:0; }
 *   to { opacity:1; }
 * }
     * </style>
     *
     * <div class="view-container">
     *   <div ng-view class="reveal-animation"></div>
     * </div>
     * ```
     *
     * Both CSS3 animations and transitions can be used together and the animate service will figure out the correct duration and delay timing.
     *
     * Upon DOM mutation, the event class is added first (something like `ng-enter`), then the browser prepares itself to add
     * the active class (in this case `ng-enter-active`) which then triggers the animation. The animation module will automatically
     * detect the CSS code to determine when the animation ends. Once the animation is over then both CSS classes will be
     * removed from the DOM. If a browser does not support CSS transitions or CSS animations then the animation will start and end
     * immediately resulting in a DOM element that is at its final state. This final state is when the DOM element
     * has no CSS transition/animation classes applied to it.
     *
     * ### Structural transition animations
     *
     * Structural transitions (such as enter, leave and move) will always apply a `0s none` transition
     * value to force the browser into rendering the styles defined in the setup (`.ng-enter`, `.ng-leave`
     * or `.ng-move`) class. This means that any active transition animations operating on the element
     * will be cut off to make way for the enter, leave or move animation.
     *
     * ### Class-based transition animations
     *
     * Class-based transitions refer to transition animations that are triggered when a CSS class is
     * added to or removed from the element (via `$animate.addClass`, `$animate.removeClass`,
     * `$animate.setClass`, or by directives such as `ngClass`, `ngModel` and `form`).
     * They are different when compared to structural animations since they **do not cancel existing
     * animations** nor do they **block successive transitions** from rendering on the same element.
     * This distinction allows for **multiple class-based transitions** to be performed on the same element.
     *
     * In addition to ngAnimate supporting the default (natural) functionality of class-based transition
     * animations, ngAnimate also decorates the element with starting and ending CSS classes to aid the
     * developer in further styling the element throughout the transition animation. Earlier versions
     * of ngAnimate may have caused natural CSS transitions to break and not render properly due to
     * $animate temporarily blocking transitions using `0s none` in order to allow the setup CSS class
     * (the `-add` or `-remove` class) to be applied without triggering an animation. However, as of
     * **version 1.3**, this workaround has been removed with ngAnimate and all non-ngAnimate CSS
     * class transitions are compatible with ngAnimate.
     *
     * There is, however, one special case when dealing with class-based transitions in ngAnimate.
     * When rendering class-based transitions that make use of the setup and active CSS classes
     * (e.g. `.fade-add` and `.fade-add-active` for when `.fade` is added) be sure to define
     * the transition value **on the active CSS class** and not the setup class.
     *
     * ```css
     * .fade-add {
 *   /&#42; remember to place a 0s transition here
 *      to ensure that the styles are applied instantly
 *      even if the element already has a transition style &#42;/
 *   transition:0s linear all;
 *
 *   /&#42; starting CSS styles &#42;/
 *   opacity:1;
 * }
     * .fade-add.fade-add-active {
 *   /&#42; this will be the length of the animation &#42;/
 *   transition:1s linear all;
 *   opacity:0;
 * }
     * ```
     *
     * The setup CSS class (in this case `.fade-add`) also has a transition style property, however, it
     * has a duration of zero. This may not be required, however, incase the browser is unable to render
     * the styling present in this CSS class instantly then it could be that the browser is attempting
     * to perform an unnecessary transition.
     *
     * This workaround, however, does not apply to  standard class-based transitions that are rendered
     * when a CSS class containing a transition is applied to an element:
     *
     * ```css
     * /&#42; this works as expected &#42;/
     * .fade {
 *   transition:1s linear all;
 *   opacity:0;
 * }
     * ```
     *
     * Please keep this in mind when coding the CSS markup that will be used within class-based transitions.
     * Also, try not to mix the two class-based animation flavors together since the CSS code may become
     * overly complex.
     *
     *
     * ### Preventing Collisions With Third Party Libraries
     *
     * Some third-party frameworks place animation duration defaults across many element or className
     * selectors in order to make their code small and reuseable. This can lead to issues with ngAnimate, which
     * is expecting actual animations on these elements and has to wait for their completion.
     *
     * You can prevent this unwanted behavior by using a prefix on all your animation classes:
     *
     * ```css
     * /&#42; prefixed with animate- &#42;/
     * .animate-fade-add.animate-fade-add-active {
 *   transition:1s linear all;
 *   opacity:0;
 * }
     * ```
     *
     * You then configure `$animate` to enforce this prefix:
     *
     * ```js
     * $animateProvider.classNameFilter(/animate-/);
     * ```
     * </div>
     *
     * ### CSS Staggering Animations
     * A Staggering animation is a collection of animations that are issued with a slight delay in between each successive operation resulting in a
     * curtain-like effect. The ngAnimate module (versions >=1.2) supports staggering animations and the stagger effect can be
     * performed by creating a **ng-EVENT-stagger** CSS class and attaching that class to the base CSS class used for
     * the animation. The style property expected within the stagger class can either be a **transition-delay** or an
     * **animation-delay** property (or both if your animation contains both transitions and keyframe animations).
     *
     * ```css
     * .my-animation.ng-enter {
 *   /&#42; standard transition code &#42;/
 *   -webkit-transition: 1s linear all;
 *   transition: 1s linear all;
 *   opacity:0;
 * }
     * .my-animation.ng-enter-stagger {
 *   /&#42; this will have a 100ms delay between each successive leave animation &#42;/
 *   -webkit-transition-delay: 0.1s;
 *   transition-delay: 0.1s;
 *
 *   /&#42; in case the stagger doesn't work then these two values
 *    must be set to 0 to avoid an accidental CSS inheritance &#42;/
 *   -webkit-transition-duration: 0s;
 *   transition-duration: 0s;
 * }
     * .my-animation.ng-enter.ng-enter-active {
 *   /&#42; standard transition styles &#42;/
 *   opacity:1;
 * }
     * ```
     *
     * Staggering animations work by default in ngRepeat (so long as the CSS class is defined). Outside of ngRepeat, to use staggering animations
     * on your own, they can be triggered by firing multiple calls to the same event on $animate. However, the restrictions surrounding this
     * are that each of the elements must have the same CSS className value as well as the same parent element. A stagger operation
     * will also be reset if more than 10ms has passed after the last animation has been fired.
     *
     * The following code will issue the **ng-leave-stagger** event on the element provided:
     *
     * ```js
     * var kids = parent.children();
     *
     * $animate.leave(kids[0]); //stagger index=0
     * $animate.leave(kids[1]); //stagger index=1
     * $animate.leave(kids[2]); //stagger index=2
     * $animate.leave(kids[3]); //stagger index=3
     * $animate.leave(kids[4]); //stagger index=4
     *
     * $timeout(function() {
 *   //stagger has reset itself
 *   $animate.leave(kids[5]); //stagger index=0
 *   $animate.leave(kids[6]); //stagger index=1
 * }, 100, false);
     * ```
     *
     * Stagger animations are currently only supported within CSS-defined animations.
     *
     * ## JavaScript-defined Animations
     * In the event that you do not want to use CSS3 transitions or CSS3 animations or if you wish to offer animations on browsers that do not
     * yet support CSS transitions/animations, then you can make use of JavaScript animations defined inside of your AngularJS module.
     *
     * ```js
     * //!annotate="YourApp" Your AngularJS Module|Replace this or ngModule with the module that you used to define your application.
     * var ngModule = angular.module('YourApp', ['ngAnimate']);
     * ngModule.animation('.my-crazy-animation', function() {
 *   return {
 *     enter: function(element, done) {
 *       //run the animation here and call done when the animation is complete
 *       return function(cancelled) {
 *         //this (optional) function will be called when the animation
 *         //completes or when the animation is cancelled (the cancelled
 *         //flag will be set to true if cancelled).
 *       };
 *     },
 *     leave: function(element, done) { },
 *     move: function(element, done) { },
 *
 *     //animation that can be triggered before the class is added
 *     beforeAddClass: function(element, className, done) { },
 *
 *     //animation that can be triggered after the class is added
 *     addClass: function(element, className, done) { },
 *
 *     //animation that can be triggered before the class is removed
 *     beforeRemoveClass: function(element, className, done) { },
 *
 *     //animation that can be triggered after the class is removed
 *     removeClass: function(element, className, done) { }
 *   };
 * });
     * ```
     *
     * JavaScript-defined animations are created with a CSS-like class selector and a collection of events which are set to run
     * a javascript callback function. When an animation is triggered, $animate will look for a matching animation which fits
     * the element's CSS class attribute value and then run the matching animation event function (if found).
     * In other words, if the CSS classes present on the animated element match any of the JavaScript animations then the callback function will
     * be executed. It should be also noted that only simple, single class selectors are allowed (compound class selectors are not supported).
     *
     * Within a JavaScript animation, an object containing various event callback animation functions is expected to be returned.
     * As explained above, these callbacks are triggered based on the animation event. Therefore if an enter animation is run,
     * and the JavaScript animation is found, then the enter callback will handle that animation (in addition to the CSS keyframe animation
     * or transition code that is defined via a stylesheet).
     *
     *
     * ### Applying Directive-specific Styles to an Animation
     * In some cases a directive or service may want to provide `$animate` with extra details that the animation will
     * include into its animation. Let's say for example we wanted to render an animation that animates an element
     * towards the mouse coordinates as to where the user clicked last. By collecting the X/Y coordinates of the click
     * (via the event parameter) we can set the `top` and `left` styles into an object and pass that into our function
     * call to `$animate.addClass`.
     *
     * ```js
     * canvas.on('click', function(e) {
 *   $animate.addClass(element, 'on', {
 *     to: {
 *       left : e.client.x + 'px',
 *       top : e.client.y + 'px'
 *     }
 *   }):
 * });
     * ```
     *
     * Now when the animation runs, and a transition or keyframe animation is picked up, then the animation itself will
     * also include and transition the styling of the `left` and `top` properties into its running animation. If we want
     * to provide some starting animation values then we can do so by placing the starting animations styles into an object
     * called `from` in the same object as the `to` animations.
     *
     * ```js
     * canvas.on('click', function(e) {
 *   $animate.addClass(element, 'on', {
 *     from: {
 *        position: 'absolute',
 *        left: '0px',
 *        top: '0px'
 *     },
 *     to: {
 *       left : e.client.x + 'px',
 *       top : e.client.y + 'px'
 *     }
 *   }):
 * });
     * ```
     *
     * Once the animation is complete or cancelled then the union of both the before and after styles are applied to the
     * element. If `ngAnimate` is not present then the styles will be applied immediately.
     *
     */

    angular.module('ngAnimate', ['ng'])

    /**
     * @ngdoc provider
     * @name $animateProvider
     * @description
     *
     * The `$animateProvider` allows developers to register JavaScript animation event handlers directly inside of a module.
     * When an animation is triggered, the $animate service will query the $animate service to find any animations that match
     * the provided name value.
     *
     * Requires the {@link ngAnimate `ngAnimate`} module to be installed.
     *
     * Please visit the {@link ngAnimate `ngAnimate`} module overview page learn more about how to use animations in your application.
     *
     */
        .directive('ngAnimateChildren', function () {
            var NG_ANIMATE_CHILDREN = '$$ngAnimateChildren';
            return function (scope, element, attrs) {
                var val = attrs.ngAnimateChildren;
                if (angular.isString(val) && val.length === 0) { //empty attribute
                    element.data(NG_ANIMATE_CHILDREN, true);
                } else {
                    scope.$watch(val, function (value) {
                        element.data(NG_ANIMATE_CHILDREN, !!value);
                    });
                }
            };
        })

        //this private service is only used within CSS-enabled animations
        //IE8 + IE9 do not support rAF natively, but that is fine since they
        //also don't support transitions and keyframes which means that the code
        //below will never be used by the two browsers.
        .factory('$$animateReflow', ['$$rAF', '$document', function ($$rAF, $document) {
            var bod = $document[0].body;
            return function (fn) {
                //the returned function acts as the cancellation function
                return $$rAF(function () {
                    //the line below will force the browser to perform a repaint
                    //so that all the animated elements within the animation frame
                    //will be properly updated and drawn on screen. This is
                    //required to perform multi-class CSS based animations with
                    //Firefox. DO NOT REMOVE THIS LINE.
                    var a = bod.offsetWidth + 1;
                    fn();
                });
            };
        }])

        .config(['$provide', '$animateProvider', function ($provide, $animateProvider) {
            var noop = angular.noop;
            var forEach = angular.forEach;
            var selectors = $animateProvider.$$selectors;
            var isArray = angular.isArray;
            var isString = angular.isString;
            var isObject = angular.isObject;

            var ELEMENT_NODE = 1;
            var NG_ANIMATE_STATE = '$$ngAnimateState';
            var NG_ANIMATE_CHILDREN = '$$ngAnimateChildren';
            var NG_ANIMATE_CLASS_NAME = 'ng-animate';
            var rootAnimateState = {running: true};

            function extractElementNode(element) {
                for (var i = 0; i < element.length; i++) {
                    var elm = element[i];
                    if (elm.nodeType == ELEMENT_NODE) {
                        return elm;
                    }
                }
            }

            function prepareElement(element) {
                return element && angular.element(element);
            }

            function stripCommentsFromElement(element) {
                return angular.element(extractElementNode(element));
            }

            function isMatchingElement(elm1, elm2) {
                return extractElementNode(elm1) == extractElementNode(elm2);
            }

            var $$jqLite;
            $provide.decorator('$animate',
                ['$delegate', '$$q', '$injector', '$sniffer', '$rootElement', '$$asyncCallback', '$rootScope', '$document', '$templateRequest', '$$jqLite',
                    function ($delegate, $$q, $injector, $sniffer, $rootElement, $$asyncCallback, $rootScope, $document, $templateRequest, $$$jqLite) {

                        $$jqLite = $$$jqLite;
                        $rootElement.data(NG_ANIMATE_STATE, rootAnimateState);

                        // Wait until all directive and route-related templates are downloaded and
                        // compiled. The $templateRequest.totalPendingRequests variable keeps track of
                        // all of the remote templates being currently downloaded. If there are no
                        // templates currently downloading then the watcher will still fire anyway.
                        var deregisterWatch = $rootScope.$watch(
                            function () {
                                return $templateRequest.totalPendingRequests;
                            },
                            function (val, oldVal) {
                                if (val !== 0) return;
                                deregisterWatch();

                                // Now that all templates have been downloaded, $animate will wait until
                                // the post digest queue is empty before enabling animations. By having two
                                // calls to $postDigest calls we can ensure that the flag is enabled at the
                                // very end of the post digest queue. Since all of the animations in $animate
                                // use $postDigest, it's important that the code below executes at the end.
                                // This basically means that the page is fully downloaded and compiled before
                                // any animations are triggered.
                                $rootScope.$$postDigest(function () {
                                    $rootScope.$$postDigest(function () {
                                        rootAnimateState.running = false;
                                    });
                                });
                            }
                        );

                        var globalAnimationCounter = 0;
                        var classNameFilter = $animateProvider.classNameFilter();
                        var isAnimatableClassName = !classNameFilter
                            ? function () {
                            return true;
                        }
                            : function (className) {
                            return classNameFilter.test(className);
                        };

                        function classBasedAnimationsBlocked(element, setter) {
                            var data = element.data(NG_ANIMATE_STATE) || {};
                            if (setter) {
                                data.running = true;
                                data.structural = true;
                                element.data(NG_ANIMATE_STATE, data);
                            }
                            return data.disabled || (data.running && data.structural);
                        }

                        function runAnimationPostDigest(fn) {
                            var cancelFn, defer = $$q.defer();
                            defer.promise.$$cancelFn = function () {
                                cancelFn && cancelFn();
                            };
                            $rootScope.$$postDigest(function () {
                                cancelFn = fn(function () {
                                    defer.resolve();
                                });
                            });
                            return defer.promise;
                        }

                        function parseAnimateOptions(options) {
                            // some plugin code may still be passing in the callback
                            // function as the last param for the $animate methods so
                            // it's best to only allow string or array values for now
                            if (isObject(options)) {
                                if (options.tempClasses && isString(options.tempClasses)) {
                                    options.tempClasses = options.tempClasses.split(/\s+/);
                                }
                                return options;
                            }
                        }

                        function resolveElementClasses(element, cache, runningAnimations) {
                            runningAnimations = runningAnimations || {};

                            var lookup = {};
                            forEach(runningAnimations, function (data, selector) {
                                forEach(selector.split(' '), function (s) {
                                    lookup[s] = data;
                                });
                            });

                            var hasClasses = Object.create(null);
                            forEach((element.attr('class') || '').split(/\s+/), function (className) {
                                hasClasses[className] = true;
                            });

                            var toAdd = [], toRemove = [];
                            forEach((cache && cache.classes) || [], function (status, className) {
                                var hasClass = hasClasses[className];
                                var matchingAnimation = lookup[className] || {};

                                // When addClass and removeClass is called then $animate will check to
                                // see if addClass and removeClass cancel each other out. When there are
                                // more calls to removeClass than addClass then the count falls below 0
                                // and then the removeClass animation will be allowed. Otherwise if the
                                // count is above 0 then that means an addClass animation will commence.
                                // Once an animation is allowed then the code will also check to see if
                                // there exists any on-going animation that is already adding or remvoing
                                // the matching CSS class.
                                if (status === false) {
                                    //does it have the class or will it have the class
                                    if (hasClass || matchingAnimation.event == 'addClass') {
                                        toRemove.push(className);
                                    }
                                } else if (status === true) {
                                    //is the class missing or will it be removed?
                                    if (!hasClass || matchingAnimation.event == 'removeClass') {
                                        toAdd.push(className);
                                    }
                                }
                            });

                            return (toAdd.length + toRemove.length) > 0 && [toAdd.join(' '), toRemove.join(' ')];
                        }

                        function lookup(name) {
                            if (name) {
                                var matches = [],
                                    flagMap = {},
                                    classes = name.substr(1).split('.');

                                //the empty string value is the default animation
                                //operation which performs CSS transition and keyframe
                                //animations sniffing. This is always included for each
                                //element animation procedure if the browser supports
                                //transitions and/or keyframe animations. The default
                                //animation is added to the top of the list to prevent
                                //any previous animations from affecting the element styling
                                //prior to the element being animated.
                                if ($sniffer.transitions || $sniffer.animations) {
                                    matches.push($injector.get(selectors['']));
                                }

                                for (var i = 0; i < classes.length; i++) {
                                    var klass = classes[i],
                                        selectorFactoryName = selectors[klass];
                                    if (selectorFactoryName && !flagMap[klass]) {
                                        matches.push($injector.get(selectorFactoryName));
                                        flagMap[klass] = true;
                                    }
                                }
                                return matches;
                            }
                        }

                        function animationRunner(element, animationEvent, className, options) {
                            //transcluded directives may sometimes fire an animation using only comment nodes
                            //best to catch this early on to prevent any animation operations from occurring
                            var node = element[0];
                            if (!node) {
                                return;
                            }

                            if (options) {
                                options.to = options.to || {};
                                options.from = options.from || {};
                            }

                            var classNameAdd;
                            var classNameRemove;
                            if (isArray(className)) {
                                classNameAdd = className[0];
                                classNameRemove = className[1];
                                if (!classNameAdd) {
                                    className = classNameRemove;
                                    animationEvent = 'removeClass';
                                } else if (!classNameRemove) {
                                    className = classNameAdd;
                                    animationEvent = 'addClass';
                                } else {
                                    className = classNameAdd + ' ' + classNameRemove;
                                }
                            }

                            var isSetClassOperation = animationEvent == 'setClass';
                            var isClassBased = isSetClassOperation
                                || animationEvent == 'addClass'
                                || animationEvent == 'removeClass'
                                || animationEvent == 'animate';

                            var currentClassName = element.attr('class');
                            var classes = currentClassName + ' ' + className;
                            if (!isAnimatableClassName(classes)) {
                                return;
                            }

                            var beforeComplete = noop,
                                beforeCancel = [],
                                before = [],
                                afterComplete = noop,
                                afterCancel = [],
                                after = [];

                            var animationLookup = (' ' + classes).replace(/\s+/g, '.');
                            forEach(lookup(animationLookup), function (animationFactory) {
                                var created = registerAnimation(animationFactory, animationEvent);
                                if (!created && isSetClassOperation) {
                                    registerAnimation(animationFactory, 'addClass');
                                    registerAnimation(animationFactory, 'removeClass');
                                }
                            });

                            function registerAnimation(animationFactory, event) {
                                var afterFn = animationFactory[event];
                                var beforeFn = animationFactory['before' + event.charAt(0).toUpperCase() + event.substr(1)];
                                if (afterFn || beforeFn) {
                                    if (event == 'leave') {
                                        beforeFn = afterFn;
                                        //when set as null then animation knows to skip this phase
                                        afterFn = null;
                                    }
                                    after.push({
                                        event: event, fn: afterFn
                                    });
                                    before.push({
                                        event: event, fn: beforeFn
                                    });
                                    return true;
                                }
                            }

                            function run(fns, cancellations, allCompleteFn) {
                                var animations = [];
                                forEach(fns, function (animation) {
                                    animation.fn && animations.push(animation);
                                });

                                var count = 0;

                                function afterAnimationComplete(index) {
                                    if (cancellations) {
                                        (cancellations[index] || noop)();
                                        if (++count < animations.length) return;
                                        cancellations = null;
                                    }
                                    allCompleteFn();
                                }

                                //The code below adds directly to the array in order to work with
                                //both sync and async animations. Sync animations are when the done()
                                //operation is called right away. DO NOT REFACTOR!
                                forEach(animations, function (animation, index) {
                                    var progress = function () {
                                        afterAnimationComplete(index);
                                    };
                                    switch (animation.event) {
                                        case 'setClass':
                                            cancellations.push(animation.fn(element, classNameAdd, classNameRemove, progress, options));
                                            break;
                                        case 'animate':
                                            cancellations.push(animation.fn(element, className, options.from, options.to, progress));
                                            break;
                                        case 'addClass':
                                            cancellations.push(animation.fn(element, classNameAdd || className, progress, options));
                                            break;
                                        case 'removeClass':
                                            cancellations.push(animation.fn(element, classNameRemove || className, progress, options));
                                            break;
                                        default:
                                            cancellations.push(animation.fn(element, progress, options));
                                            break;
                                    }
                                });

                                if (cancellations && cancellations.length === 0) {
                                    allCompleteFn();
                                }
                            }

                            return {
                                node: node,
                                event: animationEvent,
                                className: className,
                                isClassBased: isClassBased,
                                isSetClassOperation: isSetClassOperation,
                                applyStyles: function () {
                                    if (options) {
                                        element.css(angular.extend(options.from || {}, options.to || {}));
                                    }
                                },
                                before: function (allCompleteFn) {
                                    beforeComplete = allCompleteFn;
                                    run(before, beforeCancel, function () {
                                        beforeComplete = noop;
                                        allCompleteFn();
                                    });
                                },
                                after: function (allCompleteFn) {
                                    afterComplete = allCompleteFn;
                                    run(after, afterCancel, function () {
                                        afterComplete = noop;
                                        allCompleteFn();
                                    });
                                },
                                cancel: function () {
                                    if (beforeCancel) {
                                        forEach(beforeCancel, function (cancelFn) {
                                            (cancelFn || noop)(true);
                                        });
                                        beforeComplete(true);
                                    }
                                    if (afterCancel) {
                                        forEach(afterCancel, function (cancelFn) {
                                            (cancelFn || noop)(true);
                                        });
                                        afterComplete(true);
                                    }
                                }
                            };
                        }

                        /**
                         * @ngdoc service
                         * @name $animate
                         * @kind object
                         *
                         * @description
                         * The `$animate` service provides animation detection support while performing DOM operations (enter, leave and move) as well as during addClass and removeClass operations.
                         * When any of these operations are run, the $animate service
                         * will examine any JavaScript-defined animations (which are defined by using the $animateProvider provider object)
                         * as well as any CSS-defined animations against the CSS classes present on the element once the DOM operation is run.
                         *
                         * The `$animate` service is used behind the scenes with pre-existing directives and animation with these directives
                         * will work out of the box without any extra configuration.
                         *
                         * Requires the {@link ngAnimate `ngAnimate`} module to be installed.
                         *
                         * Please visit the {@link ngAnimate `ngAnimate`} module overview page learn more about how to use animations in your application.
                         * ## Callback Promises
                         * With AngularJS 1.3, each of the animation methods, on the `$animate` service, return a promise when called. The
                         * promise itself is then resolved once the animation has completed itself, has been cancelled or has been
                         * skipped due to animations being disabled. (Note that even if the animation is cancelled it will still
                         * call the resolve function of the animation.)
                         *
                         * ```js
                         * $animate.enter(element, container).then(function() {
       *   //...this is called once the animation is complete...
       * });
                         * ```
                         *
                         * Also note that, due to the nature of the callback promise, if any Angular-specific code (like changing the scope,
                         * location of the page, etc...) is executed within the callback promise then be sure to wrap the code using
                         * `$scope.$apply(...)`;
                         *
                         * ```js
                         * $animate.leave(element).then(function() {
       *   $scope.$apply(function() {
       *     $location.path('/new-page');
       *   });
       * });
                         * ```
                         *
                         * An animation can also be cancelled by calling the `$animate.cancel(promise)` method with the provided
                         * promise that was returned when the animation was started.
                         *
                         * ```js
                         * var promise = $animate.addClass(element, 'super-long-animation');
                         * promise.then(function() {
       *   //this will still be called even if cancelled
       * });
                         *
                         * element.on('click', function() {
       *   //tooo lazy to wait for the animation to end
       *   $animate.cancel(promise);
       * });
                         * ```
                         *
                         * (Keep in mind that the promise cancellation is unique to `$animate` since promises in
                         * general cannot be cancelled.)
                         *
                         */
                        return {
                            /**
                             * @ngdoc method
                             * @name $animate#animate
                             * @kind function
                             *
                             * @description
                             * Performs an inline animation on the element which applies the provided `to` and `from` CSS styles to the element.
                             * If any detected CSS transition, keyframe or JavaScript matches the provided `className` value then the animation
                             * will take on the provided styles. For example, if a transition animation is set for the given className then the
                             * provided `from` and `to` styles will be applied alongside the given transition. If a JavaScript animation is
                             * detected then the provided styles will be given in as function paramters.
                             *
                             * ```js
                             * ngModule.animation('.my-inline-animation', function() {
         *   return {
         *     animate : function(element, className, from, to, done) {
         *       //styles
         *     }
         *   }
         * });
                             * ```
                             *
                             * Below is a breakdown of each step that occurs during the `animate` animation:
                             *
                             * | Animation Step                                                                                                        | What the element class attribute looks like                  |
                             * |-----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
                             * | 1. `$animate.animate(...)` is called                                                                                  | `class="my-animation"`                                       |
                             * | 2. `$animate` waits for the next digest to start the animation                                                        | `class="my-animation ng-animate"`                            |
                             * | 3. `$animate` runs the JavaScript-defined animations detected on the element                                          | `class="my-animation ng-animate"`                            |
                             * | 4. the `className` class value is added to the element                                                                | `class="my-animation ng-animate className"`                  |
                             * | 5. `$animate` scans the element styles to get the CSS transition/animation duration and delay                         | `class="my-animation ng-animate className"`                  |
                             * | 6. `$animate` blocks all CSS transitions on the element to ensure the `.className` class styling is applied right away| `class="my-animation ng-animate className"`                  |
                             * | 7. `$animate` applies the provided collection of `from` CSS styles to the element                                     | `class="my-animation ng-animate className"`                  |
                             * | 8. `$animate` waits for a single animation frame (this performs a reflow)                                             | `class="my-animation ng-animate className"`                  |
                             * | 9. `$animate` removes the CSS transition block placed on the element                                                  | `class="my-animation ng-animate className"`                  |
                             * | 10. the `className-active` class is added (this triggers the CSS transition/animation)                                | `class="my-animation ng-animate className className-active"` |
                             * | 11. `$animate` applies the collection of `to` CSS styles to the element which are then handled by the transition      | `class="my-animation ng-animate className className-active"` |
                             * | 12. `$animate` waits for the animation to complete (via events and timeout)                                           | `class="my-animation ng-animate className className-active"` |
                             * | 13. The animation ends and all generated CSS classes are removed from the element                                     | `class="my-animation"`                                       |
                             * | 14. The returned promise is resolved.                                                                                 | `class="my-animation"`                                       |
                             *
                             * @param {DOMElement} element the element that will be the focus of the enter animation
                             * @param {object} from a collection of CSS styles that will be applied to the element at the start of the animation
                             * @param {object} to a collection of CSS styles that the element will animate towards
                             * @param {string=} className an optional CSS class that will be added to the element for the duration of the animation (the default class is `ng-inline-animate`)
                             * @param {object=} options an optional collection of options that will be picked up by the CSS transition/animation
                             * @return {Promise} the animation callback promise
                             */
                            animate: function (element, from, to, className, options) {
                                className = className || 'ng-inline-animate';
                                options = parseAnimateOptions(options) || {};
                                options.from = to ? from : null;
                                options.to = to ? to : from;

                                return runAnimationPostDigest(function (done) {
                                    return performAnimation('animate', className, stripCommentsFromElement(element), null, null, noop, options, done);
                                });
                            },

                            /**
                             * @ngdoc method
                             * @name $animate#enter
                             * @kind function
                             *
                             * @description
                             * Appends the element to the parentElement element that resides in the document and then runs the enter animation. Once
                             * the animation is started, the following CSS classes will be present on the element for the duration of the animation:
                             *
                             * Below is a breakdown of each step that occurs during enter animation:
                             *
                             * | Animation Step                                                                                                        | What the element class attribute looks like                |
                             * |-----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
                             * | 1. `$animate.enter(...)` is called                                                                                    | `class="my-animation"`                                     |
                             * | 2. element is inserted into the `parentElement` element or beside the `afterElement` element                          | `class="my-animation"`                                     |
                             * | 3. `$animate` waits for the next digest to start the animation                                                        | `class="my-animation ng-animate"`                          |
                             * | 4. `$animate` runs the JavaScript-defined animations detected on the element                                          | `class="my-animation ng-animate"`                          |
                             * | 5. the `.ng-enter` class is added to the element                                                                      | `class="my-animation ng-animate ng-enter"`                 |
                             * | 6. `$animate` scans the element styles to get the CSS transition/animation duration and delay                         | `class="my-animation ng-animate ng-enter"`                 |
                             * | 7. `$animate` blocks all CSS transitions on the element to ensure the `.ng-enter` class styling is applied right away | `class="my-animation ng-animate ng-enter"`                 |
                             * | 8. `$animate` waits for a single animation frame (this performs a reflow)                                             | `class="my-animation ng-animate ng-enter"`                 |
                             * | 9. `$animate` removes the CSS transition block placed on the element                                                  | `class="my-animation ng-animate ng-enter"`                 |
                             * | 10. the `.ng-enter-active` class is added (this triggers the CSS transition/animation)                                | `class="my-animation ng-animate ng-enter ng-enter-active"` |
                             * | 11. `$animate` waits for the animation to complete (via events and timeout)                                           | `class="my-animation ng-animate ng-enter ng-enter-active"` |
                             * | 12. The animation ends and all generated CSS classes are removed from the element                                     | `class="my-animation"`                                     |
                             * | 13. The returned promise is resolved.                                                                                 | `class="my-animation"`                                     |
                             *
                             * @param {DOMElement} element the element that will be the focus of the enter animation
                             * @param {DOMElement} parentElement the parent element of the element that will be the focus of the enter animation
                             * @param {DOMElement} afterElement the sibling element (which is the previous element) of the element that will be the focus of the enter animation
                             * @param {object=} options an optional collection of options that will be picked up by the CSS transition/animation
                             * @return {Promise} the animation callback promise
                             */
                            enter: function (element, parentElement, afterElement, options) {
                                options = parseAnimateOptions(options);
                                element = angular.element(element);
                                parentElement = prepareElement(parentElement);
                                afterElement = prepareElement(afterElement);

                                classBasedAnimationsBlocked(element, true);
                                $delegate.enter(element, parentElement, afterElement);
                                return runAnimationPostDigest(function (done) {
                                    return performAnimation('enter', 'ng-enter', stripCommentsFromElement(element), parentElement, afterElement, noop, options, done);
                                });
                            },

                            /**
                             * @ngdoc method
                             * @name $animate#leave
                             * @kind function
                             *
                             * @description
                             * Runs the leave animation operation and, upon completion, removes the element from the DOM. Once
                             * the animation is started, the following CSS classes will be added for the duration of the animation:
                             *
                             * Below is a breakdown of each step that occurs during leave animation:
                             *
                             * | Animation Step                                                                                                        | What the element class attribute looks like                |
                             * |-----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
                             * | 1. `$animate.leave(...)` is called                                                                                    | `class="my-animation"`                                     |
                             * | 2. `$animate` runs the JavaScript-defined animations detected on the element                                          | `class="my-animation ng-animate"`                          |
                             * | 3. `$animate` waits for the next digest to start the animation                                                        | `class="my-animation ng-animate"`                          |
                             * | 4. the `.ng-leave` class is added to the element                                                                      | `class="my-animation ng-animate ng-leave"`                 |
                             * | 5. `$animate` scans the element styles to get the CSS transition/animation duration and delay                         | `class="my-animation ng-animate ng-leave"`                 |
                             * | 6. `$animate` blocks all CSS transitions on the element to ensure the `.ng-leave` class styling is applied right away | `class="my-animation ng-animate ng-leave"`                 |
                             * | 7. `$animate` waits for a single animation frame (this performs a reflow)                                             | `class="my-animation ng-animate ng-leave"`                 |
                             * | 8. `$animate` removes the CSS transition block placed on the element                                                  | `class="my-animation ng-animate ng-leave"`                 |
                             * | 9. the `.ng-leave-active` class is added (this triggers the CSS transition/animation)                                 | `class="my-animation ng-animate ng-leave ng-leave-active"` |
                             * | 10. `$animate` waits for the animation to complete (via events and timeout)                                           | `class="my-animation ng-animate ng-leave ng-leave-active"` |
                             * | 11. The animation ends and all generated CSS classes are removed from the element                                     | `class="my-animation"`                                     |
                             * | 12. The element is removed from the DOM                                                                               | ...                                                        |
                             * | 13. The returned promise is resolved.                                                                                 | ...                                                        |
                             *
                             * @param {DOMElement} element the element that will be the focus of the leave animation
                             * @param {object=} options an optional collection of styles that will be picked up by the CSS transition/animation
                             * @return {Promise} the animation callback promise
                             */
                            leave: function (element, options) {
                                options = parseAnimateOptions(options);
                                element = angular.element(element);

                                cancelChildAnimations(element);
                                classBasedAnimationsBlocked(element, true);
                                return runAnimationPostDigest(function (done) {
                                    return performAnimation('leave', 'ng-leave', stripCommentsFromElement(element), null, null, function () {
                                        $delegate.leave(element);
                                    }, options, done);
                                });
                            },

                            /**
                             * @ngdoc method
                             * @name $animate#move
                             * @kind function
                             *
                             * @description
                             * Fires the move DOM operation. Just before the animation starts, the animate service will either append it into the parentElement container or
                             * add the element directly after the afterElement element if present. Then the move animation will be run. Once
                             * the animation is started, the following CSS classes will be added for the duration of the animation:
                             *
                             * Below is a breakdown of each step that occurs during move animation:
                             *
                             * | Animation Step                                                                                                       | What the element class attribute looks like              |
                             * |----------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
                             * | 1. `$animate.move(...)` is called                                                                                    | `class="my-animation"`                                   |
                             * | 2. element is moved into the parentElement element or beside the afterElement element                                | `class="my-animation"`                                   |
                             * | 3. `$animate` waits for the next digest to start the animation                                                       | `class="my-animation ng-animate"`                        |
                             * | 4. `$animate` runs the JavaScript-defined animations detected on the element                                         | `class="my-animation ng-animate"`                        |
                             * | 5. the `.ng-move` class is added to the element                                                                      | `class="my-animation ng-animate ng-move"`                |
                             * | 6. `$animate` scans the element styles to get the CSS transition/animation duration and delay                        | `class="my-animation ng-animate ng-move"`                |
                             * | 7. `$animate` blocks all CSS transitions on the element to ensure the `.ng-move` class styling is applied right away | `class="my-animation ng-animate ng-move"`                |
                             * | 8. `$animate` waits for a single animation frame (this performs a reflow)                                            | `class="my-animation ng-animate ng-move"`                |
                             * | 9. `$animate` removes the CSS transition block placed on the element                                                 | `class="my-animation ng-animate ng-move"`                |
                             * | 10. the `.ng-move-active` class is added (this triggers the CSS transition/animation)                                | `class="my-animation ng-animate ng-move ng-move-active"` |
                             * | 11. `$animate` waits for the animation to complete (via events and timeout)                                          | `class="my-animation ng-animate ng-move ng-move-active"` |
                             * | 12. The animation ends and all generated CSS classes are removed from the element                                    | `class="my-animation"`                                   |
                             * | 13. The returned promise is resolved.                                                                                | `class="my-animation"`                                   |
                             *
                             * @param {DOMElement} element the element that will be the focus of the move animation
                             * @param {DOMElement} parentElement the parentElement element of the element that will be the focus of the move animation
                             * @param {DOMElement} afterElement the sibling element (which is the previous element) of the element that will be the focus of the move animation
                             * @param {object=} options an optional collection of styles that will be picked up by the CSS transition/animation
                             * @return {Promise} the animation callback promise
                             */
                            move: function (element, parentElement, afterElement, options) {
                                options = parseAnimateOptions(options);
                                element = angular.element(element);
                                parentElement = prepareElement(parentElement);
                                afterElement = prepareElement(afterElement);

                                cancelChildAnimations(element);
                                classBasedAnimationsBlocked(element, true);
                                $delegate.move(element, parentElement, afterElement);
                                return runAnimationPostDigest(function (done) {
                                    return performAnimation('move', 'ng-move', stripCommentsFromElement(element), parentElement, afterElement, noop, options, done);
                                });
                            },

                            /**
                             * @ngdoc method
                             * @name $animate#addClass
                             *
                             * @description
                             * Triggers a custom animation event based off the className variable and then attaches the className value to the element as a CSS class.
                             * Unlike the other animation methods, the animate service will suffix the className value with {@type -add} in order to provide
                             * the animate service the setup and active CSS classes in order to trigger the animation (this will be skipped if no CSS transitions
                             * or keyframes are defined on the -add-active or base CSS class).
                             *
                             * Below is a breakdown of each step that occurs during addClass animation:
                             *
                             * | Animation Step                                                                                         | What the element class attribute looks like                        |
                             * |--------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
                             * | 1. `$animate.addClass(element, 'super')` is called                                                     | `class="my-animation"`                                             |
                             * | 2. `$animate` runs the JavaScript-defined animations detected on the element                           | `class="my-animation ng-animate"`                                  |
                             * | 3. the `.super-add` class is added to the element                                                      | `class="my-animation ng-animate super-add"`                        |
                             * | 4. `$animate` waits for a single animation frame (this performs a reflow)                              | `class="my-animation ng-animate super-add"`                        |
                             * | 5. the `.super` and `.super-add-active` classes are added (this triggers the CSS transition/animation) | `class="my-animation ng-animate super super-add super-add-active"` |
                             * | 6. `$animate` scans the element styles to get the CSS transition/animation duration and delay          | `class="my-animation ng-animate super super-add super-add-active"` |
                             * | 7. `$animate` waits for the animation to complete (via events and timeout)                             | `class="my-animation ng-animate super super-add super-add-active"` |
                             * | 8. The animation ends and all generated CSS classes are removed from the element                       | `class="my-animation super"`                                       |
                             * | 9. The super class is kept on the element                                                              | `class="my-animation super"`                                       |
                             * | 10. The returned promise is resolved.                                                                  | `class="my-animation super"`                                       |
                             *
                             * @param {DOMElement} element the element that will be animated
                             * @param {string} className the CSS class that will be added to the element and then animated
                             * @param {object=} options an optional collection of styles that will be picked up by the CSS transition/animation
                             * @return {Promise} the animation callback promise
                             */
                            addClass: function (element, className, options) {
                                return this.setClass(element, className, [], options);
                            },

                            /**
                             * @ngdoc method
                             * @name $animate#removeClass
                             *
                             * @description
                             * Triggers a custom animation event based off the className variable and then removes the CSS class provided by the className value
                             * from the element. Unlike the other animation methods, the animate service will suffix the className value with {@type -remove} in
                             * order to provide the animate service the setup and active CSS classes in order to trigger the animation (this will be skipped if
                             * no CSS transitions or keyframes are defined on the -remove or base CSS classes).
                             *
                             * Below is a breakdown of each step that occurs during removeClass animation:
                             *
                             * | Animation Step                                                                                                       | What the element class attribute looks like                        |
                             * |----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
                             * | 1. `$animate.removeClass(element, 'super')` is called                                                                | `class="my-animation super"`                                       |
                             * | 2. `$animate` runs the JavaScript-defined animations detected on the element                                         | `class="my-animation super ng-animate"`                            |
                             * | 3. the `.super-remove` class is added to the element                                                                 | `class="my-animation super ng-animate super-remove"`               |
                             * | 4. `$animate` waits for a single animation frame (this performs a reflow)                                            | `class="my-animation super ng-animate super-remove"`               |
                             * | 5. the `.super-remove-active` classes are added and `.super` is removed (this triggers the CSS transition/animation) | `class="my-animation ng-animate super-remove super-remove-active"` |
                             * | 6. `$animate` scans the element styles to get the CSS transition/animation duration and delay                        | `class="my-animation ng-animate super-remove super-remove-active"` |
                             * | 7. `$animate` waits for the animation to complete (via events and timeout)                                           | `class="my-animation ng-animate super-remove super-remove-active"` |
                             * | 8. The animation ends and all generated CSS classes are removed from the element                                     | `class="my-animation"`                                             |
                             * | 9. The returned promise is resolved.                                                                                 | `class="my-animation"`                                             |
                             *
                             *
                             * @param {DOMElement} element the element that will be animated
                             * @param {string} className the CSS class that will be animated and then removed from the element
                             * @param {object=} options an optional collection of styles that will be picked up by the CSS transition/animation
                             * @return {Promise} the animation callback promise
                             */
                            removeClass: function (element, className, options) {
                                return this.setClass(element, [], className, options);
                            },

                            /**
                             *
                             * @ngdoc method
                             * @name $animate#setClass
                             *
                             * @description Adds and/or removes the given CSS classes to and from the element.
                             * Once complete, the `done()` callback will be fired (if provided).
                             *
                             * | Animation Step                                                                                                                               | What the element class attribute looks like                                            |
                             * |----------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
                             * | 1. `$animate.setClass(element, 'on', 'off')` is called                                                                                       | `class="my-animation off"`                                                             |
                             * | 2. `$animate` runs the JavaScript-defined animations detected on the element                                                                 | `class="my-animation ng-animate off"`                                                  |
                             * | 3. the `.on-add` and `.off-remove` classes are added to the element                                                                          | `class="my-animation ng-animate on-add off-remove off"`                                |
                             * | 4. `$animate` waits for a single animation frame (this performs a reflow)                                                                    | `class="my-animation ng-animate on-add off-remove off"`                                |
                             * | 5. the `.on`, `.on-add-active` and `.off-remove-active` classes are added and `.off` is removed (this triggers the CSS transition/animation) | `class="my-animation ng-animate on on-add on-add-active off-remove off-remove-active"` |
                             * | 6. `$animate` scans the element styles to get the CSS transition/animation duration and delay                                                | `class="my-animation ng-animate on on-add on-add-active off-remove off-remove-active"` |
                             * | 7. `$animate` waits for the animation to complete (via events and timeout)                                                                   | `class="my-animation ng-animate on on-add on-add-active off-remove off-remove-active"` |
                             * | 8. The animation ends and all generated CSS classes are removed from the element                                                             | `class="my-animation on"`                                                              |
                             * | 9. The returned promise is resolved.                                                                                                         | `class="my-animation on"`                                                              |
                             *
                             * @param {DOMElement} element the element which will have its CSS classes changed
                             *   removed from it
                             * @param {string} add the CSS classes which will be added to the element
                             * @param {string} remove the CSS class which will be removed from the element
                             *   CSS classes have been set on the element
                             * @param {object=} options an optional collection of styles that will be picked up by the CSS transition/animation
                             * @return {Promise} the animation callback promise
                             */
                            setClass: function (element, add, remove, options) {
                                options = parseAnimateOptions(options);

                                var STORAGE_KEY = '$$animateClasses';
                                element = angular.element(element);
                                element = stripCommentsFromElement(element);

                                if (classBasedAnimationsBlocked(element)) {
                                    return $delegate.$$setClassImmediately(element, add, remove, options);
                                }

                                // we're using a combined array for both the add and remove
                                // operations since the ORDER OF addClass and removeClass matters
                                var classes, cache = element.data(STORAGE_KEY);
                                var hasCache = !!cache;
                                if (!cache) {
                                    cache = {};
                                    cache.classes = {};
                                }
                                classes = cache.classes;

                                add = isArray(add) ? add : add.split(' ');
                                forEach(add, function (c) {
                                    if (c && c.length) {
                                        classes[c] = true;
                                    }
                                });

                                remove = isArray(remove) ? remove : remove.split(' ');
                                forEach(remove, function (c) {
                                    if (c && c.length) {
                                        classes[c] = false;
                                    }
                                });

                                if (hasCache) {
                                    if (options && cache.options) {
                                        cache.options = angular.extend(cache.options || {}, options);
                                    }

                                    //the digest cycle will combine all the animations into one function
                                    return cache.promise;
                                } else {
                                    element.data(STORAGE_KEY, cache = {
                                        classes: classes,
                                        options: options
                                    });
                                }

                                return cache.promise = runAnimationPostDigest(function (done) {
                                    var parentElement = element.parent();
                                    var elementNode = extractElementNode(element);
                                    var parentNode = elementNode.parentNode;
                                    // TODO(matsko): move this code into the animationsDisabled() function once #8092 is fixed
                                    if (!parentNode || parentNode['$$NG_REMOVED'] || elementNode['$$NG_REMOVED']) {
                                        done();
                                        return;
                                    }

                                    var cache = element.data(STORAGE_KEY);
                                    element.removeData(STORAGE_KEY);

                                    var state = element.data(NG_ANIMATE_STATE) || {};
                                    var classes = resolveElementClasses(element, cache, state.active);
                                    return !classes
                                        ? done()
                                        : performAnimation('setClass', classes, element, parentElement, null, function () {
                                        if (classes[0]) $delegate.$$addClassImmediately(element, classes[0]);
                                        if (classes[1]) $delegate.$$removeClassImmediately(element, classes[1]);
                                    }, cache.options, done);
                                });
                            },

                            /**
                             * @ngdoc method
                             * @name $animate#cancel
                             * @kind function
                             *
                             * @param {Promise} animationPromise The animation promise that is returned when an animation is started.
                             *
                             * @description
                             * Cancels the provided animation.
                             */
                            cancel: function (promise) {
                                promise.$$cancelFn();
                            },

                            /**
                             * @ngdoc method
                             * @name $animate#enabled
                             * @kind function
                             *
                             * @param {boolean=} value If provided then set the animation on or off.
                             * @param {DOMElement=} element If provided then the element will be used to represent the enable/disable operation
                             * @return {boolean} Current animation state.
                             *
                             * @description
                             * Globally enables/disables animations.
                             *
                             */
                            enabled: function (value, element) {
                                switch (arguments.length) {
                                    case 2:
                                        if (value) {
                                            cleanup(element);
                                        } else {
                                            var data = element.data(NG_ANIMATE_STATE) || {};
                                            data.disabled = true;
                                            element.data(NG_ANIMATE_STATE, data);
                                        }
                                        break;

                                    case 1:
                                        rootAnimateState.disabled = !value;
                                        break;

                                    default:
                                        value = !rootAnimateState.disabled;
                                        break;
                                }
                                return !!value;
                            }
                        };

                        /*
                         all animations call this shared animation triggering function internally.
                         The animationEvent variable refers to the JavaScript animation event that will be triggered
                         and the className value is the name of the animation that will be applied within the
                         CSS code. Element, `parentElement` and `afterElement` are provided DOM elements for the animation
                         and the onComplete callback will be fired once the animation is fully complete.
                         */
                        function performAnimation(animationEvent, className, element, parentElement, afterElement, domOperation, options, doneCallback) {
                            var noopCancel = noop;
                            var runner = animationRunner(element, animationEvent, className, options);
                            if (!runner) {
                                fireDOMOperation();
                                fireBeforeCallbackAsync();
                                fireAfterCallbackAsync();
                                closeAnimation();
                                return noopCancel;
                            }

                            animationEvent = runner.event;
                            className = runner.className;
                            var elementEvents = angular.element._data(runner.node);
                            elementEvents = elementEvents && elementEvents.events;

                            if (!parentElement) {
                                parentElement = afterElement ? afterElement.parent() : element.parent();
                            }

                            //skip the animation if animations are disabled, a parent is already being animated,
                            //the element is not currently attached to the document body or then completely close
                            //the animation if any matching animations are not found at all.
                            //NOTE: IE8 + IE9 should close properly (run closeAnimation()) in case an animation was found.
                            if (animationsDisabled(element, parentElement)) {
                                fireDOMOperation();
                                fireBeforeCallbackAsync();
                                fireAfterCallbackAsync();
                                closeAnimation();
                                return noopCancel;
                            }

                            var ngAnimateState = element.data(NG_ANIMATE_STATE) || {};
                            var runningAnimations = ngAnimateState.active || {};
                            var totalActiveAnimations = ngAnimateState.totalActive || 0;
                            var lastAnimation = ngAnimateState.last;
                            var skipAnimation = false;

                            if (totalActiveAnimations > 0) {
                                var animationsToCancel = [];
                                if (!runner.isClassBased) {
                                    if (animationEvent == 'leave' && runningAnimations['ng-leave']) {
                                        skipAnimation = true;
                                    } else {
                                        //cancel all animations when a structural animation takes place
                                        for (var klass in runningAnimations) {
                                            animationsToCancel.push(runningAnimations[klass]);
                                        }
                                        ngAnimateState = {};
                                        cleanup(element, true);
                                    }
                                } else if (lastAnimation.event == 'setClass') {
                                    animationsToCancel.push(lastAnimation);
                                    cleanup(element, className);
                                } else if (runningAnimations[className]) {
                                    var current = runningAnimations[className];
                                    if (current.event == animationEvent) {
                                        skipAnimation = true;
                                    } else {
                                        animationsToCancel.push(current);
                                        cleanup(element, className);
                                    }
                                }

                                if (animationsToCancel.length > 0) {
                                    forEach(animationsToCancel, function (operation) {
                                        operation.cancel();
                                    });
                                }
                            }

                            if (runner.isClassBased
                                && !runner.isSetClassOperation
                                && animationEvent != 'animate'
                                && !skipAnimation) {
                                skipAnimation = (animationEvent == 'addClass') == element.hasClass(className); //opposite of XOR
                            }

                            if (skipAnimation) {
                                fireDOMOperation();
                                fireBeforeCallbackAsync();
                                fireAfterCallbackAsync();
                                fireDoneCallbackAsync();
                                return noopCancel;
                            }

                            runningAnimations = ngAnimateState.active || {};
                            totalActiveAnimations = ngAnimateState.totalActive || 0;

                            if (animationEvent == 'leave') {
                                //there's no need to ever remove the listener since the element
                                //will be removed (destroyed) after the leave animation ends or
                                //is cancelled midway
                                element.one('$destroy', function (e) {
                                    var element = angular.element(this);
                                    var state = element.data(NG_ANIMATE_STATE);
                                    if (state) {
                                        var activeLeaveAnimation = state.active['ng-leave'];
                                        if (activeLeaveAnimation) {
                                            activeLeaveAnimation.cancel();
                                            cleanup(element, 'ng-leave');
                                        }
                                    }
                                });
                            }

                            //the ng-animate class does nothing, but it's here to allow for
                            //parent animations to find and cancel child animations when needed
                            $$jqLite.addClass(element, NG_ANIMATE_CLASS_NAME);
                            if (options && options.tempClasses) {
                                forEach(options.tempClasses, function (className) {
                                    $$jqLite.addClass(element, className);
                                });
                            }

                            var localAnimationCount = globalAnimationCounter++;
                            totalActiveAnimations++;
                            runningAnimations[className] = runner;

                            element.data(NG_ANIMATE_STATE, {
                                last: runner,
                                active: runningAnimations,
                                index: localAnimationCount,
                                totalActive: totalActiveAnimations
                            });

                            //first we run the before animations and when all of those are complete
                            //then we perform the DOM operation and run the next set of animations
                            fireBeforeCallbackAsync();
                            runner.before(function (cancelled) {
                                var data = element.data(NG_ANIMATE_STATE);
                                cancelled = cancelled || !data || !data.active[className] ||
                                    (runner.isClassBased && data.active[className].event != animationEvent);

                                fireDOMOperation();
                                if (cancelled === true) {
                                    closeAnimation();
                                } else {
                                    fireAfterCallbackAsync();
                                    runner.after(closeAnimation);
                                }
                            });

                            return runner.cancel;

                            function fireDOMCallback(animationPhase) {
                                var eventName = '$animate:' + animationPhase;
                                if (elementEvents && elementEvents[eventName] && elementEvents[eventName].length > 0) {
                                    $$asyncCallback(function () {
                                        element.triggerHandler(eventName, {
                                            event: animationEvent,
                                            className: className
                                        });
                                    });
                                }
                            }

                            function fireBeforeCallbackAsync() {
                                fireDOMCallback('before');
                            }

                            function fireAfterCallbackAsync() {
                                fireDOMCallback('after');
                            }

                            function fireDoneCallbackAsync() {
                                fireDOMCallback('close');
                                doneCallback();
                            }

                            //it is less complicated to use a flag than managing and canceling
                            //timeouts containing multiple callbacks.
                            function fireDOMOperation() {
                                if (!fireDOMOperation.hasBeenRun) {
                                    fireDOMOperation.hasBeenRun = true;
                                    domOperation();
                                }
                            }

                            function closeAnimation() {
                                if (!closeAnimation.hasBeenRun) {
                                    if (runner) { //the runner doesn't exist if it fails to instantiate
                                        runner.applyStyles();
                                    }

                                    closeAnimation.hasBeenRun = true;
                                    if (options && options.tempClasses) {
                                        forEach(options.tempClasses, function (className) {
                                            $$jqLite.removeClass(element, className);
                                        });
                                    }

                                    var data = element.data(NG_ANIMATE_STATE);
                                    if (data) {

                                        /* only structural animations wait for reflow before removing an
                                         animation, but class-based animations don't. An example of this
                                         failing would be when a parent HTML tag has a ng-class attribute
                                         causing ALL directives below to skip animations during the digest */
                                        if (runner && runner.isClassBased) {
                                            cleanup(element, className);
                                        } else {
                                            $$asyncCallback(function () {
                                                var data = element.data(NG_ANIMATE_STATE) || {};
                                                if (localAnimationCount == data.index) {
                                                    cleanup(element, className, animationEvent);
                                                }
                                            });
                                            element.data(NG_ANIMATE_STATE, data);
                                        }
                                    }
                                    fireDoneCallbackAsync();
                                }
                            }
                        }

                        function cancelChildAnimations(element) {
                            var node = extractElementNode(element);
                            if (node) {
                                var nodes = angular.isFunction(node.getElementsByClassName) ?
                                    node.getElementsByClassName(NG_ANIMATE_CLASS_NAME) :
                                    node.querySelectorAll('.' + NG_ANIMATE_CLASS_NAME);
                                forEach(nodes, function (element) {
                                    element = angular.element(element);
                                    var data = element.data(NG_ANIMATE_STATE);
                                    if (data && data.active) {
                                        forEach(data.active, function (runner) {
                                            runner.cancel();
                                        });
                                    }
                                });
                            }
                        }

                        function cleanup(element, className) {
                            if (isMatchingElement(element, $rootElement)) {
                                if (!rootAnimateState.disabled) {
                                    rootAnimateState.running = false;
                                    rootAnimateState.structural = false;
                                }
                            } else if (className) {
                                var data = element.data(NG_ANIMATE_STATE) || {};

                                var removeAnimations = className === true;
                                if (!removeAnimations && data.active && data.active[className]) {
                                    data.totalActive--;
                                    delete data.active[className];
                                }

                                if (removeAnimations || !data.totalActive) {
                                    $$jqLite.removeClass(element, NG_ANIMATE_CLASS_NAME);
                                    element.removeData(NG_ANIMATE_STATE);
                                }
                            }
                        }

                        function animationsDisabled(element, parentElement) {
                            if (rootAnimateState.disabled) {
                                return true;
                            }

                            if (isMatchingElement(element, $rootElement)) {
                                return rootAnimateState.running;
                            }

                            var allowChildAnimations, parentRunningAnimation, hasParent;
                            do {
                                //the element did not reach the root element which means that it
                                //is not apart of the DOM. Therefore there is no reason to do
                                //any animations on it
                                if (parentElement.length === 0) break;

                                var isRoot = isMatchingElement(parentElement, $rootElement);
                                var state = isRoot ? rootAnimateState : (parentElement.data(NG_ANIMATE_STATE) || {});
                                if (state.disabled) {
                                    return true;
                                }

                                //no matter what, for an animation to work it must reach the root element
                                //this implies that the element is attached to the DOM when the animation is run
                                if (isRoot) {
                                    hasParent = true;
                                }

                                //once a flag is found that is strictly false then everything before
                                //it will be discarded and all child animations will be restricted
                                if (allowChildAnimations !== false) {
                                    var animateChildrenFlag = parentElement.data(NG_ANIMATE_CHILDREN);
                                    if (angular.isDefined(animateChildrenFlag)) {
                                        allowChildAnimations = animateChildrenFlag;
                                    }
                                }

                                parentRunningAnimation = parentRunningAnimation ||
                                    state.running ||
                                    (state.last && !state.last.isClassBased);
                            }
                            while (parentElement = parentElement.parent());

                            return !hasParent || (!allowChildAnimations && parentRunningAnimation);
                        }
                    }]);

            $animateProvider.register('', ['$window', '$sniffer', '$timeout', '$$animateReflow',
                function ($window, $sniffer, $timeout, $$animateReflow) {
                    // Detect proper transitionend/animationend event names.
                    var CSS_PREFIX = '', TRANSITION_PROP, TRANSITIONEND_EVENT, ANIMATION_PROP, ANIMATIONEND_EVENT;

                    // If unprefixed events are not supported but webkit-prefixed are, use the latter.
                    // Otherwise, just use W3C names, browsers not supporting them at all will just ignore them.
                    // Note: Chrome implements `window.onwebkitanimationend` and doesn't implement `window.onanimationend`
                    // but at the same time dispatches the `animationend` event and not `webkitAnimationEnd`.
                    // Register both events in case `window.onanimationend` is not supported because of that,
                    // do the same for `transitionend` as Safari is likely to exhibit similar behavior.
                    // Also, the only modern browser that uses vendor prefixes for transitions/keyframes is webkit
                    // therefore there is no reason to test anymore for other vendor prefixes: http://caniuse.com/#search=transition
                    if (window.ontransitionend === undefined && window.onwebkittransitionend !== undefined) {
                        CSS_PREFIX = '-webkit-';
                        TRANSITION_PROP = 'WebkitTransition';
                        TRANSITIONEND_EVENT = 'webkitTransitionEnd transitionend';
                    } else {
                        TRANSITION_PROP = 'transition';
                        TRANSITIONEND_EVENT = 'transitionend';
                    }

                    if (window.onanimationend === undefined && window.onwebkitanimationend !== undefined) {
                        CSS_PREFIX = '-webkit-';
                        ANIMATION_PROP = 'WebkitAnimation';
                        ANIMATIONEND_EVENT = 'webkitAnimationEnd animationend';
                    } else {
                        ANIMATION_PROP = 'animation';
                        ANIMATIONEND_EVENT = 'animationend';
                    }

                    var DURATION_KEY = 'Duration';
                    var PROPERTY_KEY = 'Property';
                    var DELAY_KEY = 'Delay';
                    var ANIMATION_ITERATION_COUNT_KEY = 'IterationCount';
                    var ANIMATION_PLAYSTATE_KEY = 'PlayState';
                    var NG_ANIMATE_PARENT_KEY = '$$ngAnimateKey';
                    var NG_ANIMATE_CSS_DATA_KEY = '$$ngAnimateCSS3Data';
                    var ELAPSED_TIME_MAX_DECIMAL_PLACES = 3;
                    var CLOSING_TIME_BUFFER = 1.5;
                    var ONE_SECOND = 1000;

                    var lookupCache = {};
                    var parentCounter = 0;
                    var animationReflowQueue = [];
                    var cancelAnimationReflow;

                    function clearCacheAfterReflow() {
                        if (!cancelAnimationReflow) {
                            cancelAnimationReflow = $$animateReflow(function () {
                                animationReflowQueue = [];
                                cancelAnimationReflow = null;
                                lookupCache = {};
                            });
                        }
                    }

                    function afterReflow(element, callback) {
                        if (cancelAnimationReflow) {
                            cancelAnimationReflow();
                        }
                        animationReflowQueue.push(callback);
                        cancelAnimationReflow = $$animateReflow(function () {
                            forEach(animationReflowQueue, function (fn) {
                                fn();
                            });

                            animationReflowQueue = [];
                            cancelAnimationReflow = null;
                            lookupCache = {};
                        });
                    }

                    var closingTimer = null;
                    var closingTimestamp = 0;
                    var animationElementQueue = [];

                    function animationCloseHandler(element, totalTime) {
                        var node = extractElementNode(element);
                        element = angular.element(node);

                        //this item will be garbage collected by the closing
                        //animation timeout
                        animationElementQueue.push(element);

                        //but it may not need to cancel out the existing timeout
                        //if the timestamp is less than the previous one
                        var futureTimestamp = Date.now() + totalTime;
                        if (futureTimestamp <= closingTimestamp) {
                            return;
                        }

                        $timeout.cancel(closingTimer);

                        closingTimestamp = futureTimestamp;
                        closingTimer = $timeout(function () {
                            closeAllAnimations(animationElementQueue);
                            animationElementQueue = [];
                        }, totalTime, false);
                    }

                    function closeAllAnimations(elements) {
                        forEach(elements, function (element) {
                            var elementData = element.data(NG_ANIMATE_CSS_DATA_KEY);
                            if (elementData) {
                                forEach(elementData.closeAnimationFns, function (fn) {
                                    fn();
                                });
                            }
                        });
                    }

                    function getElementAnimationDetails(element, cacheKey) {
                        var data = cacheKey ? lookupCache[cacheKey] : null;
                        if (!data) {
                            var transitionDuration = 0;
                            var transitionDelay = 0;
                            var animationDuration = 0;
                            var animationDelay = 0;

                            //we want all the styles defined before and after
                            forEach(element, function (element) {
                                if (element.nodeType == ELEMENT_NODE) {
                                    var elementStyles = $window.getComputedStyle(element) || {};

                                    var transitionDurationStyle = elementStyles[TRANSITION_PROP + DURATION_KEY];
                                    transitionDuration = Math.max(parseMaxTime(transitionDurationStyle), transitionDuration);

                                    var transitionDelayStyle = elementStyles[TRANSITION_PROP + DELAY_KEY];
                                    transitionDelay = Math.max(parseMaxTime(transitionDelayStyle), transitionDelay);

                                    var animationDelayStyle = elementStyles[ANIMATION_PROP + DELAY_KEY];
                                    animationDelay = Math.max(parseMaxTime(elementStyles[ANIMATION_PROP + DELAY_KEY]), animationDelay);

                                    var aDuration = parseMaxTime(elementStyles[ANIMATION_PROP + DURATION_KEY]);

                                    if (aDuration > 0) {
                                        aDuration *= parseInt(elementStyles[ANIMATION_PROP + ANIMATION_ITERATION_COUNT_KEY], 10) || 1;
                                    }
                                    animationDuration = Math.max(aDuration, animationDuration);
                                }
                            });
                            data = {
                                total: 0,
                                transitionDelay: transitionDelay,
                                transitionDuration: transitionDuration,
                                animationDelay: animationDelay,
                                animationDuration: animationDuration
                            };
                            if (cacheKey) {
                                lookupCache[cacheKey] = data;
                            }
                        }
                        return data;
                    }

                    function parseMaxTime(str) {
                        var maxValue = 0;
                        var values = isString(str) ?
                            str.split(/\s*,\s*/) :
                            [];
                        forEach(values, function (value) {
                            maxValue = Math.max(parseFloat(value) || 0, maxValue);
                        });
                        return maxValue;
                    }

                    function getCacheKey(element) {
                        var parentElement = element.parent();
                        var parentID = parentElement.data(NG_ANIMATE_PARENT_KEY);
                        if (!parentID) {
                            parentElement.data(NG_ANIMATE_PARENT_KEY, ++parentCounter);
                            parentID = parentCounter;
                        }
                        return parentID + '-' + extractElementNode(element).getAttribute('class');
                    }

                    function animateSetup(animationEvent, element, className, styles) {
                        var structural = ['ng-enter', 'ng-leave', 'ng-move'].indexOf(className) >= 0;

                        var cacheKey = getCacheKey(element);
                        var eventCacheKey = cacheKey + ' ' + className;
                        var itemIndex = lookupCache[eventCacheKey] ? ++lookupCache[eventCacheKey].total : 0;

                        var stagger = {};
                        if (itemIndex > 0) {
                            var staggerClassName = className + '-stagger';
                            var staggerCacheKey = cacheKey + ' ' + staggerClassName;
                            var applyClasses = !lookupCache[staggerCacheKey];

                            applyClasses && $$jqLite.addClass(element, staggerClassName);

                            stagger = getElementAnimationDetails(element, staggerCacheKey);

                            applyClasses && $$jqLite.removeClass(element, staggerClassName);
                        }

                        $$jqLite.addClass(element, className);

                        var formerData = element.data(NG_ANIMATE_CSS_DATA_KEY) || {};
                        var timings = getElementAnimationDetails(element, eventCacheKey);
                        var transitionDuration = timings.transitionDuration;
                        var animationDuration = timings.animationDuration;

                        if (structural && transitionDuration === 0 && animationDuration === 0) {
                            $$jqLite.removeClass(element, className);
                            return false;
                        }

                        var blockTransition = styles || (structural && transitionDuration > 0);
                        var blockAnimation = animationDuration > 0 &&
                            stagger.animationDelay > 0 &&
                            stagger.animationDuration === 0;

                        var closeAnimationFns = formerData.closeAnimationFns || [];
                        element.data(NG_ANIMATE_CSS_DATA_KEY, {
                            stagger: stagger,
                            cacheKey: eventCacheKey,
                            running: formerData.running || 0,
                            itemIndex: itemIndex,
                            blockTransition: blockTransition,
                            closeAnimationFns: closeAnimationFns
                        });

                        var node = extractElementNode(element);

                        if (blockTransition) {
                            blockTransitions(node, true);
                            if (styles) {
                                element.css(styles);
                            }
                        }

                        if (blockAnimation) {
                            blockAnimations(node, true);
                        }

                        return true;
                    }

                    function animateRun(animationEvent, element, className, activeAnimationComplete, styles) {
                        var node = extractElementNode(element);
                        var elementData = element.data(NG_ANIMATE_CSS_DATA_KEY);
                        if (node.getAttribute('class').indexOf(className) == -1 || !elementData) {
                            activeAnimationComplete();
                            return;
                        }

                        var activeClassName = '';
                        var pendingClassName = '';
                        forEach(className.split(' '), function (klass, i) {
                            var prefix = (i > 0 ? ' ' : '') + klass;
                            activeClassName += prefix + '-active';
                            pendingClassName += prefix + '-pending';
                        });

                        var style = '';
                        var appliedStyles = [];
                        var itemIndex = elementData.itemIndex;
                        var stagger = elementData.stagger;
                        var staggerTime = 0;
                        if (itemIndex > 0) {
                            var transitionStaggerDelay = 0;
                            if (stagger.transitionDelay > 0 && stagger.transitionDuration === 0) {
                                transitionStaggerDelay = stagger.transitionDelay * itemIndex;
                            }

                            var animationStaggerDelay = 0;
                            if (stagger.animationDelay > 0 && stagger.animationDuration === 0) {
                                animationStaggerDelay = stagger.animationDelay * itemIndex;
                                appliedStyles.push(CSS_PREFIX + 'animation-play-state');
                            }

                            staggerTime = Math.round(Math.max(transitionStaggerDelay, animationStaggerDelay) * 100) / 100;
                        }

                        if (!staggerTime) {
                            $$jqLite.addClass(element, activeClassName);
                            if (elementData.blockTransition) {
                                blockTransitions(node, false);
                            }
                        }

                        var eventCacheKey = elementData.cacheKey + ' ' + activeClassName;
                        var timings = getElementAnimationDetails(element, eventCacheKey);
                        var maxDuration = Math.max(timings.transitionDuration, timings.animationDuration);
                        if (maxDuration === 0) {
                            $$jqLite.removeClass(element, activeClassName);
                            animateClose(element, className);
                            activeAnimationComplete();
                            return;
                        }

                        if (!staggerTime && styles && Object.keys(styles).length > 0) {
                            if (!timings.transitionDuration) {
                                element.css('transition', timings.animationDuration + 's linear all');
                                appliedStyles.push('transition');
                            }
                            element.css(styles);
                        }

                        var maxDelay = Math.max(timings.transitionDelay, timings.animationDelay);
                        var maxDelayTime = maxDelay * ONE_SECOND;

                        if (appliedStyles.length > 0) {
                            //the element being animated may sometimes contain comment nodes in
                            //the jqLite object, so we're safe to use a single variable to house
                            //the styles since there is always only one element being animated
                            var oldStyle = node.getAttribute('style') || '';
                            if (oldStyle.charAt(oldStyle.length - 1) !== ';') {
                                oldStyle += ';';
                            }
                            node.setAttribute('style', oldStyle + ' ' + style);
                        }

                        var startTime = Date.now();
                        var css3AnimationEvents = ANIMATIONEND_EVENT + ' ' + TRANSITIONEND_EVENT;
                        var animationTime = (maxDelay + maxDuration) * CLOSING_TIME_BUFFER;
                        var totalTime = (staggerTime + animationTime) * ONE_SECOND;

                        var staggerTimeout;
                        if (staggerTime > 0) {
                            $$jqLite.addClass(element, pendingClassName);
                            staggerTimeout = $timeout(function () {
                                staggerTimeout = null;

                                if (timings.transitionDuration > 0) {
                                    blockTransitions(node, false);
                                }
                                if (timings.animationDuration > 0) {
                                    blockAnimations(node, false);
                                }

                                $$jqLite.addClass(element, activeClassName);
                                $$jqLite.removeClass(element, pendingClassName);

                                if (styles) {
                                    if (timings.transitionDuration === 0) {
                                        element.css('transition', timings.animationDuration + 's linear all');
                                    }
                                    element.css(styles);
                                    appliedStyles.push('transition');
                                }
                            }, staggerTime * ONE_SECOND, false);
                        }

                        element.on(css3AnimationEvents, onAnimationProgress);
                        elementData.closeAnimationFns.push(function () {
                            onEnd();
                            activeAnimationComplete();
                        });

                        elementData.running++;
                        animationCloseHandler(element, totalTime);
                        return onEnd;

                        // This will automatically be called by $animate so
                        // there is no need to attach this internally to the
                        // timeout done method.
                        function onEnd() {
                            element.off(css3AnimationEvents, onAnimationProgress);
                            $$jqLite.removeClass(element, activeClassName);
                            $$jqLite.removeClass(element, pendingClassName);
                            if (staggerTimeout) {
                                $timeout.cancel(staggerTimeout);
                            }
                            animateClose(element, className);
                            var node = extractElementNode(element);
                            for (var i in appliedStyles) {
                                node.style.removeProperty(appliedStyles[i]);
                            }
                        }

                        function onAnimationProgress(event) {
                            event.stopPropagation();
                            var ev = event.originalEvent || event;
                            var timeStamp = ev.$manualTimeStamp || ev.timeStamp || Date.now();

                            /* Firefox (or possibly just Gecko) likes to not round values up
                             * when a ms measurement is used for the animation */
                            var elapsedTime = parseFloat(ev.elapsedTime.toFixed(ELAPSED_TIME_MAX_DECIMAL_PLACES));

                            /* $manualTimeStamp is a mocked timeStamp value which is set
                             * within browserTrigger(). This is only here so that tests can
                             * mock animations properly. Real events fallback to event.timeStamp,
                             * or, if they don't, then a timeStamp is automatically created for them.
                             * We're checking to see if the timeStamp surpasses the expected delay,
                             * but we're using elapsedTime instead of the timeStamp on the 2nd
                             * pre-condition since animations sometimes close off early */
                            if (Math.max(timeStamp - startTime, 0) >= maxDelayTime && elapsedTime >= maxDuration) {
                                activeAnimationComplete();
                            }
                        }
                    }

                    function blockTransitions(node, bool) {
                        node.style[TRANSITION_PROP + PROPERTY_KEY] = bool ? 'none' : '';
                    }

                    function blockAnimations(node, bool) {
                        node.style[ANIMATION_PROP + ANIMATION_PLAYSTATE_KEY] = bool ? 'paused' : '';
                    }

                    function animateBefore(animationEvent, element, className, styles) {
                        if (animateSetup(animationEvent, element, className, styles)) {
                            return function (cancelled) {
                                cancelled && animateClose(element, className);
                            };
                        }
                    }

                    function animateAfter(animationEvent, element, className, afterAnimationComplete, styles) {
                        if (element.data(NG_ANIMATE_CSS_DATA_KEY)) {
                            return animateRun(animationEvent, element, className, afterAnimationComplete, styles);
                        } else {
                            animateClose(element, className);
                            afterAnimationComplete();
                        }
                    }

                    function animate(animationEvent, element, className, animationComplete, options) {
                        //If the animateSetup function doesn't bother returning a
                        //cancellation function then it means that there is no animation
                        //to perform at all
                        var preReflowCancellation = animateBefore(animationEvent, element, className, options.from);
                        if (!preReflowCancellation) {
                            clearCacheAfterReflow();
                            animationComplete();
                            return;
                        }

                        //There are two cancellation functions: one is before the first
                        //reflow animation and the second is during the active state
                        //animation. The first function will take care of removing the
                        //data from the element which will not make the 2nd animation
                        //happen in the first place
                        var cancel = preReflowCancellation;
                        afterReflow(element, function () {
                            //once the reflow is complete then we point cancel to
                            //the new cancellation function which will remove all of the
                            //animation properties from the active animation
                            cancel = animateAfter(animationEvent, element, className, animationComplete, options.to);
                        });

                        return function (cancelled) {
                            (cancel || noop)(cancelled);
                        };
                    }

                    function animateClose(element, className) {
                        $$jqLite.removeClass(element, className);
                        var data = element.data(NG_ANIMATE_CSS_DATA_KEY);
                        if (data) {
                            if (data.running) {
                                data.running--;
                            }
                            if (!data.running || data.running === 0) {
                                element.removeData(NG_ANIMATE_CSS_DATA_KEY);
                            }
                        }
                    }

                    return {
                        animate: function (element, className, from, to, animationCompleted, options) {
                            options = options || {};
                            options.from = from;
                            options.to = to;
                            return animate('animate', element, className, animationCompleted, options);
                        },

                        enter: function (element, animationCompleted, options) {
                            options = options || {};
                            return animate('enter', element, 'ng-enter', animationCompleted, options);
                        },

                        leave: function (element, animationCompleted, options) {
                            options = options || {};
                            return animate('leave', element, 'ng-leave', animationCompleted, options);
                        },

                        move: function (element, animationCompleted, options) {
                            options = options || {};
                            return animate('move', element, 'ng-move', animationCompleted, options);
                        },

                        beforeSetClass: function (element, add, remove, animationCompleted, options) {
                            options = options || {};
                            var className = suffixClasses(remove, '-remove') + ' ' +
                                suffixClasses(add, '-add');
                            var cancellationMethod = animateBefore('setClass', element, className, options.from);
                            if (cancellationMethod) {
                                afterReflow(element, animationCompleted);
                                return cancellationMethod;
                            }
                            clearCacheAfterReflow();
                            animationCompleted();
                        },

                        beforeAddClass: function (element, className, animationCompleted, options) {
                            options = options || {};
                            var cancellationMethod = animateBefore('addClass', element, suffixClasses(className, '-add'), options.from);
                            if (cancellationMethod) {
                                afterReflow(element, animationCompleted);
                                return cancellationMethod;
                            }
                            clearCacheAfterReflow();
                            animationCompleted();
                        },

                        beforeRemoveClass: function (element, className, animationCompleted, options) {
                            options = options || {};
                            var cancellationMethod = animateBefore('removeClass', element, suffixClasses(className, '-remove'), options.from);
                            if (cancellationMethod) {
                                afterReflow(element, animationCompleted);
                                return cancellationMethod;
                            }
                            clearCacheAfterReflow();
                            animationCompleted();
                        },

                        setClass: function (element, add, remove, animationCompleted, options) {
                            options = options || {};
                            remove = suffixClasses(remove, '-remove');
                            add = suffixClasses(add, '-add');
                            var className = remove + ' ' + add;
                            return animateAfter('setClass', element, className, animationCompleted, options.to);
                        },

                        addClass: function (element, className, animationCompleted, options) {
                            options = options || {};
                            return animateAfter('addClass', element, suffixClasses(className, '-add'), animationCompleted, options.to);
                        },

                        removeClass: function (element, className, animationCompleted, options) {
                            options = options || {};
                            return animateAfter('removeClass', element, suffixClasses(className, '-remove'), animationCompleted, options.to);
                        }
                    };

                    function suffixClasses(classes, suffix) {
                        var className = '';
                        classes = isArray(classes) ? classes : classes.split(/\s+/);
                        forEach(classes, function (klass, i) {
                            if (klass && klass.length > 0) {
                                className += (i > 0 ? ' ' : '') + klass + suffix;
                            }
                        });
                        return className;
                    }
                }]);
        }]);


})(window, window.angular);


/**
 * @license AngularJS v1.3.15
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 * ngSanitize
 */
(function (window, angular, undefined) {
    'use strict';

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     *     Any commits to this file should be reviewed with security in mind.  *
     *   Changes to this file can potentially create security vulnerabilities. *
     *          An approval from 2 Core members with history of modifying      *
     *                         this file is required.                          *
     *                                                                         *
     *  Does the change somehow allow for arbitrary javascript to be executed? *
     *    Or allows for someone to change the prototype of built-in objects?   *
     *     Or gives undesired access to variables likes document or window?    *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

    var $sanitizeMinErr = angular.$$minErr('$sanitize');

    /**
     * @ngdoc module
     * @name ngSanitize
     * @description
     *
     * # ngSanitize
     *
     * The `ngSanitize` module provides functionality to sanitize HTML.
     *
     *
     * <div doc-module-components="ngSanitize"></div>
     *
     * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
     */

    /*
     * HTML Parser By Misko Hevery (misko@hevery.com)
     * based on:  HTML Parser By John Resig (ejohn.org)
     * Original code by Erik Arvidsson, Mozilla Public License
     * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
     *
     * // Use like so:
     * htmlParser(htmlString, {
     *     start: function(tag, attrs, unary) {},
     *     end: function(tag) {},
     *     chars: function(text) {},
     *     comment: function(text) {}
     * });
     *
     */


    /**
     * @ngdoc service
     * @name $sanitize
     * @kind function
     *
     * @description
     *   The input is sanitized by parsing the HTML into tokens. All safe tokens (from a whitelist) are
     *   then serialized back to properly escaped html string. This means that no unsafe input can make
     *   it into the returned string, however, since our parser is more strict than a typical browser
     *   parser, it's possible that some obscure input, which would be recognized as valid HTML by a
     *   browser, won't make it through the sanitizer. The input may also contain SVG markup.
     *   The whitelist is configured using the functions `aHrefSanitizationWhitelist` and
     *   `imgSrcSanitizationWhitelist` of {@link ng.$compileProvider `$compileProvider`}.
     *
     * @param {string} html HTML input.
     * @returns {string} Sanitized HTML.
     *
     * @example
     <example module="sanitizeExample" deps="angular-sanitize.js">
     <file name="index.html">
     <script>
     angular.module('sanitizeExample', ['ngSanitize'])
     .controller('ExampleController', ['$scope', '$sce', function($scope, $sce) {
             $scope.snippet =
               '<p style="color:blue">an html\n' +
               '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
               'snippet</p>';
             $scope.deliberatelyTrustDangerousSnippet = function() {
               return $sce.trustAsHtml($scope.snippet);
             };
           }]);
     </script>
     <div ng-controller="ExampleController">
     Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
     <table>
     <tr>
     <td>Directive</td>
     <td>How</td>
     <td>Source</td>
     <td>Rendered</td>
     </tr>
     <tr id="bind-html-with-sanitize">
     <td>ng-bind-html</td>
     <td>Automatically uses $sanitize</td>
     <td><pre>&lt;div ng-bind-html="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
     <td><div ng-bind-html="snippet"></div></td>
     </tr>
     <tr id="bind-html-with-trust">
     <td>ng-bind-html</td>
     <td>Bypass $sanitize by explicitly trusting the dangerous value</td>
     <td>
     <pre>&lt;div ng-bind-html="deliberatelyTrustDangerousSnippet()"&gt;
     &lt;/div&gt;</pre>
     </td>
     <td><div ng-bind-html="deliberatelyTrustDangerousSnippet()"></div></td>
     </tr>
     <tr id="bind-default">
     <td>ng-bind</td>
     <td>Automatically escapes</td>
     <td><pre>&lt;div ng-bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
     <td><div ng-bind="snippet"></div></td>
     </tr>
     </table>
     </div>
     </file>
     <file name="protractor.js" type="protractor">
     it('should sanitize the html snippet by default', function() {
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
     });

     it('should inline raw snippet if bound to a trusted value', function() {
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).
         toBe("<p style=\"color:blue\">an html\n" +
              "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
              "snippet</p>");
     });

     it('should escape snippet without any filter', function() {
       expect(element(by.css('#bind-default div')).getInnerHtml()).
         toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
              "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
              "snippet&lt;/p&gt;");
     });

     it('should update', function() {
       element(by.model('snippet')).clear();
       element(by.model('snippet')).sendKeys('new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-html-with-sanitize div')).getInnerHtml()).
         toBe('new <b>text</b>');
       expect(element(by.css('#bind-html-with-trust div')).getInnerHtml()).toBe(
         'new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-default div')).getInnerHtml()).toBe(
         "new &lt;b onclick=\"alert(1)\"&gt;text&lt;/b&gt;");
     });
     </file>
     </example>
     */
    function $SanitizeProvider() {
        this.$get = ['$$sanitizeUri', function ($$sanitizeUri) {
            return function (html) {
                var buf = [];
                htmlParser(html, htmlSanitizeWriter(buf, function (uri, isImage) {
                    return !/^unsafe/.test($$sanitizeUri(uri, isImage));
                }));
                return buf.join('');
            };
        }];
    }

    function sanitizeText(chars) {
        var buf = [];
        var writer = htmlSanitizeWriter(buf, angular.noop);
        writer.chars(chars);
        return buf.join('');
    }


// Regular Expressions for parsing tags and attributes
    var START_TAG_REGEXP =
            /^<((?:[a-zA-Z])[\w:-]*)((?:\s+[\w:-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)\s*(>?)/,
        END_TAG_REGEXP = /^<\/\s*([\w:-]+)[^>]*>/,
        ATTR_REGEXP = /([\w:-]+)(?:\s*=\s*(?:(?:"((?:[^"])*)")|(?:'((?:[^'])*)')|([^>\s]+)))?/g,
        BEGIN_TAG_REGEXP = /^</,
        BEGING_END_TAGE_REGEXP = /^<\//,
        COMMENT_REGEXP = /<!--(.*?)-->/g,
        DOCTYPE_REGEXP = /<!DOCTYPE([^>]*?)>/i,
        CDATA_REGEXP = /<!\[CDATA\[(.*?)]]>/g,
        SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
    // Match everything outside of normal chars and " (quote character)
        NON_ALPHANUMERIC_REGEXP = /([^\#-~| |!])/g;


// Good source of info about elements and attributes
// http://dev.w3.org/html5/spec/Overview.html#semantics
// http://simon.html5.org/html-elements

// Safe Void Elements - HTML5
// http://dev.w3.org/html5/spec/Overview.html#void-elements
    var voidElements = makeMap("area,br,col,hr,img,wbr");

// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
    var optionalEndTagBlockElements = makeMap("colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr"),
        optionalEndTagInlineElements = makeMap("rp,rt"),
        optionalEndTagElements = angular.extend({},
            optionalEndTagInlineElements,
            optionalEndTagBlockElements);

// Safe Block Elements - HTML5
    var blockElements = angular.extend({}, optionalEndTagBlockElements, makeMap("address,article," +
        "aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5," +
        "h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,script,section,table,ul"));

// Inline Elements - HTML5
    var inlineElements = angular.extend({}, optionalEndTagInlineElements, makeMap("a,abbr,acronym,b," +
        "bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s," +
        "samp,small,span,strike,strong,sub,sup,time,tt,u,var"));

// SVG Elements
// https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Elements
    var svgElements = makeMap("animate,animateColor,animateMotion,animateTransform,circle,defs," +
        "desc,ellipse,font-face,font-face-name,font-face-src,g,glyph,hkern,image,linearGradient," +
        "line,marker,metadata,missing-glyph,mpath,path,polygon,polyline,radialGradient,rect,set," +
        "stop,svg,switch,text,title,tspan,use");

// Special Elements (can contain anything)
    var specialElements = makeMap("script,style");

    var validElements = angular.extend({},
        voidElements,
        blockElements,
        inlineElements,
        optionalEndTagElements,
        svgElements);

//Attributes that have href and hence need to be sanitized
    var uriAttrs = makeMap("background,cite,href,longdesc,src,usemap,xlink:href");

    var htmlAttrs = makeMap('abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
        'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' +
        'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' +
        'scope,scrolling,shape,size,span,start,summary,target,title,type,' +
        'valign,value,vspace,width');

// SVG attributes (without "id" and "name" attributes)
// https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Attributes
    var svgAttrs = makeMap('accent-height,accumulate,additive,alphabetic,arabic-form,ascent,' +
        'attributeName,attributeType,baseProfile,bbox,begin,by,calcMode,cap-height,class,color,' +
        'color-rendering,content,cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,' +
        'font-size,font-stretch,font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,' +
        'gradientUnits,hanging,height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,' +
        'keySplines,keyTimes,lang,marker-end,marker-mid,marker-start,markerHeight,markerUnits,' +
        'markerWidth,mathematical,max,min,offset,opacity,orient,origin,overline-position,' +
        'overline-thickness,panose-1,path,pathLength,points,preserveAspectRatio,r,refX,refY,' +
        'repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,' +
        'stemv,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,stroke,' +
        'stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,' +
        'stroke-opacity,stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,' +
        'underline-position,underline-thickness,unicode,unicode-range,units-per-em,values,version,' +
        'viewBox,visibility,width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,' +
        'xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,' +
        'zoomAndPan');

    var validAttrs = angular.extend({},
        uriAttrs,
        svgAttrs,
        htmlAttrs);

    function makeMap(str) {
        var obj = {}, items = str.split(','), i;
        for (i = 0; i < items.length; i++) obj[items[i]] = true;
        return obj;
    }


    /**
     * @example
     * htmlParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
     *
     * @param {string} html string
     * @param {object} handler
     */
    function htmlParser(html, handler) {
        if (typeof html !== 'string') {
            if (html === null || typeof html === 'undefined') {
                html = '';
            } else {
                html = '' + html;
            }
        }
        var index, chars, match, stack = [], last = html, text;
        stack.last = function () {
            return stack[stack.length - 1];
        };

        while (html) {
            text = '';
            chars = true;

            // Make sure we're not in a script or style element
            if (!stack.last() || !specialElements[stack.last()]) {

                // Comment
                if (html.indexOf("<!--") === 0) {
                    // comments containing -- are not allowed unless they terminate the comment
                    index = html.indexOf("--", 4);

                    if (index >= 0 && html.lastIndexOf("-->", index) === index) {
                        if (handler.comment) handler.comment(html.substring(4, index));
                        html = html.substring(index + 3);
                        chars = false;
                    }
                    // DOCTYPE
                } else if (DOCTYPE_REGEXP.test(html)) {
                    match = html.match(DOCTYPE_REGEXP);

                    if (match) {
                        html = html.replace(match[0], '');
                        chars = false;
                    }
                    // end tag
                } else if (BEGING_END_TAGE_REGEXP.test(html)) {
                    match = html.match(END_TAG_REGEXP);

                    if (match) {
                        html = html.substring(match[0].length);
                        match[0].replace(END_TAG_REGEXP, parseEndTag);
                        chars = false;
                    }

                    // start tag
                } else if (BEGIN_TAG_REGEXP.test(html)) {
                    match = html.match(START_TAG_REGEXP);

                    if (match) {
                        // We only have a valid start-tag if there is a '>'.
                        if (match[4]) {
                            html = html.substring(match[0].length);
                            match[0].replace(START_TAG_REGEXP, parseStartTag);
                        }
                        chars = false;
                    } else {
                        // no ending tag found --- this piece should be encoded as an entity.
                        text += '<';
                        html = html.substring(1);
                    }
                }

                if (chars) {
                    index = html.indexOf("<");

                    text += index < 0 ? html : html.substring(0, index);
                    html = index < 0 ? "" : html.substring(index);

                    if (handler.chars) handler.chars(decodeEntities(text));
                }

            } else {
                // IE versions 9 and 10 do not understand the regex '[^]', so using a workaround with [\W\w].
                html = html.replace(new RegExp("([\\W\\w]*)<\\s*\\/\\s*" + stack.last() + "[^>]*>", 'i'),
                    function (all, text) {
                        text = text.replace(COMMENT_REGEXP, "$1").replace(CDATA_REGEXP, "$1");

                        if (handler.chars) handler.chars(decodeEntities(text));

                        return "";
                    });

                parseEndTag("", stack.last());
            }

            if (html == last) {
                throw $sanitizeMinErr('badparse', "The sanitizer was unable to parse the following block " +
                    "of html: {0}", html);
            }
            last = html;
        }

        // Clean up any remaining tags
        parseEndTag();

        function parseStartTag(tag, tagName, rest, unary) {
            tagName = angular.lowercase(tagName);
            if (blockElements[tagName]) {
                while (stack.last() && inlineElements[stack.last()]) {
                    parseEndTag("", stack.last());
                }
            }

            if (optionalEndTagElements[tagName] && stack.last() == tagName) {
                parseEndTag("", tagName);
            }

            unary = voidElements[tagName] || !!unary;

            if (!unary)
                stack.push(tagName);

            var attrs = {};

            rest.replace(ATTR_REGEXP,
                function (match, name, doubleQuotedValue, singleQuotedValue, unquotedValue) {
                    var value = doubleQuotedValue
                        || singleQuotedValue
                        || unquotedValue
                        || '';

                    attrs[name] = decodeEntities(value);
                });
            if (handler.start) handler.start(tagName, attrs, unary);
        }

        function parseEndTag(tag, tagName) {
            var pos = 0, i;
            tagName = angular.lowercase(tagName);
            if (tagName)
            // Find the closest opened tag of the same type
                for (pos = stack.length - 1; pos >= 0; pos--)
                    if (stack[pos] == tagName)
                        break;

            if (pos >= 0) {
                // Close all the open elements, up the stack
                for (i = stack.length - 1; i >= pos; i--)
                    if (handler.end) handler.end(stack[i]);

                // Remove the open elements from the stack
                stack.length = pos;
            }
        }
    }

    var hiddenPre = document.createElement("pre");

    /**
     * decodes all entities into regular string
     * @param value
     * @returns {string} A string with decoded entities.
     */
    function decodeEntities(value) {
        if (!value) {
            return '';
        }

        hiddenPre.innerHTML = value.replace(/</g, "&lt;");
        // innerText depends on styling as it doesn't display hidden elements.
        // Therefore, it's better to use textContent not to cause unnecessary reflows.
        return hiddenPre.textContent;
    }

    /**
     * Escapes all potentially dangerous characters, so that the
     * resulting string can be safely inserted into attribute or
     * element text.
     * @param value
     * @returns {string} escaped text
     */
    function encodeEntities(value) {
        return value.replace(/&/g, '&amp;').replace(SURROGATE_PAIR_REGEXP, function (value) {
            var hi = value.charCodeAt(0);
            var low = value.charCodeAt(1);
            return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
        }).replace(NON_ALPHANUMERIC_REGEXP, function (value) {
            return '&#' + value.charCodeAt(0) + ';';
        }).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /**
     * create an HTML/XML writer which writes to buffer
     * @param {Array} buf use buf.jain('') to get out sanitized html string
     * @returns {object} in the form of {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * }
     */
    function htmlSanitizeWriter(buf, uriValidator) {
        var ignore = false;
        var out = angular.bind(buf, buf.push);
        return {
            start: function (tag, attrs, unary) {
                tag = angular.lowercase(tag);
                if (!ignore && specialElements[tag]) {
                    ignore = tag;
                }
                if (!ignore && validElements[tag] === true) {
                    out('<');
                    out(tag);
                    angular.forEach(attrs, function (value, key) {
                        var lkey = angular.lowercase(key);
                        var isImage = (tag === 'img' && lkey === 'src') || (lkey === 'background');
                        if (validAttrs[lkey] === true &&
                            (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
                            out(' ');
                            out(key);
                            out('="');
                            out(encodeEntities(value));
                            out('"');
                        }
                    });
                    out(unary ? '/>' : '>');
                }
            },
            end: function (tag) {
                tag = angular.lowercase(tag);
                if (!ignore && validElements[tag] === true) {
                    out('</');
                    out(tag);
                    out('>');
                }
                if (tag == ignore) {
                    ignore = false;
                }
            },
            chars: function (chars) {
                if (!ignore) {
                    out(encodeEntities(chars));
                }
            }
        };
    }


// define ngSanitize module and register $sanitize service
    angular.module('ngSanitize', []).provider('$sanitize', $SanitizeProvider);

    /* global sanitizeText: false */

    /**
     * @ngdoc filter
     * @name linky
     * @kind function
     *
     * @description
     * Finds links in text input and turns them into html links. Supports http/https/ftp/mailto and
     * plain email address links.
     *
     * Requires the {@link ngSanitize `ngSanitize`} module to be installed.
     *
     * @param {string} text Input text.
     * @param {string} target Window (_blank|_self|_parent|_top) or named frame to open links in.
     * @returns {string} Html-linkified text.
     *
     * @usage
     <span ng-bind-html="linky_expression | linky"></span>
     *
     * @example
     <example module="linkyExample" deps="angular-sanitize.js">
     <file name="index.html">
     <script>
     angular.module('linkyExample', ['ngSanitize'])
     .controller('ExampleController', ['$scope', function($scope) {
             $scope.snippet =
               'Pretty text with some links:\n'+
               'http://angularjs.org/,\n'+
               'mailto:us@somewhere.org,\n'+
   'another@somewhere.org,\n'+
   'and one more: ftp://127.0.0.1/.';
   $scope.snippetWithTarget = 'http://angularjs.org/';
   }]);
     </script>
     <div ng-controller="ExampleController">
     Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
     <table>
     <tr>
     <td>Filter</td>
     <td>Source</td>
     <td>Rendered</td>
     </tr>
     <tr id="linky-filter">
     <td>linky filter</td>
     <td>
     <pre>&lt;div ng-bind-html="snippet | linky"&gt;<br>&lt;/div&gt;</pre>
     </td>
     <td>
     <div ng-bind-html="snippet | linky"></div>
     </td>
     </tr>
     <tr id="linky-target">
     <td>linky target</td>
     <td>
     <pre>&lt;div ng-bind-html="snippetWithTarget | linky:'_blank'"&gt;<br>&lt;/div&gt;</pre>
     </td>
     <td>
     <div ng-bind-html="snippetWithTarget | linky:'_blank'"></div>
     </td>
     </tr>
     <tr id="escaped-html">
     <td>no filter</td>
     <td><pre>&lt;div ng-bind="snippet"&gt;<br>&lt;/div&gt;</pre></td>
     <td><div ng-bind="snippet"></div></td>
     </tr>
     </table>
     </file>
     <file name="protractor.js" type="protractor">
     it('should linkify the snippet with urls', function() {
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, us@somewhere.org, ' +
   'another@somewhere.org, and one more: ftp://127.0.0.1/.');
   expect(element.all(by.css('#linky-filter a')).count()).toEqual(4);
   });

     it('should not linkify snippet without the linky filter', function() {
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, mailto:us@somewhere.org, ' +
   'another@somewhere.org, and one more: ftp://127.0.0.1/.');
   expect(element.all(by.css('#escaped-html a')).count()).toEqual(0);
   });

     it('should update', function() {
         element(by.model('snippet')).clear();
         element(by.model('snippet')).sendKeys('new http://link.');
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('new http://link.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(1);
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText())
             .toBe('new http://link.');
       });

     it('should work with the target property', function() {
        expect(element(by.id('linky-target')).
            element(by.binding("snippetWithTarget | linky:'_blank'")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-target a')).getAttribute('target')).toEqual('_blank');
       });
     </file>
     </example>
     */
    angular.module('ngSanitize').filter('linky', ['$sanitize', function ($sanitize) {
        var LINKY_URL_REGEXP =
                /((ftp|https?):\/\/|(www\.)|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"”’]/,
            MAILTO_REGEXP = /^mailto:/;

        return function (text, target) {
            if (!text) return text;
            var match;
            var raw = text;
            var html = [];
            var url;
            var i;
            while ((match = raw.match(LINKY_URL_REGEXP))) {
                // We can not end in these as they are sometimes found at the end of the sentence
                url = match[0];
                // if we did not match ftp/http/www/mailto then assume mailto
                if (!match[2] && !match[4]) {
                    url = (match[3] ? 'http://' : 'mailto:') + url;
                }
                i = match.index;
                addText(raw.substr(0, i));
                addLink(url, match[0].replace(MAILTO_REGEXP, ''));
                raw = raw.substring(i + match[0].length);
            }
            addText(raw);
            return $sanitize(html.join(''));

            function addText(text) {
                if (!text) {
                    return;
                }
                html.push(sanitizeText(text));
            }

            function addLink(url, text) {
                html.push('<a ');
                if (angular.isDefined(target)) {
                    html.push('target="',
                        target,
                        '" ');
                }
                html.push('href="',
                    url.replace(/"/g, '&quot;'),
                    '">');
                addText(text);
                html.push('</a>');
            }
        };
    }]);


})(window, window.angular);

/**
 * @license AngularJS v1.3.15
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 * ngResource
 */
(function (window, angular, undefined) {
    'use strict';

    var $resourceMinErr = angular.$$minErr('$resource');

// Helper functions and regex to lookup a dotted path on an object
// stopping at undefined/null.  The path must be composed of ASCII
// identifiers (just like $parse)
    var MEMBER_NAME_REGEX = /^(\.[a-zA-Z_$][0-9a-zA-Z_$]*)+$/;

    function isValidDottedPath(path) {
        return (path != null && path !== '' && path !== 'hasOwnProperty' &&
        MEMBER_NAME_REGEX.test('.' + path));
    }

    function lookupDottedPath(obj, path) {
        if (!isValidDottedPath(path)) {
            throw $resourceMinErr('badmember', 'Dotted member path "@{0}" is invalid.', path);
        }
        var keys = path.split('.');
        for (var i = 0, ii = keys.length; i < ii && obj !== undefined; i++) {
            var key = keys[i];
            obj = (obj !== null) ? obj[key] : undefined;
        }
        return obj;
    }

    /**
     * Create a shallow copy of an object and clear other fields from the destination
     */
    function shallowClearAndCopy(src, dst) {
        dst = dst || {};

        angular.forEach(dst, function (value, key) {
            delete dst[key];
        });

        for (var key in src) {
            if (src.hasOwnProperty(key) && !(key.charAt(0) === '$' && key.charAt(1) === '$')) {
                dst[key] = src[key];
            }
        }

        return dst;
    }

    /**
     * @ngdoc module
     * @name ngResource
     * @description
     *
     * # ngResource
     *
     * The `ngResource` module provides interaction support with RESTful services
     * via the $resource service.
     *
     *
     * <div doc-module-components="ngResource"></div>
     *
     * See {@link ngResource.$resource `$resource`} for usage.
     */

    /**
     * @ngdoc service
     * @name $resource
     * @requires $http
     *
     * @description
     * A factory which creates a resource object that lets you interact with
     * [RESTful](http://en.wikipedia.org/wiki/Representational_State_Transfer) server-side data sources.
     *
     * The returned resource object has action methods which provide high-level behaviors without
     * the need to interact with the low level {@link ng.$http $http} service.
     *
     * Requires the {@link ngResource `ngResource`} module to be installed.
     *
     * By default, trailing slashes will be stripped from the calculated URLs,
     * which can pose problems with server backends that do not expect that
     * behavior.  This can be disabled by configuring the `$resourceProvider` like
     * this:
     *
     * ```js
     app.config(['$resourceProvider', function($resourceProvider) {
       // Don't strip trailing slashes from calculated URLs
       $resourceProvider.defaults.stripTrailingSlashes = false;
     }]);
     * ```
     *
     * @param {string} url A parametrized URL template with parameters prefixed by `:` as in
     *   `/user/:username`. If you are using a URL with a port number (e.g.
     *   `http://example.com:8080/api`), it will be respected.
     *
     *   If you are using a url with a suffix, just add the suffix, like this:
     *   `$resource('http://example.com/resource.json')` or `$resource('http://example.com/:id.json')`
     *   or even `$resource('http://example.com/resource/:resource_id.:format')`
     *   If the parameter before the suffix is empty, :resource_id in this case, then the `/.` will be
     *   collapsed down to a single `.`.  If you need this sequence to appear and not collapse then you
     *   can escape it with `/\.`.
     *
     * @param {Object=} paramDefaults Default values for `url` parameters. These can be overridden in
     *   `actions` methods. If any of the parameter value is a function, it will be executed every time
     *   when a param value needs to be obtained for a request (unless the param was overridden).
     *
     *   Each key value in the parameter object is first bound to url template if present and then any
     *   excess keys are appended to the url search query after the `?`.
     *
     *   Given a template `/path/:verb` and parameter `{verb:'greet', salutation:'Hello'}` results in
     *   URL `/path/greet?salutation=Hello`.
     *
     *   If the parameter value is prefixed with `@` then the value for that parameter will be extracted
     *   from the corresponding property on the `data` object (provided when calling an action method).  For
     *   example, if the `defaultParam` object is `{someParam: '@someProp'}` then the value of `someParam`
     *   will be `data.someProp`.
     *
     * @param {Object.<Object>=} actions Hash with declaration of custom actions that should extend
     *   the default set of resource actions. The declaration should be created in the format of {@link
        *   ng.$http#usage $http.config}:
     *
     *       {action1: {method:?, params:?, isArray:?, headers:?, ...},
 *        action2: {method:?, params:?, isArray:?, headers:?, ...},
 *        ...}
     *
     *   Where:
     *
     *   - **`action`** – {string} – The name of action. This name becomes the name of the method on
     *     your resource object.
     *   - **`method`** – {string} – Case insensitive HTTP method (e.g. `GET`, `POST`, `PUT`,
     *     `DELETE`, `JSONP`, etc).
     *   - **`params`** – {Object=} – Optional set of pre-bound parameters for this action. If any of
     *     the parameter value is a function, it will be executed every time when a param value needs to
     *     be obtained for a request (unless the param was overridden).
     *   - **`url`** – {string} – action specific `url` override. The url templating is supported just
     *     like for the resource-level urls.
     *   - **`isArray`** – {boolean=} – If true then the returned object for this action is an array,
     *     see `returns` section.
     *   - **`transformRequest`** –
     *     `{function(data, headersGetter)|Array.<function(data, headersGetter)>}` –
     *     transform function or an array of such functions. The transform function takes the http
     *     request body and headers and returns its transformed (typically serialized) version.
     *     By default, transformRequest will contain one function that checks if the request data is
     *     an object and serializes to using `angular.toJson`. To prevent this behavior, set
     *     `transformRequest` to an empty array: `transformRequest: []`
     *   - **`transformResponse`** –
     *     `{function(data, headersGetter)|Array.<function(data, headersGetter)>}` –
     *     transform function or an array of such functions. The transform function takes the http
     *     response body and headers and returns its transformed (typically deserialized) version.
     *     By default, transformResponse will contain one function that checks if the response looks like
     *     a JSON string and deserializes it using `angular.fromJson`. To prevent this behavior, set
     *     `transformResponse` to an empty array: `transformResponse: []`
     *   - **`cache`** – `{boolean|Cache}` – If true, a default $http cache will be used to cache the
     *     GET request, otherwise if a cache instance built with
     *     {@link ng.$cacheFactory $cacheFactory}, this cache will be used for
     *     caching.
     *   - **`timeout`** – `{number|Promise}` – timeout in milliseconds, or {@link ng.$q promise} that
     *     should abort the request when resolved.
     *   - **`withCredentials`** - `{boolean}` - whether to set the `withCredentials` flag on the
     *     XHR object. See
     *     [requests with credentials](https://developer.mozilla.org/en/http_access_control#section_5)
     *     for more information.
     *   - **`responseType`** - `{string}` - see
     *     [requestType](https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#responseType).
     *   - **`interceptor`** - `{Object=}` - The interceptor object has two optional methods -
     *     `response` and `responseError`. Both `response` and `responseError` interceptors get called
     *     with `http response` object. See {@link ng.$http $http interceptors}.
     *
     * @param {Object} options Hash with custom settings that should extend the
     *   default `$resourceProvider` behavior.  The only supported option is
     *
     *   Where:
     *
     *   - **`stripTrailingSlashes`** – {boolean} – If true then the trailing
     *   slashes from any calculated URL will be stripped. (Defaults to true.)
     *
     * @returns {Object} A resource "class" object with methods for the default set of resource actions
     *   optionally extended with custom `actions`. The default set contains these actions:
     *   ```js
     *   { 'get':    {method:'GET'},
 *     'save':   {method:'POST'},
 *     'query':  {method:'GET', isArray:true},
 *     'remove': {method:'DELETE'},
 *     'delete': {method:'DELETE'} };
     *   ```
     *
     *   Calling these methods invoke an {@link ng.$http} with the specified http method,
     *   destination and parameters. When the data is returned from the server then the object is an
     *   instance of the resource class. The actions `save`, `remove` and `delete` are available on it
     *   as  methods with the `$` prefix. This allows you to easily perform CRUD operations (create,
     *   read, update, delete) on server-side data like this:
     *   ```js
     *   var User = $resource('/user/:userId', {userId:'@id'});
     *   var user = User.get({userId:123}, function() {
 *     user.abc = true;
 *     user.$save();
 *   });
     *   ```
     *
     *   It is important to realize that invoking a $resource object method immediately returns an
     *   empty reference (object or array depending on `isArray`). Once the data is returned from the
     *   server the existing reference is populated with the actual data. This is a useful trick since
     *   usually the resource is assigned to a model which is then rendered by the view. Having an empty
     *   object results in no rendering, once the data arrives from the server then the object is
     *   populated with the data and the view automatically re-renders itself showing the new data. This
     *   means that in most cases one never has to write a callback function for the action methods.
     *
     *   The action methods on the class object or instance object can be invoked with the following
     *   parameters:
     *
     *   - HTTP GET "class" actions: `Resource.action([parameters], [success], [error])`
     *   - non-GET "class" actions: `Resource.action([parameters], postData, [success], [error])`
     *   - non-GET instance actions:  `instance.$action([parameters], [success], [error])`
     *
     *
     *   Success callback is called with (value, responseHeaders) arguments. Error callback is called
     *   with (httpResponse) argument.
     *
     *   Class actions return empty instance (with additional properties below).
     *   Instance actions return promise of the action.
     *
     *   The Resource instances and collection have these additional properties:
     *
     *   - `$promise`: the {@link ng.$q promise} of the original server interaction that created this
     *     instance or collection.
     *
     *     On success, the promise is resolved with the same resource instance or collection object,
     *     updated with data from server. This makes it easy to use in
     *     {@link ngRoute.$routeProvider resolve section of $routeProvider.when()} to defer view
     *     rendering until the resource(s) are loaded.
     *
     *     On failure, the promise is resolved with the {@link ng.$http http response} object, without
     *     the `resource` property.
     *
     *     If an interceptor object was provided, the promise will instead be resolved with the value
     *     returned by the interceptor.
     *
     *   - `$resolved`: `true` after first server interaction is completed (either with success or
     *      rejection), `false` before that. Knowing if the Resource has been resolved is useful in
     *      data-binding.
     *
     * @example
     *
     * # Credit card resource
     *
     * ```js
     // Define CreditCard class
     var CreditCard = $resource('/user/:userId/card/:cardId',
     {userId:123, cardId:'@id'}, {
       charge: {method:'POST', params:{charge:true}}
      });

     // We can retrieve a collection from the server
     var cards = CreditCard.query(function() {
       // GET: /user/123/card
       // server returns: [ {id:456, number:'1234', name:'Smith'} ];

       var card = cards[0];
       // each item is an instance of CreditCard
       expect(card instanceof CreditCard).toEqual(true);
       card.name = "J. Smith";
       // non GET methods are mapped onto the instances
       card.$save();
       // POST: /user/123/card/456 {id:456, number:'1234', name:'J. Smith'}
       // server returns: {id:456, number:'1234', name: 'J. Smith'};

       // our custom method is mapped as well.
       card.$charge({amount:9.99});
       // POST: /user/123/card/456?amount=9.99&charge=true {id:456, number:'1234', name:'J. Smith'}
     });

     // we can create an instance as well
     var newCard = new CreditCard({number:'0123'});
     newCard.name = "Mike Smith";
     newCard.$save();
     // POST: /user/123/card {number:'0123', name:'Mike Smith'}
     // server returns: {id:789, number:'0123', name: 'Mike Smith'};
     expect(newCard.id).toEqual(789);
     * ```
     *
     * The object returned from this function execution is a resource "class" which has "static" method
     * for each action in the definition.
     *
     * Calling these methods invoke `$http` on the `url` template with the given `method`, `params` and
     * `headers`.
     * When the data is returned from the server then the object is an instance of the resource type and
     * all of the non-GET methods are available with `$` prefix. This allows you to easily support CRUD
     * operations (create, read, update, delete) on server-side data.

     ```js
     var User = $resource('/user/:userId', {userId:'@id'});
     User.get({userId:123}, function(user) {
       user.abc = true;
       user.$save();
     });
     ```
     *
     * It's worth noting that the success callback for `get`, `query` and other methods gets passed
     * in the response that came from the server as well as $http header getter function, so one
     * could rewrite the above example and get access to http headers as:
     *
     ```js
     var User = $resource('/user/:userId', {userId:'@id'});
     User.get({userId:123}, function(u, getResponseHeaders){
       u.abc = true;
       u.$save(function(u, putResponseHeaders) {
         //u => saved user object
         //putResponseHeaders => $http header getter
       });
     });
     ```
     *
     * You can also access the raw `$http` promise via the `$promise` property on the object returned
     *
     ```
     var User = $resource('/user/:userId', {userId:'@id'});
     User.get({userId:123})
     .$promise.then(function(user) {
           $scope.user = user;
         });
     ```

     * # Creating a custom 'PUT' request
     * In this example we create a custom method on our resource to make a PUT request
     * ```js
     *    var app = angular.module('app', ['ngResource', 'ngRoute']);
     *
     *    // Some APIs expect a PUT request in the format URL/object/ID
     *    // Here we are creating an 'update' method
     *    app.factory('Notes', ['$resource', function($resource) {
 *    return $resource('/notes/:id', null,
 *        {
 *            'update': { method:'PUT' }
 *        });
 *    }]);
     *
     *    // In our controller we get the ID from the URL using ngRoute and $routeParams
     *    // We pass in $routeParams and our Notes factory along with $scope
     *    app.controller('NotesCtrl', ['$scope', '$routeParams', 'Notes',
     function($scope, $routeParams, Notes) {
 *    // First get a note object from the factory
 *    var note = Notes.get({ id:$routeParams.id });
 *    $id = note.id;
 *
 *    // Now call update passing in the ID first then the object you are updating
 *    Notes.update({ id:$id }, note);
 *
 *    // This will PUT /notes/ID with the note object in the request payload
 *    }]);
     * ```
     */
    angular.module('ngResource', ['ng']).provider('$resource', function () {
        var provider = this;

        this.defaults = {
            // Strip slashes by default
            stripTrailingSlashes: true,

            // Default actions configuration
            actions: {
                'get': {method: 'GET'},
                'save': {method: 'POST'},
                'query': {method: 'GET', isArray: true},
                'remove': {method: 'DELETE'},
                'delete': {method: 'DELETE'}
            }
        };

        this.$get = ['$http', '$q', function ($http, $q) {

            var noop = angular.noop,
                forEach = angular.forEach,
                extend = angular.extend,
                copy = angular.copy,
                isFunction = angular.isFunction;

            /**
             * We need our custom method because encodeURIComponent is too aggressive and doesn't follow
             * http://www.ietf.org/rfc/rfc3986.txt with regards to the character set
             * (pchar) allowed in path segments:
             *    segment       = *pchar
             *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
             *    pct-encoded   = "%" HEXDIG HEXDIG
             *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
             *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
             *                     / "*" / "+" / "," / ";" / "="
             */
            function encodeUriSegment(val) {
                return encodeUriQuery(val, true).replace(/%26/gi, '&').replace(/%3D/gi, '=').replace(/%2B/gi, '+');
            }


            /**
             * This method is intended for encoding *key* or *value* parts of query component. We need a
             * custom method because encodeURIComponent is too aggressive and encodes stuff that doesn't
             * have to be encoded per http://tools.ietf.org/html/rfc3986:
             *    query       = *( pchar / "/" / "?" )
             *    pchar         = unreserved / pct-encoded / sub-delims / ":" / "@"
             *    unreserved    = ALPHA / DIGIT / "-" / "." / "_" / "~"
             *    pct-encoded   = "%" HEXDIG HEXDIG
             *    sub-delims    = "!" / "$" / "&" / "'" / "(" / ")"
             *                     / "*" / "+" / "," / ";" / "="
             */
            function encodeUriQuery(val, pctEncodeSpaces) {
                return encodeURIComponent(val).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
            }

            function Route(template, defaults) {
                this.template = template;
                this.defaults = extend({}, provider.defaults, defaults);
                this.urlParams = {};
            }

            Route.prototype = {
                setUrlParams: function (config, params, actionUrl) {
                    var self = this,
                        url = actionUrl || self.template,
                        val,
                        encodedVal;

                    var urlParams = self.urlParams = {};
                    forEach(url.split(/\W/), function (param) {
                        if (param === 'hasOwnProperty') {
                            throw $resourceMinErr('badname', "hasOwnProperty is not a valid parameter name.");
                        }
                        if (!(new RegExp("^\\d+$").test(param)) && param &&
                            (new RegExp("(^|[^\\\\]):" + param + "(\\W|$)").test(url))) {
                            urlParams[param] = true;
                        }
                    });
                    url = url.replace(/\\:/g, ':');

                    params = params || {};
                    forEach(self.urlParams, function (_, urlParam) {
                        val = params.hasOwnProperty(urlParam) ? params[urlParam] : self.defaults[urlParam];
                        if (angular.isDefined(val) && val !== null) {
                            encodedVal = encodeUriSegment(val);
                            url = url.replace(new RegExp(":" + urlParam + "(\\W|$)", "g"), function (match, p1) {
                                return encodedVal + p1;
                            });
                        } else {
                            url = url.replace(new RegExp("(\/?):" + urlParam + "(\\W|$)", "g"), function (match,
                                                                                                          leadingSlashes, tail) {
                                if (tail.charAt(0) == '/') {
                                    return tail;
                                } else {
                                    return leadingSlashes + tail;
                                }
                            });
                        }
                    });

                    // strip trailing slashes and set the url (unless this behavior is specifically disabled)
                    if (self.defaults.stripTrailingSlashes) {
                        url = url.replace(/\/+$/, '') || '/';
                    }

                    // then replace collapse `/.` if found in the last URL path segment before the query
                    // E.g. `http://url.com/id./format?q=x` becomes `http://url.com/id.format?q=x`
                    url = url.replace(/\/\.(?=\w+($|\?))/, '.');
                    // replace escaped `/\.` with `/.`
                    config.url = url.replace(/\/\\\./, '/.');


                    // set params - delegate param encoding to $http
                    forEach(params, function (value, key) {
                        if (!self.urlParams[key]) {
                            config.params = config.params || {};
                            config.params[key] = value;
                        }
                    });
                }
            };


            function resourceFactory(url, paramDefaults, actions, options) {
                var route = new Route(url, options);

                actions = extend({}, provider.defaults.actions, actions);

                function extractParams(data, actionParams) {
                    var ids = {};
                    actionParams = extend({}, paramDefaults, actionParams);
                    forEach(actionParams, function (value, key) {
                        if (isFunction(value)) {
                            value = value();
                        }
                        ids[key] = value && value.charAt && value.charAt(0) == '@' ?
                            lookupDottedPath(data, value.substr(1)) : value;
                    });
                    return ids;
                }

                function defaultResponseInterceptor(response) {
                    return response.resource;
                }

                function Resource(value) {
                    shallowClearAndCopy(value || {}, this);
                }

                Resource.prototype.toJSON = function () {
                    var data = extend({}, this);
                    delete data.$promise;
                    delete data.$resolved;
                    return data;
                };

                forEach(actions, function (action, name) {
                    var hasBody = /^(POST|PUT|PATCH)$/i.test(action.method);

                    Resource[name] = function (a1, a2, a3, a4) {
                        var params = {}, data, success, error;

                        /* jshint -W086 */
                        /* (purposefully fall through case statements) */
                        switch (arguments.length) {
                            case 4:
                                error = a4;
                                success = a3;
                            //fallthrough
                            case 3:
                            case 2:
                                if (isFunction(a2)) {
                                    if (isFunction(a1)) {
                                        success = a1;
                                        error = a2;
                                        break;
                                    }

                                    success = a2;
                                    error = a3;
                                    //fallthrough
                                } else {
                                    params = a1;
                                    data = a2;
                                    success = a3;
                                    break;
                                }
                            case 1:
                                if (isFunction(a1)) success = a1;
                                else if (hasBody) data = a1;
                                else params = a1;
                                break;
                            case 0:
                                break;
                            default:
                                throw $resourceMinErr('badargs',
                                    "Expected up to 4 arguments [params, data, success, error], got {0} arguments",
                                    arguments.length);
                        }
                        /* jshint +W086 */
                        /* (purposefully fall through case statements) */

                        var isInstanceCall = this instanceof Resource;
                        var value = isInstanceCall ? data : (action.isArray ? [] : new Resource(data));
                        var httpConfig = {};
                        var responseInterceptor = action.interceptor && action.interceptor.response ||
                            defaultResponseInterceptor;
                        var responseErrorInterceptor = action.interceptor && action.interceptor.responseError ||
                            undefined;

                        forEach(action, function (value, key) {
                            if (key != 'params' && key != 'isArray' && key != 'interceptor') {
                                httpConfig[key] = copy(value);
                            }
                        });

                        if (hasBody) httpConfig.data = data;
                        route.setUrlParams(httpConfig,
                            extend({}, extractParams(data, action.params || {}), params),
                            action.url);

                        var promise = $http(httpConfig).then(function (response) {
                            var data = response.data,
                                promise = value.$promise;

                            if (data) {
                                // Need to convert action.isArray to boolean in case it is undefined
                                // jshint -W018
                                if (angular.isArray(data) !== (!!action.isArray)) {
                                    throw $resourceMinErr('badcfg',
                                        'Error in resource configuration for action `{0}`. Expected response to ' +
                                        'contain an {1} but got an {2}', name, action.isArray ? 'array' : 'object',
                                        angular.isArray(data) ? 'array' : 'object');
                                }
                                // jshint +W018
                                if (action.isArray) {
                                    value.length = 0;
                                    forEach(data, function (item) {
                                        if (typeof item === "object") {
                                            value.push(new Resource(item));
                                        } else {
                                            // Valid JSON values may be string literals, and these should not be converted
                                            // into objects. These items will not have access to the Resource prototype
                                            // methods, but unfortunately there
                                            value.push(item);
                                        }
                                    });
                                } else {
                                    shallowClearAndCopy(data, value);
                                    value.$promise = promise;
                                }
                            }

                            value.$resolved = true;

                            response.resource = value;

                            return response;
                        }, function (response) {
                            value.$resolved = true;

                            (error || noop)(response);

                            return $q.reject(response);
                        });

                        promise = promise.then(
                            function (response) {
                                var value = responseInterceptor(response);
                                (success || noop)(value, response.headers);
                                return value;
                            },
                            responseErrorInterceptor);

                        if (!isInstanceCall) {
                            // we are creating instance / collection
                            // - set the initial promise
                            // - return the instance / collection
                            value.$promise = promise;
                            value.$resolved = false;

                            return value;
                        }

                        // instance call
                        return promise;
                    };


                    Resource.prototype['$' + name] = function (params, success, error) {
                        if (isFunction(params)) {
                            error = success;
                            success = params;
                            params = {};
                        }
                        var result = Resource[name].call(this, params, this, success, error);
                        return result.$promise || result;
                    };
                });

                Resource.bind = function (additionalParamDefaults) {
                    return resourceFactory(url, extend({}, paramDefaults, additionalParamDefaults), actions);
                };

                return Resource;
            }

            return resourceFactory;
        }];
    });


})(window, window.angular);

/**
 * @version v0.2.13
 * @link http://angular-ui.github.com/
 * @license MIT License, http://www.opensource.org/licenses/MIT
 * uiRouter
 */

/* commonjs package manager support (eg componentjs) */
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'ui.router';
}

(function (window, angular, undefined) {
    /*jshint globalstrict:true*/
    /*global angular:false*/
    'use strict';

    var isDefined = angular.isDefined,
        isFunction = angular.isFunction,
        isString = angular.isString,
        isObject = angular.isObject,
        isArray = angular.isArray,
        forEach = angular.forEach,
        extend = angular.extend,
        copy = angular.copy;

    function inherit(parent, extra) {
        return extend(new (extend(function () {
        }, {prototype: parent}))(), extra);
    }

    function merge(dst) {
        forEach(arguments, function (obj) {
            if (obj !== dst) {
                forEach(obj, function (value, key) {
                    if (!dst.hasOwnProperty(key)) dst[key] = value;
                });
            }
        });
        return dst;
    }

    /**
     * Finds the common ancestor path between two states.
     *
     * @param {Object} first The first state.
     * @param {Object} second The second state.
     * @return {Array} Returns an array of state names in descending order, not including the root.
     */
    function ancestors(first, second) {
        var path = [];

        for (var n in first.path) {
            if (first.path[n] !== second.path[n]) break;
            path.push(first.path[n]);
        }
        return path;
    }

    /**
     * IE8-safe wrapper for `Object.keys()`.
     *
     * @param {Object} object A JavaScript object.
     * @return {Array} Returns the keys of the object as an array.
     */
    function objectKeys(object) {
        if (Object.keys) {
            return Object.keys(object);
        }
        var result = [];

        angular.forEach(object, function (val, key) {
            result.push(key);
        });
        return result;
    }

    /**
     * IE8-safe wrapper for `Array.prototype.indexOf()`.
     *
     * @param {Array} array A JavaScript array.
     * @param {*} value A value to search the array for.
     * @return {Number} Returns the array index value of `value`, or `-1` if not present.
     */
    function indexOf(array, value) {
        if (Array.prototype.indexOf) {
            return array.indexOf(value, Number(arguments[2]) || 0);
        }
        var len = array.length >>> 0, from = Number(arguments[2]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);

        if (from < 0) from += len;

        for (; from < len; from++) {
            if (from in array && array[from] === value) return from;
        }
        return -1;
    }

    /**
     * Merges a set of parameters with all parameters inherited between the common parents of the
     * current state and a given destination state.
     *
     * @param {Object} currentParams The value of the current state parameters ($stateParams).
     * @param {Object} newParams The set of parameters which will be composited with inherited params.
     * @param {Object} $current Internal definition of object representing the current state.
     * @param {Object} $to Internal definition of object representing state to transition to.
     */
    function inheritParams(currentParams, newParams, $current, $to) {
        var parents = ancestors($current, $to), parentParams, inherited = {}, inheritList = [];

        for (var i in parents) {
            if (!parents[i].params) continue;
            parentParams = objectKeys(parents[i].params);
            if (!parentParams.length) continue;

            for (var j in parentParams) {
                if (indexOf(inheritList, parentParams[j]) >= 0) continue;
                inheritList.push(parentParams[j]);
                inherited[parentParams[j]] = currentParams[parentParams[j]];
            }
        }
        return extend({}, inherited, newParams);
    }

    /**
     * Performs a non-strict comparison of the subset of two objects, defined by a list of keys.
     *
     * @param {Object} a The first object.
     * @param {Object} b The second object.
     * @param {Array} keys The list of keys within each object to compare. If the list is empty or not specified,
     *                     it defaults to the list of keys in `a`.
     * @return {Boolean} Returns `true` if the keys match, otherwise `false`.
     */
    function equalForKeys(a, b, keys) {
        if (!keys) {
            keys = [];
            for (var n in a) keys.push(n); // Used instead of Object.keys() for IE8 compatibility
        }

        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (a[k] != b[k]) return false; // Not '===', values aren't necessarily normalized
        }
        return true;
    }

    /**
     * Returns the subset of an object, based on a list of keys.
     *
     * @param {Array} keys
     * @param {Object} values
     * @return {Boolean} Returns a subset of `values`.
     */
    function filterByKeys(keys, values) {
        var filtered = {};

        forEach(keys, function (name) {
            filtered[name] = values[name];
        });
        return filtered;
    }

// like _.indexBy
// when you know that your index values will be unique, or you want last-one-in to win
    function indexBy(array, propName) {
        var result = {};
        forEach(array, function (item) {
            result[item[propName]] = item;
        });
        return result;
    }

// extracted from underscore.js
// Return a copy of the object only containing the whitelisted properties.
    function pick(obj) {
        var copy = {};
        var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
        forEach(keys, function (key) {
            if (key in obj) copy[key] = obj[key];
        });
        return copy;
    }

// extracted from underscore.js
// Return a copy of the object omitting the blacklisted properties.
    function omit(obj) {
        var copy = {};
        var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
        for (var key in obj) {
            if (indexOf(keys, key) == -1) copy[key] = obj[key];
        }
        return copy;
    }

    function pluck(collection, key) {
        var result = isArray(collection) ? [] : {};

        forEach(collection, function (val, i) {
            result[i] = isFunction(key) ? key(val) : val[key];
        });
        return result;
    }

    function filter(collection, callback) {
        var array = isArray(collection);
        var result = array ? [] : {};
        forEach(collection, function (val, i) {
            if (callback(val, i)) {
                result[array ? result.length : i] = val;
            }
        });
        return result;
    }

    function map(collection, callback) {
        var result = isArray(collection) ? [] : {};

        forEach(collection, function (val, i) {
            result[i] = callback(val, i);
        });
        return result;
    }

    /**
     * @ngdoc overview
     * @name ui.router.util
     *
     * @description
     * # ui.router.util sub-module
     *
     * This module is a dependency of other sub-modules. Do not include this module as a dependency
     * in your angular app (use {@link ui.router} module instead).
     *
     */
    angular.module('ui.router.util', ['ng']);

    /**
     * @ngdoc overview
     * @name ui.router.router
     *
     * @requires ui.router.util
     *
     * @description
     * # ui.router.router sub-module
     *
     * This module is a dependency of other sub-modules. Do not include this module as a dependency
     * in your angular app (use {@link ui.router} module instead).
     */
    angular.module('ui.router.router', ['ui.router.util']);

    /**
     * @ngdoc overview
     * @name ui.router.state
     *
     * @requires ui.router.router
     * @requires ui.router.util
     *
     * @description
     * # ui.router.state sub-module
     *
     * This module is a dependency of the main ui.router module. Do not include this module as a dependency
     * in your angular app (use {@link ui.router} module instead).
     *
     */
    angular.module('ui.router.state', ['ui.router.router', 'ui.router.util']);

    /**
     * @ngdoc overview
     * @name ui.router
     *
     * @requires ui.router.state
     *
     * @description
     * # ui.router
     *
     * ## The main module for ui.router
     * There are several sub-modules included with the ui.router module, however only this module is needed
     * as a dependency within your angular app. The other modules are for organization purposes.
     *
     * The modules are:
     * * ui.router - the main "umbrella" module
     * * ui.router.router -
     *
     * *You'll need to include **only** this module as the dependency within your angular app.*
     *
     * <pre>
     * <!doctype html>
     * <html ng-app="myApp">
     * <head>
     *   <script src="js/angular.js"></script>
     *   <!-- Include the ui-router script -->
     *   <script src="js/angular-ui-router.min.js"></script>
     *   <script>
     *     // ...and add 'ui.router' as a dependency
     *     var myApp = angular.module('myApp', ['ui.router']);
     *   </script>
     * </head>
     * <body>
     * </body>
     * </html>
     * </pre>
     */
    angular.module('ui.router', ['ui.router.state']);

    angular.module('ui.router.compat', ['ui.router']);

    /**
     * @ngdoc object
     * @name ui.router.util.$resolve
     *
     * @requires $q
     * @requires $injector
     *
     * @description
     * Manages resolution of (acyclic) graphs of promises.
     */
    $Resolve.$inject = ['$q', '$injector'];
    function $Resolve($q, $injector) {

        var VISIT_IN_PROGRESS = 1,
            VISIT_DONE = 2,
            NOTHING = {},
            NO_DEPENDENCIES = [],
            NO_LOCALS = NOTHING,
            NO_PARENT = extend($q.when(NOTHING), {$$promises: NOTHING, $$values: NOTHING});


        /**
         * @ngdoc function
         * @name ui.router.util.$resolve#study
         * @methodOf ui.router.util.$resolve
         *
         * @description
         * Studies a set of invocables that are likely to be used multiple times.
         * <pre>
         * $resolve.study(invocables)(locals, parent, self)
         * </pre>
         * is equivalent to
         * <pre>
         * $resolve.resolve(invocables, locals, parent, self)
         * </pre>
         * but the former is more efficient (in fact `resolve` just calls `study`
         * internally).
         *
         * @param {object} invocables Invocable objects
         * @return {function} a function to pass in locals, parent and self
         */
        this.study = function (invocables) {
            if (!isObject(invocables)) throw new Error("'invocables' must be an object");
            var invocableKeys = objectKeys(invocables || {});

            // Perform a topological sort of invocables to build an ordered plan
            var plan = [], cycle = [], visited = {};

            function visit(value, key) {
                if (visited[key] === VISIT_DONE) return;

                cycle.push(key);
                if (visited[key] === VISIT_IN_PROGRESS) {
                    cycle.splice(0, indexOf(cycle, key));
                    throw new Error("Cyclic dependency: " + cycle.join(" -> "));
                }
                visited[key] = VISIT_IN_PROGRESS;

                if (isString(value)) {
                    plan.push(key, [function () {
                        return $injector.get(value);
                    }], NO_DEPENDENCIES);
                } else {
                    var params = $injector.annotate(value);
                    forEach(params, function (param) {
                        if (param !== key && invocables.hasOwnProperty(param)) visit(invocables[param], param);
                    });
                    plan.push(key, value, params);
                }

                cycle.pop();
                visited[key] = VISIT_DONE;
            }

            forEach(invocables, visit);
            invocables = cycle = visited = null; // plan is all that's required

            function isResolve(value) {
                return isObject(value) && value.then && value.$$promises;
            }

            return function (locals, parent, self) {
                if (isResolve(locals) && self === undefined) {
                    self = parent;
                    parent = locals;
                    locals = null;
                }
                if (!locals) locals = NO_LOCALS;
                else if (!isObject(locals)) {
                    throw new Error("'locals' must be an object");
                }
                if (!parent) parent = NO_PARENT;
                else if (!isResolve(parent)) {
                    throw new Error("'parent' must be a promise returned by $resolve.resolve()");
                }

                // To complete the overall resolution, we have to wait for the parent
                // promise and for the promise for each invokable in our plan.
                var resolution = $q.defer(),
                    result = resolution.promise,
                    promises = result.$$promises = {},
                    values = extend({}, locals),
                    wait = 1 + plan.length / 3,
                    merged = false;

                function done() {
                    // Merge parent values we haven't got yet and publish our own $$values
                    if (!--wait) {
                        if (!merged) merge(values, parent.$$values);
                        result.$$values = values;
                        result.$$promises = result.$$promises || true; // keep for isResolve()
                        delete result.$$inheritedValues;
                        resolution.resolve(values);
                    }
                }

                function fail(reason) {
                    result.$$failure = reason;
                    resolution.reject(reason);
                }

                // Short-circuit if parent has already failed
                if (isDefined(parent.$$failure)) {
                    fail(parent.$$failure);
                    return result;
                }

                if (parent.$$inheritedValues) {
                    merge(values, omit(parent.$$inheritedValues, invocableKeys));
                }

                // Merge parent values if the parent has already resolved, or merge
                // parent promises and wait if the parent resolve is still in progress.
                extend(promises, parent.$$promises);
                if (parent.$$values) {
                    merged = merge(values, omit(parent.$$values, invocableKeys));
                    result.$$inheritedValues = omit(parent.$$values, invocableKeys);
                    done();
                } else {
                    if (parent.$$inheritedValues) {
                        result.$$inheritedValues = omit(parent.$$inheritedValues, invocableKeys);
                    }
                    parent.then(done, fail);
                }

                // Process each invocable in the plan, but ignore any where a local of the same name exists.
                for (var i = 0, ii = plan.length; i < ii; i += 3) {
                    if (locals.hasOwnProperty(plan[i])) done();
                    else invoke(plan[i], plan[i + 1], plan[i + 2]);
                }

                function invoke(key, invocable, params) {
                    // Create a deferred for this invocation. Failures will propagate to the resolution as well.
                    var invocation = $q.defer(), waitParams = 0;

                    function onfailure(reason) {
                        invocation.reject(reason);
                        fail(reason);
                    }

                    // Wait for any parameter that we have a promise for (either from parent or from this
                    // resolve; in that case study() will have made sure it's ordered before us in the plan).
                    forEach(params, function (dep) {
                        if (promises.hasOwnProperty(dep) && !locals.hasOwnProperty(dep)) {
                            waitParams++;
                            promises[dep].then(function (result) {
                                values[dep] = result;
                                if (!(--waitParams)) proceed();
                            }, onfailure);
                        }
                    });
                    if (!waitParams) proceed();
                    function proceed() {
                        if (isDefined(result.$$failure)) return;
                        try {
                            invocation.resolve($injector.invoke(invocable, self, values));
                            invocation.promise.then(function (result) {
                                values[key] = result;
                                done();
                            }, onfailure);
                        } catch (e) {
                            onfailure(e);
                        }
                    }

                    // Publish promise synchronously; invocations further down in the plan may depend on it.
                    promises[key] = invocation.promise;
                }

                return result;
            };
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$resolve#resolve
         * @methodOf ui.router.util.$resolve
         *
         * @description
         * Resolves a set of invocables. An invocable is a function to be invoked via
         * `$injector.invoke()`, and can have an arbitrary number of dependencies.
         * An invocable can either return a value directly,
         * or a `$q` promise. If a promise is returned it will be resolved and the
         * resulting value will be used instead. Dependencies of invocables are resolved
         * (in this order of precedence)
         *
         * - from the specified `locals`
         * - from another invocable that is part of this `$resolve` call
         * - from an invocable that is inherited from a `parent` call to `$resolve`
         *   (or recursively
         * - from any ancestor `$resolve` of that parent).
         *
         * The return value of `$resolve` is a promise for an object that contains
         * (in this order of precedence)
         *
         * - any `locals` (if specified)
         * - the resolved return values of all injectables
         * - any values inherited from a `parent` call to `$resolve` (if specified)
         *
         * The promise will resolve after the `parent` promise (if any) and all promises
         * returned by injectables have been resolved. If any invocable
         * (or `$injector.invoke`) throws an exception, or if a promise returned by an
         * invocable is rejected, the `$resolve` promise is immediately rejected with the
         * same error. A rejection of a `parent` promise (if specified) will likewise be
         * propagated immediately. Once the `$resolve` promise has been rejected, no
         * further invocables will be called.
         *
         * Cyclic dependencies between invocables are not permitted and will caues `$resolve`
         * to throw an error. As a special case, an injectable can depend on a parameter
         * with the same name as the injectable, which will be fulfilled from the `parent`
         * injectable of the same name. This allows inherited values to be decorated.
         * Note that in this case any other injectable in the same `$resolve` with the same
         * dependency would see the decorated value, not the inherited value.
         *
         * Note that missing dependencies -- unlike cyclic dependencies -- will cause an
         * (asynchronous) rejection of the `$resolve` promise rather than a (synchronous)
         * exception.
         *
         * Invocables are invoked eagerly as soon as all dependencies are available.
         * This is true even for dependencies inherited from a `parent` call to `$resolve`.
         *
         * As a special case, an invocable can be a string, in which case it is taken to
         * be a service name to be passed to `$injector.get()`. This is supported primarily
         * for backwards-compatibility with the `resolve` property of `$routeProvider`
         * routes.
         *
         * @param {object} invocables functions to invoke or
         * `$injector` services to fetch.
         * @param {object} locals  values to make available to the injectables
         * @param {object} parent  a promise returned by another call to `$resolve`.
         * @param {object} self  the `this` for the invoked methods
         * @return {object} Promise for an object that contains the resolved return value
         * of all invocables, as well as any inherited and local values.
         */
        this.resolve = function (invocables, locals, parent, self) {
            return this.study(invocables)(locals, parent, self);
        };
    }

    angular.module('ui.router.util').service('$resolve', $Resolve);


    /**
     * @ngdoc object
     * @name ui.router.util.$templateFactory
     *
     * @requires $http
     * @requires $templateCache
     * @requires $injector
     *
     * @description
     * Service. Manages loading of templates.
     */
    $TemplateFactory.$inject = ['$http', '$templateCache', '$injector'];
    function $TemplateFactory($http, $templateCache, $injector) {

        /**
         * @ngdoc function
         * @name ui.router.util.$templateFactory#fromConfig
         * @methodOf ui.router.util.$templateFactory
         *
         * @description
         * Creates a template from a configuration object.
         *
         * @param {object} config Configuration object for which to load a template.
         * The following properties are search in the specified order, and the first one
         * that is defined is used to create the template:
         *
         * @param {string|object} config.template html string template or function to
         * load via {@link ui.router.util.$templateFactory#fromString fromString}.
         * @param {string|object} config.templateUrl url to load or a function returning
         * the url to load via {@link ui.router.util.$templateFactory#fromUrl fromUrl}.
         * @param {Function} config.templateProvider function to invoke via
         * {@link ui.router.util.$templateFactory#fromProvider fromProvider}.
         * @param {object} params  Parameters to pass to the template function.
         * @param {object} locals Locals to pass to `invoke` if the template is loaded
         * via a `templateProvider`. Defaults to `{ params: params }`.
         *
         * @return {string|object}  The template html as a string, or a promise for
         * that string,or `null` if no template is configured.
         */
        this.fromConfig = function (config, params, locals) {
            return (
                isDefined(config.template) ? this.fromString(config.template, params) :
                    isDefined(config.templateUrl) ? this.fromUrl(config.templateUrl, params) :
                        isDefined(config.templateProvider) ? this.fromProvider(config.templateProvider, params, locals) :
                            null
            );
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$templateFactory#fromString
         * @methodOf ui.router.util.$templateFactory
         *
         * @description
         * Creates a template from a string or a function returning a string.
         *
         * @param {string|object} template html template as a string or function that
         * returns an html template as a string.
         * @param {object} params Parameters to pass to the template function.
         *
         * @return {string|object} The template html as a string, or a promise for that
         * string.
         */
        this.fromString = function (template, params) {
            return isFunction(template) ? template(params) : template;
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$templateFactory#fromUrl
         * @methodOf ui.router.util.$templateFactory
         *
         * @description
         * Loads a template from the a URL via `$http` and `$templateCache`.
         *
         * @param {string|Function} url url of the template to load, or a function
         * that returns a url.
         * @param {Object} params Parameters to pass to the url function.
         * @return {string|Promise.<string>} The template html as a string, or a promise
         * for that string.
         */
        this.fromUrl = function (url, params) {
            if (isFunction(url)) url = url(params);
            if (url == null) return null;
            else return $http
                .get(url, {cache: $templateCache, headers: {Accept: 'text/html'}})
                .then(function (response) {
                    return response.data;
                });
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$templateFactory#fromProvider
         * @methodOf ui.router.util.$templateFactory
         *
         * @description
         * Creates a template by invoking an injectable provider function.
         *
         * @param {Function} provider Function to invoke via `$injector.invoke`
         * @param {Object} params Parameters for the template.
         * @param {Object} locals Locals to pass to `invoke`. Defaults to
         * `{ params: params }`.
         * @return {string|Promise.<string>} The template html as a string, or a promise
         * for that string.
         */
        this.fromProvider = function (provider, params, locals) {
            return $injector.invoke(provider, null, locals || {params: params});
        };
    }

    angular.module('ui.router.util').service('$templateFactory', $TemplateFactory);

    var $$UMFP; // reference to $UrlMatcherFactoryProvider

    /**
     * @ngdoc object
     * @name ui.router.util.type:UrlMatcher
     *
     * @description
     * Matches URLs against patterns and extracts named parameters from the path or the search
     * part of the URL. A URL pattern consists of a path pattern, optionally followed by '?' and a list
     * of search parameters. Multiple search parameter names are separated by '&'. Search parameters
     * do not influence whether or not a URL is matched, but their values are passed through into
     * the matched parameters returned by {@link ui.router.util.type:UrlMatcher#methods_exec exec}.
     *
     * Path parameter placeholders can be specified using simple colon/catch-all syntax or curly brace
     * syntax, which optionally allows a regular expression for the parameter to be specified:
     *
     * * `':'` name - colon placeholder
     * * `'*'` name - catch-all placeholder
     * * `'{' name '}'` - curly placeholder
     * * `'{' name ':' regexp|type '}'` - curly placeholder with regexp or type name. Should the
     *   regexp itself contain curly braces, they must be in matched pairs or escaped with a backslash.
     *
     * Parameter names may contain only word characters (latin letters, digits, and underscore) and
     * must be unique within the pattern (across both path and search parameters). For colon
     * placeholders or curly placeholders without an explicit regexp, a path parameter matches any
     * number of characters other than '/'. For catch-all placeholders the path parameter matches
     * any number of characters.
     *
     * Examples:
     *
     * * `'/hello/'` - Matches only if the path is exactly '/hello/'. There is no special treatment for
     *   trailing slashes, and patterns have to match the entire path, not just a prefix.
     * * `'/user/:id'` - Matches '/user/bob' or '/user/1234!!!' or even '/user/' but not '/user' or
     *   '/user/bob/details'. The second path segment will be captured as the parameter 'id'.
     * * `'/user/{id}'` - Same as the previous example, but using curly brace syntax.
     * * `'/user/{id:[^/]*}'` - Same as the previous example.
     * * `'/user/{id:[0-9a-fA-F]{1,8}}'` - Similar to the previous example, but only matches if the id
     *   parameter consists of 1 to 8 hex digits.
     * * `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the
     *   path into the parameter 'path'.
     * * `'/files/*path'` - ditto.
     * * `'/calendar/{start:date}'` - Matches "/calendar/2014-11-12" (because the pattern defined
     *   in the built-in  `date` Type matches `2014-11-12`) and provides a Date object in $stateParams.start
     *
     * @param {string} pattern  The pattern to compile into a matcher.
     * @param {Object} config  A configuration object hash:
     * @param {Object=} parentMatcher Used to concatenate the pattern/config onto
     *   an existing UrlMatcher
     *
     * * `caseInsensitive` - `true` if URL matching should be case insensitive, otherwise `false`, the default value (for backward compatibility) is `false`.
     * * `strict` - `false` if matching against a URL with a trailing slash should be treated as equivalent to a URL without a trailing slash, the default value is `true`.
     *
     * @property {string} prefix  A static prefix of this pattern. The matcher guarantees that any
     *   URL matching this matcher (i.e. any string for which {@link ui.router.util.type:UrlMatcher#methods_exec exec()} returns
     *   non-null) will start with this prefix.
     *
     * @property {string} source  The pattern that was passed into the constructor
     *
     * @property {string} sourcePath  The path portion of the source property
     *
     * @property {string} sourceSearch  The search portion of the source property
     *
     * @property {string} regex  The constructed regex that will be used to match against the url when
     *   it is time to determine which url will match.
     *
     * @returns {Object}  New `UrlMatcher` object
     */
    function UrlMatcher(pattern, config, parentMatcher) {
        config = extend({params: {}}, isObject(config) ? config : {});

        // Find all placeholders and create a compiled pattern, using either classic or curly syntax:
        //   '*' name
        //   ':' name
        //   '{' name '}'
        //   '{' name ':' regexp '}'
        // The regular expression is somewhat complicated due to the need to allow curly braces
        // inside the regular expression. The placeholder regexp breaks down as follows:
        //    ([:*])([\w\[\]]+)              - classic placeholder ($1 / $2) (search version has - for snake-case)
        //    \{([\w\[\]]+)(?:\:( ... ))?\}  - curly brace placeholder ($3) with optional regexp/type ... ($4) (search version has - for snake-case
        //    (?: ... | ... | ... )+         - the regexp consists of any number of atoms, an atom being either
        //    [^{}\\]+                       - anything other than curly braces or backslash
        //    \\.                            - a backslash escape
        //    \{(?:[^{}\\]+|\\.)*\}          - a matched set of curly braces containing other atoms
        var placeholder = /([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
            searchPlaceholder = /([:]?)([\w\[\]-]+)|\{([\w\[\]-]+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
            compiled = '^', last = 0, m,
            segments = this.segments = [],
            parentParams = parentMatcher ? parentMatcher.params : {},
            params = this.params = parentMatcher ? parentMatcher.params.$$new() : new $$UMFP.ParamSet(),
            paramNames = [];

        function addParameter(id, type, config, location) {
            paramNames.push(id);
            if (parentParams[id]) return parentParams[id];
            if (!/^\w+(-+\w+)*(?:\[\])?$/.test(id)) throw new Error("Invalid parameter name '" + id + "' in pattern '" + pattern + "'");
            if (params[id]) throw new Error("Duplicate parameter name '" + id + "' in pattern '" + pattern + "'");
            params[id] = new $$UMFP.Param(id, type, config, location);
            return params[id];
        }

        function quoteRegExp(string, pattern, squash) {
            var surroundPattern = ['', ''], result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
            if (!pattern) return result;
            switch (squash) {
                case false:
                    surroundPattern = ['(', ')'];
                    break;
                case true:
                    surroundPattern = ['?(', ')?'];
                    break;
                default:
                    surroundPattern = ['(' + squash + "|", ')?'];
                    break;
            }
            return result + surroundPattern[0] + pattern + surroundPattern[1];
        }

        this.source = pattern;

        // Split into static segments separated by path parameter placeholders.
        // The number of segments is always 1 more than the number of parameters.
        function matchDetails(m, isSearch) {
            var id, regexp, segment, type, cfg, arrayMode;
            id = m[2] || m[3]; // IE[78] returns '' for unmatched groups instead of null
            cfg = config.params[id];
            segment = pattern.substring(last, m.index);
            regexp = isSearch ? m[4] : m[4] || (m[1] == '*' ? '.*' : null);
            type = $$UMFP.type(regexp || "string") || inherit($$UMFP.type("string"), {pattern: new RegExp(regexp)});
            return {
                id: id, regexp: regexp, segment: segment, type: type, cfg: cfg
            };
        }

        var p, param, segment;
        while ((m = placeholder.exec(pattern))) {
            p = matchDetails(m, false);
            if (p.segment.indexOf('?') >= 0) break; // we're into the search part

            param = addParameter(p.id, p.type, p.cfg, "path");
            compiled += quoteRegExp(p.segment, param.type.pattern.source, param.squash);
            segments.push(p.segment);
            last = placeholder.lastIndex;
        }
        segment = pattern.substring(last);

        // Find any search parameter names and remove them from the last segment
        var i = segment.indexOf('?');

        if (i >= 0) {
            var search = this.sourceSearch = segment.substring(i);
            segment = segment.substring(0, i);
            this.sourcePath = pattern.substring(0, last + i);

            if (search.length > 0) {
                last = 0;
                while ((m = searchPlaceholder.exec(search))) {
                    p = matchDetails(m, true);
                    param = addParameter(p.id, p.type, p.cfg, "search");
                    last = placeholder.lastIndex;
                    // check if ?&
                }
            }
        } else {
            this.sourcePath = pattern;
            this.sourceSearch = '';
        }

        compiled += quoteRegExp(segment) + (config.strict === false ? '\/?' : '') + '$';
        segments.push(segment);

        this.regexp = new RegExp(compiled, config.caseInsensitive ? 'i' : undefined);
        this.prefix = segments[0];
        this.$$paramNames = paramNames;
    }

    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#concat
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * Returns a new matcher for a pattern constructed by appending the path part and adding the
     * search parameters of the specified pattern to this pattern. The current pattern is not
     * modified. This can be understood as creating a pattern for URLs that are relative to (or
     * suffixes of) the current pattern.
     *
     * @example
     * The following two matchers are equivalent:
     * <pre>
     * new UrlMatcher('/user/{id}?q').concat('/details?date');
     * new UrlMatcher('/user/{id}/details?q&date');
     * </pre>
     *
     * @param {string} pattern  The pattern to append.
     * @param {Object} config  An object hash of the configuration for the matcher.
     * @returns {UrlMatcher}  A matcher for the concatenated pattern.
     */
    UrlMatcher.prototype.concat = function (pattern, config) {
        // Because order of search parameters is irrelevant, we can add our own search
        // parameters to the end of the new pattern. Parse the new pattern by itself
        // and then join the bits together, but it's much easier to do this on a string level.
        var defaultConfig = {
            caseInsensitive: $$UMFP.caseInsensitive(),
            strict: $$UMFP.strictMode(),
            squash: $$UMFP.defaultSquashPolicy()
        };
        return new UrlMatcher(this.sourcePath + pattern + this.sourceSearch, extend(defaultConfig, config), this);
    };

    UrlMatcher.prototype.toString = function () {
        return this.source;
    };

    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#exec
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * Tests the specified path against this matcher, and returns an object containing the captured
     * parameter values, or null if the path does not match. The returned object contains the values
     * of any search parameters that are mentioned in the pattern, but their value may be null if
     * they are not present in `searchParams`. This means that search parameters are always treated
     * as optional.
     *
     * @example
     * <pre>
     * new UrlMatcher('/user/{id}?q&r').exec('/user/bob', {
 *   x: '1', q: 'hello'
 * });
     * // returns { id: 'bob', q: 'hello', r: null }
     * </pre>
     *
     * @param {string} path  The URL path to match, e.g. `$location.path()`.
     * @param {Object} searchParams  URL search parameters, e.g. `$location.search()`.
     * @returns {Object}  The captured parameter values.
     */
    UrlMatcher.prototype.exec = function (path, searchParams) {
        var m = this.regexp.exec(path);
        if (!m) return null;
        searchParams = searchParams || {};

        var paramNames = this.parameters(), nTotal = paramNames.length,
            nPath = this.segments.length - 1,
            values = {}, i, j, cfg, paramName;

        if (nPath !== m.length - 1) throw new Error("Unbalanced capture group in route '" + this.source + "'");

        function decodePathArray(string) {
            function reverseString(str) {
                return str.split("").reverse().join("");
            }

            function unquoteDashes(str) {
                return str.replace(/\\-/, "-");
            }

            var split = reverseString(string).split(/-(?!\\)/);
            var allReversed = map(split, reverseString);
            return map(allReversed, unquoteDashes).reverse();
        }

        for (i = 0; i < nPath; i++) {
            paramName = paramNames[i];
            var param = this.params[paramName];
            var paramVal = m[i + 1];
            // if the param value matches a pre-replace pair, replace the value before decoding.
            for (j = 0; j < param.replace; j++) {
                if (param.replace[j].from === paramVal) paramVal = param.replace[j].to;
            }
            if (paramVal && param.array === true) paramVal = decodePathArray(paramVal);
            values[paramName] = param.value(paramVal);
        }
        for (/**/; i < nTotal; i++) {
            paramName = paramNames[i];
            values[paramName] = this.params[paramName].value(searchParams[paramName]);
        }

        return values;
    };

    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#parameters
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * Returns the names of all path and search parameters of this pattern in an unspecified order.
     *
     * @returns {Array.<string>}  An array of parameter names. Must be treated as read-only. If the
     *    pattern has no parameters, an empty array is returned.
     */
    UrlMatcher.prototype.parameters = function (param) {
        if (!isDefined(param)) return this.$$paramNames;
        return this.params[param] || null;
    };

    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#validate
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * Checks an object hash of parameters to validate their correctness according to the parameter
     * types of this `UrlMatcher`.
     *
     * @param {Object} params The object hash of parameters to validate.
     * @returns {boolean} Returns `true` if `params` validates, otherwise `false`.
     */
    UrlMatcher.prototype.validates = function (params) {
        return this.params.$$validates(params);
    };

    /**
     * @ngdoc function
     * @name ui.router.util.type:UrlMatcher#format
     * @methodOf ui.router.util.type:UrlMatcher
     *
     * @description
     * Creates a URL that matches this pattern by substituting the specified values
     * for the path and search parameters. Null values for path parameters are
     * treated as empty strings.
     *
     * @example
     * <pre>
     * new UrlMatcher('/user/{id}?q').format({ id:'bob', q:'yes' });
     * // returns '/user/bob?q=yes'
     * </pre>
     *
     * @param {Object} values  the values to substitute for the parameters in this pattern.
     * @returns {string}  the formatted URL (path and optionally search part).
     */
    UrlMatcher.prototype.format = function (values) {
        values = values || {};
        var segments = this.segments, params = this.parameters(), paramset = this.params;
        if (!this.validates(values)) return null;

        var i, search = false, nPath = segments.length - 1, nTotal = params.length, result = segments[0];

        function encodeDashes(str) { // Replace dashes with encoded "\-"
            return encodeURIComponent(str).replace(/-/g, function (c) {
                return '%5C%' + c.charCodeAt(0).toString(16).toUpperCase();
            });
        }

        for (i = 0; i < nTotal; i++) {
            var isPathParam = i < nPath;
            var name = params[i], param = paramset[name], value = param.value(values[name]);
            var isDefaultValue = param.isOptional && param.type.equals(param.value(), value);
            var squash = isDefaultValue ? param.squash : false;
            var encoded = param.type.encode(value);

            if (isPathParam) {
                var nextSegment = segments[i + 1];
                if (squash === false) {
                    if (encoded != null) {
                        if (isArray(encoded)) {
                            result += map(encoded, encodeDashes).join("-");
                        } else {
                            result += encodeURIComponent(encoded);
                        }
                    }
                    result += nextSegment;
                } else if (squash === true) {
                    var capture = result.match(/\/$/) ? /\/?(.*)/ : /(.*)/;
                    result += nextSegment.match(capture)[1];
                } else if (isString(squash)) {
                    result += squash + nextSegment;
                }
            } else {
                if (encoded == null || (isDefaultValue && squash !== false)) continue;
                if (!isArray(encoded)) encoded = [encoded];
                encoded = map(encoded, encodeURIComponent).join('&' + name + '=');
                result += (search ? '&' : '?') + (name + '=' + encoded);
                search = true;
            }
        }

        return result;
    };

    /**
     * @ngdoc object
     * @name ui.router.util.type:Type
     *
     * @description
     * Implements an interface to define custom parameter types that can be decoded from and encoded to
     * string parameters matched in a URL. Used by {@link ui.router.util.type:UrlMatcher `UrlMatcher`}
     * objects when matching or formatting URLs, or comparing or validating parameter values.
     *
     * See {@link ui.router.util.$urlMatcherFactory#methods_type `$urlMatcherFactory#type()`} for more
     * information on registering custom types.
     *
     * @param {Object} config  A configuration object which contains the custom type definition.  The object's
     *        properties will override the default methods and/or pattern in `Type`'s public interface.
     * @example
     * <pre>
     * {
 *   decode: function(val) { return parseInt(val, 10); },
 *   encode: function(val) { return val && val.toString(); },
 *   equals: function(a, b) { return this.is(a) && a === b; },
 *   is: function(val) { return angular.isNumber(val) isFinite(val) && val % 1 === 0; },
 *   pattern: /\d+/
 * }
     * </pre>
     *
     * @property {RegExp} pattern The regular expression pattern used to match values of this type when
     *           coming from a substring of a URL.
     *
     * @returns {Object}  Returns a new `Type` object.
     */
    function Type(config) {
        extend(this, config);
    }

    /**
     * @ngdoc function
     * @name ui.router.util.type:Type#is
     * @methodOf ui.router.util.type:Type
     *
     * @description
     * Detects whether a value is of a particular type. Accepts a native (decoded) value
     * and determines whether it matches the current `Type` object.
     *
     * @param {*} val  The value to check.
     * @param {string} key  Optional. If the type check is happening in the context of a specific
     *        {@link ui.router.util.type:UrlMatcher `UrlMatcher`} object, this is the name of the
     *        parameter in which `val` is stored. Can be used for meta-programming of `Type` objects.
     * @returns {Boolean}  Returns `true` if the value matches the type, otherwise `false`.
     */
    Type.prototype.is = function (val, key) {
        return true;
    };

    /**
     * @ngdoc function
     * @name ui.router.util.type:Type#encode
     * @methodOf ui.router.util.type:Type
     *
     * @description
     * Encodes a custom/native type value to a string that can be embedded in a URL. Note that the
     * return value does *not* need to be URL-safe (i.e. passed through `encodeURIComponent()`), it
     * only needs to be a representation of `val` that has been coerced to a string.
     *
     * @param {*} val  The value to encode.
     * @param {string} key  The name of the parameter in which `val` is stored. Can be used for
     *        meta-programming of `Type` objects.
     * @returns {string}  Returns a string representation of `val` that can be encoded in a URL.
     */
    Type.prototype.encode = function (val, key) {
        return val;
    };

    /**
     * @ngdoc function
     * @name ui.router.util.type:Type#decode
     * @methodOf ui.router.util.type:Type
     *
     * @description
     * Converts a parameter value (from URL string or transition param) to a custom/native value.
     *
     * @param {string} val  The URL parameter value to decode.
     * @param {string} key  The name of the parameter in which `val` is stored. Can be used for
     *        meta-programming of `Type` objects.
     * @returns {*}  Returns a custom representation of the URL parameter value.
     */
    Type.prototype.decode = function (val, key) {
        return val;
    };

    /**
     * @ngdoc function
     * @name ui.router.util.type:Type#equals
     * @methodOf ui.router.util.type:Type
     *
     * @description
     * Determines whether two decoded values are equivalent.
     *
     * @param {*} a  A value to compare against.
     * @param {*} b  A value to compare against.
     * @returns {Boolean}  Returns `true` if the values are equivalent/equal, otherwise `false`.
     */
    Type.prototype.equals = function (a, b) {
        return a == b;
    };

    Type.prototype.$subPattern = function () {
        var sub = this.pattern.toString();
        return sub.substr(1, sub.length - 2);
    };

    Type.prototype.pattern = /.*/;

    Type.prototype.toString = function () {
        return "{Type:" + this.name + "}";
    };

    /*
     * Wraps an existing custom Type as an array of Type, depending on 'mode'.
     * e.g.:
     * - urlmatcher pattern "/path?{queryParam[]:int}"
     * - url: "/path?queryParam=1&queryParam=2
     * - $stateParams.queryParam will be [1, 2]
     * if `mode` is "auto", then
     * - url: "/path?queryParam=1 will create $stateParams.queryParam: 1
     * - url: "/path?queryParam=1&queryParam=2 will create $stateParams.queryParam: [1, 2]
     */
    Type.prototype.$asArray = function (mode, isSearch) {
        if (!mode) return this;
        if (mode === "auto" && !isSearch) throw new Error("'auto' array mode is for query parameters only");
        return new ArrayType(this, mode);

        function ArrayType(type, mode) {
            function bindTo(type, callbackName) {
                return function () {
                    return type[callbackName].apply(type, arguments);
                };
            }

            // Wrap non-array value as array
            function arrayWrap(val) {
                return isArray(val) ? val : (isDefined(val) ? [val] : []);
            }

            // Unwrap array value for "auto" mode. Return undefined for empty array.
            function arrayUnwrap(val) {
                switch (val.length) {
                    case 0:
                        return undefined;
                    case 1:
                        return mode === "auto" ? val[0] : val;
                    default:
                        return val;
                }
            }

            function falsey(val) {
                return !val;
            }

            // Wraps type (.is/.encode/.decode) functions to operate on each value of an array
            function arrayHandler(callback, allTruthyMode) {
                return function handleArray(val) {
                    val = arrayWrap(val);
                    var result = map(val, callback);
                    if (allTruthyMode === true)
                        return filter(result, falsey).length === 0;
                    return arrayUnwrap(result);
                };
            }

            // Wraps type (.equals) functions to operate on each value of an array
            function arrayEqualsHandler(callback) {
                return function handleArray(val1, val2) {
                    var left = arrayWrap(val1), right = arrayWrap(val2);
                    if (left.length !== right.length) return false;
                    for (var i = 0; i < left.length; i++) {
                        if (!callback(left[i], right[i])) return false;
                    }
                    return true;
                };
            }

            this.encode = arrayHandler(bindTo(type, 'encode'));
            this.decode = arrayHandler(bindTo(type, 'decode'));
            this.is = arrayHandler(bindTo(type, 'is'), true);
            this.equals = arrayEqualsHandler(bindTo(type, 'equals'));
            this.pattern = type.pattern;
            this.$arrayMode = mode;
        }
    };


    /**
     * @ngdoc object
     * @name ui.router.util.$urlMatcherFactory
     *
     * @description
     * Factory for {@link ui.router.util.type:UrlMatcher `UrlMatcher`} instances. The factory
     * is also available to providers under the name `$urlMatcherFactoryProvider`.
     */
    function $UrlMatcherFactory() {
        $$UMFP = this;

        var isCaseInsensitive = false, isStrictMode = true, defaultSquashPolicy = false;

        function valToString(val) {
            return val != null ? val.toString().replace(/\//g, "%2F") : val;
        }

        function valFromString(val) {
            return val != null ? val.toString().replace(/%2F/g, "/") : val;
        }

//  TODO: in 1.0, make string .is() return false if value is undefined by default.
//  function regexpMatches(val) { /*jshint validthis:true */ return isDefined(val) && this.pattern.test(val); }
        function regexpMatches(val) { /*jshint validthis:true */
            return this.pattern.test(val);
        }

        var $types = {}, enqueue = true, typeQueue = [], injector, defaultTypes = {
            string: {
                encode: valToString,
                decode: valFromString,
                is: regexpMatches,
                pattern: /[^/]*/
            },
            int: {
                encode: valToString,
                decode: function (val) {
                    return parseInt(val, 10);
                },
                is: function (val) {
                    return isDefined(val) && this.decode(val.toString()) === val;
                },
                pattern: /\d+/
            },
            bool: {
                encode: function (val) {
                    return val ? 1 : 0;
                },
                decode: function (val) {
                    return parseInt(val, 10) !== 0;
                },
                is: function (val) {
                    return val === true || val === false;
                },
                pattern: /0|1/
            },
            date: {
                encode: function (val) {
                    if (!this.is(val))
                        return undefined;
                    return [val.getFullYear(),
                        ('0' + (val.getMonth() + 1)).slice(-2),
                        ('0' + val.getDate()).slice(-2)
                    ].join("-");
                },
                decode: function (val) {
                    if (this.is(val)) return val;
                    var match = this.capture.exec(val);
                    return match ? new Date(match[1], match[2] - 1, match[3]) : undefined;
                },
                is: function (val) {
                    return val instanceof Date && !isNaN(val.valueOf());
                },
                equals: function (a, b) {
                    return this.is(a) && this.is(b) && a.toISOString() === b.toISOString();
                },
                pattern: /[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])/,
                capture: /([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/
            },
            json: {
                encode: angular.toJson,
                decode: angular.fromJson,
                is: angular.isObject,
                equals: angular.equals,
                pattern: /[^/]*/
            },
            any: { // does not encode/decode
                encode: angular.identity,
                decode: angular.identity,
                is: angular.identity,
                equals: angular.equals,
                pattern: /.*/
            }
        };

        function getDefaultConfig() {
            return {
                strict: isStrictMode,
                caseInsensitive: isCaseInsensitive
            };
        }

        function isInjectable(value) {
            return (isFunction(value) || (isArray(value) && isFunction(value[value.length - 1])));
        }

        /**
         * [Internal] Get the default value of a parameter, which may be an injectable function.
         */
        $UrlMatcherFactory.$$getDefaultValue = function (config) {
            if (!isInjectable(config.value)) return config.value;
            if (!injector) throw new Error("Injectable functions cannot be called at configuration time");
            return injector.invoke(config.value);
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$urlMatcherFactory#caseInsensitive
         * @methodOf ui.router.util.$urlMatcherFactory
         *
         * @description
         * Defines whether URL matching should be case sensitive (the default behavior), or not.
         *
         * @param {boolean} value `false` to match URL in a case sensitive manner; otherwise `true`;
         * @returns {boolean} the current value of caseInsensitive
         */
        this.caseInsensitive = function (value) {
            if (isDefined(value))
                isCaseInsensitive = value;
            return isCaseInsensitive;
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$urlMatcherFactory#strictMode
         * @methodOf ui.router.util.$urlMatcherFactory
         *
         * @description
         * Defines whether URLs should match trailing slashes, or not (the default behavior).
         *
         * @param {boolean=} value `false` to match trailing slashes in URLs, otherwise `true`.
         * @returns {boolean} the current value of strictMode
         */
        this.strictMode = function (value) {
            if (isDefined(value))
                isStrictMode = value;
            return isStrictMode;
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$urlMatcherFactory#defaultSquashPolicy
         * @methodOf ui.router.util.$urlMatcherFactory
         *
         * @description
         * Sets the default behavior when generating or matching URLs with default parameter values.
         *
         * @param {string} value A string that defines the default parameter URL squashing behavior.
         *    `nosquash`: When generating an href with a default parameter value, do not squash the parameter value from the URL
         *    `slash`: When generating an href with a default parameter value, squash (remove) the parameter value, and, if the
         *             parameter is surrounded by slashes, squash (remove) one slash from the URL
         *    any other string, e.g. "~": When generating an href with a default parameter value, squash (remove)
         *             the parameter value from the URL and replace it with this string.
         */
        this.defaultSquashPolicy = function (value) {
            if (!isDefined(value)) return defaultSquashPolicy;
            if (value !== true && value !== false && !isString(value))
                throw new Error("Invalid squash policy: " + value + ". Valid policies: false, true, arbitrary-string");
            defaultSquashPolicy = value;
            return value;
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$urlMatcherFactory#compile
         * @methodOf ui.router.util.$urlMatcherFactory
         *
         * @description
         * Creates a {@link ui.router.util.type:UrlMatcher `UrlMatcher`} for the specified pattern.
         *
         * @param {string} pattern  The URL pattern.
         * @param {Object} config  The config object hash.
         * @returns {UrlMatcher}  The UrlMatcher.
         */
        this.compile = function (pattern, config) {
            return new UrlMatcher(pattern, extend(getDefaultConfig(), config));
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$urlMatcherFactory#isMatcher
         * @methodOf ui.router.util.$urlMatcherFactory
         *
         * @description
         * Returns true if the specified object is a `UrlMatcher`, or false otherwise.
         *
         * @param {Object} object  The object to perform the type check against.
         * @returns {Boolean}  Returns `true` if the object matches the `UrlMatcher` interface, by
         *          implementing all the same methods.
         */
        this.isMatcher = function (o) {
            if (!isObject(o)) return false;
            var result = true;

            forEach(UrlMatcher.prototype, function (val, name) {
                if (isFunction(val)) {
                    result = result && (isDefined(o[name]) && isFunction(o[name]));
                }
            });
            return result;
        };

        /**
         * @ngdoc function
         * @name ui.router.util.$urlMatcherFactory#type
         * @methodOf ui.router.util.$urlMatcherFactory
         *
         * @description
         * Registers a custom {@link ui.router.util.type:Type `Type`} object that can be used to
         * generate URLs with typed parameters.
         *
         * @param {string} name  The type name.
         * @param {Object|Function} definition   The type definition. See
         *        {@link ui.router.util.type:Type `Type`} for information on the values accepted.
         * @param {Object|Function} definitionFn (optional) A function that is injected before the app
         *        runtime starts.  The result of this function is merged into the existing `definition`.
         *        See {@link ui.router.util.type:Type `Type`} for information on the values accepted.
         *
         * @returns {Object}  Returns `$urlMatcherFactoryProvider`.
         *
         * @example
         * This is a simple example of a custom type that encodes and decodes items from an
         * array, using the array index as the URL-encoded value:
         *
         * <pre>
         * var list = ['John', 'Paul', 'George', 'Ringo'];
         *
         * $urlMatcherFactoryProvider.type('listItem', {
   *   encode: function(item) {
   *     // Represent the list item in the URL using its corresponding index
   *     return list.indexOf(item);
   *   },
   *   decode: function(item) {
   *     // Look up the list item by index
   *     return list[parseInt(item, 10)];
   *   },
   *   is: function(item) {
   *     // Ensure the item is valid by checking to see that it appears
   *     // in the list
   *     return list.indexOf(item) > -1;
   *   }
   * });
         *
         * $stateProvider.state('list', {
   *   url: "/list/{item:listItem}",
   *   controller: function($scope, $stateParams) {
   *     console.log($stateParams.item);
   *   }
   * });
         *
         * // ...
         *
         * // Changes URL to '/list/3', logs "Ringo" to the console
         * $state.go('list', { item: "Ringo" });
         * </pre>
         *
         * This is a more complex example of a type that relies on dependency injection to
         * interact with services, and uses the parameter name from the URL to infer how to
         * handle encoding and decoding parameter values:
         *
         * <pre>
         * // Defines a custom type that gets a value from a service,
         * // where each service gets different types of values from
         * // a backend API:
         * $urlMatcherFactoryProvider.type('dbObject', {}, function(Users, Posts) {
   *
   *   // Matches up services to URL parameter names
   *   var services = {
   *     user: Users,
   *     post: Posts
   *   };
   *
   *   return {
   *     encode: function(object) {
   *       // Represent the object in the URL using its unique ID
   *       return object.id;
   *     },
   *     decode: function(value, key) {
   *       // Look up the object by ID, using the parameter
   *       // name (key) to call the correct service
   *       return services[key].findById(value);
   *     },
   *     is: function(object, key) {
   *       // Check that object is a valid dbObject
   *       return angular.isObject(object) && object.id && services[key];
   *     }
   *     equals: function(a, b) {
   *       // Check the equality of decoded objects by comparing
   *       // their unique IDs
   *       return a.id === b.id;
   *     }
   *   };
   * });
         *
         * // In a config() block, you can then attach URLs with
         * // type-annotated parameters:
         * $stateProvider.state('users', {
   *   url: "/users",
   *   // ...
   * }).state('users.item', {
   *   url: "/{user:dbObject}",
   *   controller: function($scope, $stateParams) {
   *     // $stateParams.user will now be an object returned from
   *     // the Users service
   *   },
   *   // ...
   * });
         * </pre>
         */
        this.type = function (name, definition, definitionFn) {
            if (!isDefined(definition)) return $types[name];
            if ($types.hasOwnProperty(name)) throw new Error("A type named '" + name + "' has already been defined.");

            $types[name] = new Type(extend({name: name}, definition));
            if (definitionFn) {
                typeQueue.push({name: name, def: definitionFn});
                if (!enqueue) flushTypeQueue();
            }
            return this;
        };

        // `flushTypeQueue()` waits until `$urlMatcherFactory` is injected before invoking the queued `definitionFn`s
        function flushTypeQueue() {
            while (typeQueue.length) {
                var type = typeQueue.shift();
                if (type.pattern) throw new Error("You cannot override a type's .pattern at runtime.");
                angular.extend($types[type.name], injector.invoke(type.def));
            }
        }

        // Register default types. Store them in the prototype of $types.
        forEach(defaultTypes, function (type, name) {
            $types[name] = new Type(extend({name: name}, type));
        });
        $types = inherit($types, {});

        /* No need to document $get, since it returns this */
        this.$get = ['$injector', function ($injector) {
            injector = $injector;
            enqueue = false;
            flushTypeQueue();

            forEach(defaultTypes, function (type, name) {
                if (!$types[name]) $types[name] = new Type(type);
            });
            return this;
        }];

        this.Param = function Param(id, type, config, location) {
            var self = this;
            config = unwrapShorthand(config);
            type = getType(config, type, location);
            var arrayMode = getArrayMode();
            type = arrayMode ? type.$asArray(arrayMode, location === "search") : type;
            if (type.name === "string" && !arrayMode && location === "path" && config.value === undefined)
                config.value = ""; // for 0.2.x; in 0.3.0+ do not automatically default to ""
            var isOptional = config.value !== undefined;
            var squash = getSquashPolicy(config, isOptional);
            var replace = getReplace(config, arrayMode, isOptional, squash);

            function unwrapShorthand(config) {
                var keys = isObject(config) ? objectKeys(config) : [];
                var isShorthand = indexOf(keys, "value") === -1 && indexOf(keys, "type") === -1 &&
                    indexOf(keys, "squash") === -1 && indexOf(keys, "array") === -1;
                if (isShorthand) config = {value: config};
                config.$$fn = isInjectable(config.value) ? config.value : function () {
                    return config.value;
                };
                return config;
            }

            function getType(config, urlType, location) {
                if (config.type && urlType) throw new Error("Param '" + id + "' has two type configurations.");
                if (urlType) return urlType;
                if (!config.type) return (location === "config" ? $types.any : $types.string);
                return config.type instanceof Type ? config.type : new Type(config.type);
            }

            // array config: param name (param[]) overrides default settings.  explicit config overrides param name.
            function getArrayMode() {
                var arrayDefaults = {array: (location === "search" ? "auto" : false)};
                var arrayParamNomenclature = id.match(/\[\]$/) ? {array: true} : {};
                return extend(arrayDefaults, arrayParamNomenclature, config).array;
            }

            /**
             * returns false, true, or the squash value to indicate the "default parameter url squash policy".
             */
            function getSquashPolicy(config, isOptional) {
                var squash = config.squash;
                if (!isOptional || squash === false) return false;
                if (!isDefined(squash) || squash == null) return defaultSquashPolicy;
                if (squash === true || isString(squash)) return squash;
                throw new Error("Invalid squash policy: '" + squash + "'. Valid policies: false, true, or arbitrary string");
            }

            function getReplace(config, arrayMode, isOptional, squash) {
                var replace, configuredKeys, defaultPolicy = [
                    {from: "", to: (isOptional || arrayMode ? undefined : "")},
                    {from: null, to: (isOptional || arrayMode ? undefined : "")}
                ];
                replace = isArray(config.replace) ? config.replace : [];
                if (isString(squash))
                    replace.push({from: squash, to: undefined});
                configuredKeys = map(replace, function (item) {
                    return item.from;
                });
                return filter(defaultPolicy, function (item) {
                    return indexOf(configuredKeys, item.from) === -1;
                }).concat(replace);
            }

            /**
             * [Internal] Get the default value of a parameter, which may be an injectable function.
             */
            function $$getDefaultValue() {
                if (!injector) throw new Error("Injectable functions cannot be called at configuration time");
                return injector.invoke(config.$$fn);
            }

            /**
             * [Internal] Gets the decoded representation of a value if the value is defined, otherwise, returns the
             * default value, which may be the result of an injectable function.
             */
            function $value(value) {
                function hasReplaceVal(val) {
                    return function (obj) {
                        return obj.from === val;
                    };
                }

                function $replace(value) {
                    var replacement = map(filter(self.replace, hasReplaceVal(value)), function (obj) {
                        return obj.to;
                    });
                    return replacement.length ? replacement[0] : value;
                }

                value = $replace(value);
                return isDefined(value) ? self.type.decode(value) : $$getDefaultValue();
            }

            function toString() {
                return "{Param:" + id + " " + type + " squash: '" + squash + "' optional: " + isOptional + "}";
            }

            extend(this, {
                id: id,
                type: type,
                location: location,
                array: arrayMode,
                squash: squash,
                replace: replace,
                isOptional: isOptional,
                value: $value,
                dynamic: undefined,
                config: config,
                toString: toString
            });
        };

        function ParamSet(params) {
            extend(this, params || {});
        }

        ParamSet.prototype = {
            $$new: function () {
                return inherit(this, extend(new ParamSet(), {$$parent: this}));
            },
            $$keys: function () {
                var keys = [], chain = [], parent = this,
                    ignore = objectKeys(ParamSet.prototype);
                while (parent) {
                    chain.push(parent);
                    parent = parent.$$parent;
                }
                chain.reverse();
                forEach(chain, function (paramset) {
                    forEach(objectKeys(paramset), function (key) {
                        if (indexOf(keys, key) === -1 && indexOf(ignore, key) === -1) keys.push(key);
                    });
                });
                return keys;
            },
            $$values: function (paramValues) {
                var values = {}, self = this;
                forEach(self.$$keys(), function (key) {
                    values[key] = self[key].value(paramValues && paramValues[key]);
                });
                return values;
            },
            $$equals: function (paramValues1, paramValues2) {
                var equal = true, self = this;
                forEach(self.$$keys(), function (key) {
                    var left = paramValues1 && paramValues1[key], right = paramValues2 && paramValues2[key];
                    if (!self[key].type.equals(left, right)) equal = false;
                });
                return equal;
            },
            $$validates: function $$validate(paramValues) {
                var result = true, isOptional, val, param, self = this;

                forEach(this.$$keys(), function (key) {
                    param = self[key];
                    val = paramValues[key];
                    isOptional = !val && param.isOptional;
                    result = result && (isOptional || !!param.type.is(val));
                });
                return result;
            },
            $$parent: undefined
        };

        this.ParamSet = ParamSet;
    }

// Register as a provider so it's available to other providers
    angular.module('ui.router.util').provider('$urlMatcherFactory', $UrlMatcherFactory);
    angular.module('ui.router.util').run(['$urlMatcherFactory', function ($urlMatcherFactory) {
    }]);

    /**
     * @ngdoc object
     * @name ui.router.router.$urlRouterProvider
     *
     * @requires ui.router.util.$urlMatcherFactoryProvider
     * @requires $locationProvider
     *
     * @description
     * `$urlRouterProvider` has the responsibility of watching `$location`.
     * When `$location` changes it runs through a list of rules one by one until a
     * match is found. `$urlRouterProvider` is used behind the scenes anytime you specify
     * a url in a state configuration. All urls are compiled into a UrlMatcher object.
     *
     * There are several methods on `$urlRouterProvider` that make it useful to use directly
     * in your module config.
     */
    $UrlRouterProvider.$inject = ['$locationProvider', '$urlMatcherFactoryProvider'];
    function $UrlRouterProvider($locationProvider, $urlMatcherFactory) {
        var rules = [], otherwise = null, interceptDeferred = false, listener;

        // Returns a string that is a prefix of all strings matching the RegExp
        function regExpPrefix(re) {
            var prefix = /^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(re.source);
            return (prefix != null) ? prefix[1].replace(/\\(.)/g, "$1") : '';
        }

        // Interpolates matched values into a String.replace()-style pattern
        function interpolate(pattern, match) {
            return pattern.replace(/\$(\$|\d{1,2})/, function (m, what) {
                return match[what === '$' ? 0 : Number(what)];
            });
        }

        /**
         * @ngdoc function
         * @name ui.router.router.$urlRouterProvider#rule
         * @methodOf ui.router.router.$urlRouterProvider
         *
         * @description
         * Defines rules that are used by `$urlRouterProvider` to find matches for
         * specific URLs.
         *
         * @example
         * <pre>
         * var app = angular.module('app', ['ui.router.router']);
         *
         * app.config(function ($urlRouterProvider) {
   *   // Here's an example of how you might allow case insensitive urls
   *   $urlRouterProvider.rule(function ($injector, $location) {
   *     var path = $location.path(),
   *         normalized = path.toLowerCase();
   *
   *     if (path !== normalized) {
   *       return normalized;
   *     }
   *   });
   * });
         * </pre>
         *
         * @param {object} rule Handler function that takes `$injector` and `$location`
         * services as arguments. You can use them to return a valid path as a string.
         *
         * @return {object} `$urlRouterProvider` - `$urlRouterProvider` instance
         */
        this.rule = function (rule) {
            if (!isFunction(rule)) throw new Error("'rule' must be a function");
            rules.push(rule);
            return this;
        };

        /**
         * @ngdoc object
         * @name ui.router.router.$urlRouterProvider#otherwise
         * @methodOf ui.router.router.$urlRouterProvider
         *
         * @description
         * Defines a path that is used when an invalid route is requested.
         *
         * @example
         * <pre>
         * var app = angular.module('app', ['ui.router.router']);
         *
         * app.config(function ($urlRouterProvider) {
   *   // if the path doesn't match any of the urls you configured
   *   // otherwise will take care of routing the user to the
   *   // specified url
   *   $urlRouterProvider.otherwise('/index');
   *
   *   // Example of using function rule as param
   *   $urlRouterProvider.otherwise(function ($injector, $location) {
   *     return '/a/valid/url';
   *   });
   * });
         * </pre>
         *
         * @param {string|object} rule The url path you want to redirect to or a function
         * rule that returns the url path. The function version is passed two params:
         * `$injector` and `$location` services, and must return a url string.
         *
         * @return {object} `$urlRouterProvider` - `$urlRouterProvider` instance
         */
        this.otherwise = function (rule) {
            if (isString(rule)) {
                var redirect = rule;
                rule = function () {
                    return redirect;
                };
            }
            else if (!isFunction(rule)) throw new Error("'rule' must be a function");
            otherwise = rule;
            return this;
        };


        function handleIfMatch($injector, handler, match) {
            if (!match) return false;
            var result = $injector.invoke(handler, handler, {$match: match});
            return isDefined(result) ? result : true;
        }

        /**
         * @ngdoc function
         * @name ui.router.router.$urlRouterProvider#when
         * @methodOf ui.router.router.$urlRouterProvider
         *
         * @description
         * Registers a handler for a given url matching. if handle is a string, it is
         * treated as a redirect, and is interpolated according to the syntax of match
         * (i.e. like `String.replace()` for `RegExp`, or like a `UrlMatcher` pattern otherwise).
         *
         * If the handler is a function, it is injectable. It gets invoked if `$location`
         * matches. You have the option of inject the match object as `$match`.
         *
         * The handler can return
         *
         * - **falsy** to indicate that the rule didn't match after all, then `$urlRouter`
         *   will continue trying to find another one that matches.
         * - **string** which is treated as a redirect and passed to `$location.url()`
         * - **void** or any **truthy** value tells `$urlRouter` that the url was handled.
         *
         * @example
         * <pre>
         * var app = angular.module('app', ['ui.router.router']);
         *
         * app.config(function ($urlRouterProvider) {
   *   $urlRouterProvider.when($state.url, function ($match, $stateParams) {
   *     if ($state.$current.navigable !== state ||
   *         !equalForKeys($match, $stateParams) {
   *      $state.transitionTo(state, $match, false);
   *     }
   *   });
   * });
         * </pre>
         *
         * @param {string|object} what The incoming path that you want to redirect.
         * @param {string|object} handler The path you want to redirect your user to.
         */
        this.when = function (what, handler) {
            var redirect, handlerIsString = isString(handler);
            if (isString(what)) what = $urlMatcherFactory.compile(what);

            if (!handlerIsString && !isFunction(handler) && !isArray(handler))
                throw new Error("invalid 'handler' in when()");

            var strategies = {
                matcher: function (what, handler) {
                    if (handlerIsString) {
                        redirect = $urlMatcherFactory.compile(handler);
                        handler = ['$match', function ($match) {
                            return redirect.format($match);
                        }];
                    }
                    return extend(function ($injector, $location) {
                        return handleIfMatch($injector, handler, what.exec($location.path(), $location.search()));
                    }, {
                        prefix: isString(what.prefix) ? what.prefix : ''
                    });
                },
                regex: function (what, handler) {
                    if (what.global || what.sticky) throw new Error("when() RegExp must not be global or sticky");

                    if (handlerIsString) {
                        redirect = handler;
                        handler = ['$match', function ($match) {
                            return interpolate(redirect, $match);
                        }];
                    }
                    return extend(function ($injector, $location) {
                        return handleIfMatch($injector, handler, what.exec($location.path()));
                    }, {
                        prefix: regExpPrefix(what)
                    });
                }
            };

            var check = {matcher: $urlMatcherFactory.isMatcher(what), regex: what instanceof RegExp};

            for (var n in check) {
                if (check[n]) return this.rule(strategies[n](what, handler));
            }

            throw new Error("invalid 'what' in when()");
        };

        /**
         * @ngdoc function
         * @name ui.router.router.$urlRouterProvider#deferIntercept
         * @methodOf ui.router.router.$urlRouterProvider
         *
         * @description
         * Disables (or enables) deferring location change interception.
         *
         * If you wish to customize the behavior of syncing the URL (for example, if you wish to
         * defer a transition but maintain the current URL), call this method at configuration time.
         * Then, at run time, call `$urlRouter.listen()` after you have configured your own
         * `$locationChangeSuccess` event handler.
         *
         * @example
         * <pre>
         * var app = angular.module('app', ['ui.router.router']);
         *
         * app.config(function ($urlRouterProvider) {
   *
   *   // Prevent $urlRouter from automatically intercepting URL changes;
   *   // this allows you to configure custom behavior in between
   *   // location changes and route synchronization:
   *   $urlRouterProvider.deferIntercept();
   *
   * }).run(function ($rootScope, $urlRouter, UserService) {
   *
   *   $rootScope.$on('$locationChangeSuccess', function(e) {
   *     // UserService is an example service for managing user state
   *     if (UserService.isLoggedIn()) return;
   *
   *     // Prevent $urlRouter's default handler from firing
   *     e.preventDefault();
   *
   *     UserService.handleLogin().then(function() {
   *       // Once the user has logged in, sync the current URL
   *       // to the router:
   *       $urlRouter.sync();
   *     });
   *   });
   *
   *   // Configures $urlRouter's listener *after* your custom listener
   *   $urlRouter.listen();
   * });
         * </pre>
         *
         * @param {boolean} defer Indicates whether to defer location change interception. Passing
         no parameter is equivalent to `true`.
         */
        this.deferIntercept = function (defer) {
            if (defer === undefined) defer = true;
            interceptDeferred = defer;
        };

        /**
         * @ngdoc object
         * @name ui.router.router.$urlRouter
         *
         * @requires $location
         * @requires $rootScope
         * @requires $injector
         * @requires $browser
         *
         * @description
         *
         */
        this.$get = $get;
        $get.$inject = ['$location', '$rootScope', '$injector', '$browser'];
        function $get($location, $rootScope, $injector, $browser) {

            var baseHref = $browser.baseHref(), location = $location.url(), lastPushedUrl;

            function appendBasePath(url, isHtml5, absolute) {
                if (baseHref === '/') return url;
                if (isHtml5) return baseHref.slice(0, -1) + url;
                if (absolute) return baseHref.slice(1) + url;
                return url;
            }

            // TODO: Optimize groups of rules with non-empty prefix into some sort of decision tree
            function update(evt) {
                if (evt && evt.defaultPrevented) return;
                var ignoreUpdate = lastPushedUrl && $location.url() === lastPushedUrl;
                lastPushedUrl = undefined;
                if (ignoreUpdate) return true;

                function check(rule) {
                    var handled = rule($injector, $location);

                    if (!handled) return false;
                    if (isString(handled)) $location.replace().url(handled);
                    return true;
                }

                var n = rules.length, i;

                for (i = 0; i < n; i++) {
                    if (check(rules[i])) return;
                }
                // always check otherwise last to allow dynamic updates to the set of rules
                if (otherwise) check(otherwise);
            }

            function listen() {
                listener = listener || $rootScope.$on('$locationChangeSuccess', update);
                return listener;
            }

            if (!interceptDeferred) listen();

            return {
                /**
                 * @ngdoc function
                 * @name ui.router.router.$urlRouter#sync
                 * @methodOf ui.router.router.$urlRouter
                 *
                 * @description
                 * Triggers an update; the same update that happens when the address bar url changes, aka `$locationChangeSuccess`.
                 * This method is useful when you need to use `preventDefault()` on the `$locationChangeSuccess` event,
                 * perform some custom logic (route protection, auth, config, redirection, etc) and then finally proceed
                 * with the transition by calling `$urlRouter.sync()`.
                 *
                 * @example
                 * <pre>
                 * angular.module('app', ['ui.router'])
                 *   .run(function($rootScope, $urlRouter) {
       *     $rootScope.$on('$locationChangeSuccess', function(evt) {
       *       // Halt state change from even starting
       *       evt.preventDefault();
       *       // Perform custom logic
       *       var meetsRequirement = ...
       *       // Continue with the update and state transition if logic allows
       *       if (meetsRequirement) $urlRouter.sync();
       *     });
       * });
                 * </pre>
                 */
                sync: function () {
                    update();
                },

                listen: function () {
                    return listen();
                },

                update: function (read) {
                    if (read) {
                        location = $location.url();
                        return;
                    }
                    if ($location.url() === location) return;

                    $location.url(location);
                    $location.replace();
                },

                push: function (urlMatcher, params, options) {
                    $location.url(urlMatcher.format(params || {}));
                    lastPushedUrl = options && options.$$avoidResync ? $location.url() : undefined;
                    if (options && options.replace) $location.replace();
                },

                /**
                 * @ngdoc function
                 * @name ui.router.router.$urlRouter#href
                 * @methodOf ui.router.router.$urlRouter
                 *
                 * @description
                 * A URL generation method that returns the compiled URL for a given
                 * {@link ui.router.util.type:UrlMatcher `UrlMatcher`}, populated with the provided parameters.
                 *
                 * @example
                 * <pre>
                 * $bob = $urlRouter.href(new UrlMatcher("/about/:person"), {
       *   person: "bob"
       * });
                 * // $bob == "/about/bob";
                 * </pre>
                 *
                 * @param {UrlMatcher} urlMatcher The `UrlMatcher` object which is used as the template of the URL to generate.
                 * @param {object=} params An object of parameter values to fill the matcher's required parameters.
                 * @param {object=} options Options object. The options are:
                 *
                 * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
                 *
                 * @returns {string} Returns the fully compiled URL, or `null` if `params` fail validation against `urlMatcher`
                 */
                href: function (urlMatcher, params, options) {
                    if (!urlMatcher.validates(params)) return null;

                    var isHtml5 = $locationProvider.html5Mode();
                    if (angular.isObject(isHtml5)) {
                        isHtml5 = isHtml5.enabled;
                    }

                    var url = urlMatcher.format(params);
                    options = options || {};

                    if (!isHtml5 && url !== null) {
                        url = "#" + $locationProvider.hashPrefix() + url;
                    }
                    url = appendBasePath(url, isHtml5, options.absolute);

                    if (!options.absolute || !url) {
                        return url;
                    }

                    var slash = (!isHtml5 && url ? '/' : ''), port = $location.port();
                    port = (port === 80 || port === 443 ? '' : ':' + port);

                    return [$location.protocol(), '://', $location.host(), port, slash, url].join('');
                }
            };
        }
    }

    angular.module('ui.router.router').provider('$urlRouter', $UrlRouterProvider);

    /**
     * @ngdoc object
     * @name ui.router.state.$stateProvider
     *
     * @requires ui.router.router.$urlRouterProvider
     * @requires ui.router.util.$urlMatcherFactoryProvider
     *
     * @description
     * The new `$stateProvider` works similar to Angular's v1 router, but it focuses purely
     * on state.
     *
     * A state corresponds to a "place" in the application in terms of the overall UI and
     * navigation. A state describes (via the controller / template / view properties) what
     * the UI looks like and does at that place.
     *
     * States often have things in common, and the primary way of factoring out these
     * commonalities in this model is via the state hierarchy, i.e. parent/child states aka
     * nested states.
     *
     * The `$stateProvider` provides interfaces to declare these states for your app.
     */
    $StateProvider.$inject = ['$urlRouterProvider', '$urlMatcherFactoryProvider'];
    function $StateProvider($urlRouterProvider, $urlMatcherFactory) {

        var root, states = {}, $state, queue = {}, abstractKey = 'abstract';

        // Builds state properties from definition passed to registerState()
        var stateBuilder = {

            // Derive parent state from a hierarchical name only if 'parent' is not explicitly defined.
            // state.children = [];
            // if (parent) parent.children.push(state);
            parent: function (state) {
                if (isDefined(state.parent) && state.parent) return findState(state.parent);
                // regex matches any valid composite state name
                // would match "contact.list" but not "contacts"
                var compositeName = /^(.+)\.[^.]+$/.exec(state.name);
                return compositeName ? findState(compositeName[1]) : root;
            },

            // inherit 'data' from parent and override by own values (if any)
            data: function (state) {
                if (state.parent && state.parent.data) {
                    state.data = state.self.data = extend({}, state.parent.data, state.data);
                }
                return state.data;
            },

            // Build a URLMatcher if necessary, either via a relative or absolute URL
            url: function (state) {
                var url = state.url, config = {params: state.params || {}};

                if (isString(url)) {
                    if (url.charAt(0) == '^') return $urlMatcherFactory.compile(url.substring(1), config);
                    return (state.parent.navigable || root).url.concat(url, config);
                }

                if (!url || $urlMatcherFactory.isMatcher(url)) return url;
                throw new Error("Invalid url '" + url + "' in state '" + state + "'");
            },

            // Keep track of the closest ancestor state that has a URL (i.e. is navigable)
            navigable: function (state) {
                return state.url ? state : (state.parent ? state.parent.navigable : null);
            },

            // Own parameters for this state. state.url.params is already built at this point. Create and add non-url params
            ownParams: function (state) {
                var params = state.url && state.url.params || new $$UMFP.ParamSet();
                forEach(state.params || {}, function (config, id) {
                    if (!params[id]) params[id] = new $$UMFP.Param(id, null, config, "config");
                });
                return params;
            },

            // Derive parameters for this state and ensure they're a super-set of parent's parameters
            params: function (state) {
                return state.parent && state.parent.params ? extend(state.parent.params.$$new(), state.ownParams) : new $$UMFP.ParamSet();
            },

            // If there is no explicit multi-view configuration, make one up so we don't have
            // to handle both cases in the view directive later. Note that having an explicit
            // 'views' property will mean the default unnamed view properties are ignored. This
            // is also a good time to resolve view names to absolute names, so everything is a
            // straight lookup at link time.
            views: function (state) {
                var views = {};

                forEach(isDefined(state.views) ? state.views : {'': state}, function (view, name) {
                    if (name.indexOf('@') < 0) name += '@' + state.parent.name;
                    views[name] = view;
                });
                return views;
            },

            // Keep a full path from the root down to this state as this is needed for state activation.
            path: function (state) {
                return state.parent ? state.parent.path.concat(state) : []; // exclude root from path
            },

            // Speed up $state.contains() as it's used a lot
            includes: function (state) {
                var includes = state.parent ? extend({}, state.parent.includes) : {};
                includes[state.name] = true;
                return includes;
            },

            $delegates: {}
        };

        function isRelative(stateName) {
            return stateName.indexOf(".") === 0 || stateName.indexOf("^") === 0;
        }

        function findState(stateOrName, base) {
            if (!stateOrName) return undefined;

            var isStr = isString(stateOrName),
                name = isStr ? stateOrName : stateOrName.name,
                path = isRelative(name);

            if (path) {
                if (!base) throw new Error("No reference point given for path '" + name + "'");
                base = findState(base);

                var rel = name.split("."), i = 0, pathLength = rel.length, current = base;

                for (; i < pathLength; i++) {
                    if (rel[i] === "" && i === 0) {
                        current = base;
                        continue;
                    }
                    if (rel[i] === "^") {
                        if (!current.parent) throw new Error("Path '" + name + "' not valid for state '" + base.name + "'");
                        current = current.parent;
                        continue;
                    }
                    break;
                }
                rel = rel.slice(i).join(".");
                name = current.name + (current.name && rel ? "." : "") + rel;
            }
            var state = states[name];

            if (state && (isStr || (!isStr && (state === stateOrName || state.self === stateOrName)))) {
                return state;
            }
            return undefined;
        }

        function queueState(parentName, state) {
            if (!queue[parentName]) {
                queue[parentName] = [];
            }
            queue[parentName].push(state);
        }

        function flushQueuedChildren(parentName) {
            var queued = queue[parentName] || [];
            while (queued.length) {
                registerState(queued.shift());
            }
        }

        function registerState(state) {
            // Wrap a new object around the state so we can store our private details easily.
            state = inherit(state, {
                self: state,
                resolve: state.resolve || {},
                toString: function () {
                    return this.name;
                }
            });

            var name = state.name;
            if (!isString(name) || name.indexOf('@') >= 0) throw new Error("State must have a valid name");
            if (states.hasOwnProperty(name)) throw new Error("State '" + name + "'' is already defined");

            // Get parent name
            var parentName = (name.indexOf('.') !== -1) ? name.substring(0, name.lastIndexOf('.'))
                : (isString(state.parent)) ? state.parent
                : (isObject(state.parent) && isString(state.parent.name)) ? state.parent.name
                : '';

            // If parent is not registered yet, add state to queue and register later
            if (parentName && !states[parentName]) {
                return queueState(parentName, state.self);
            }

            for (var key in stateBuilder) {
                if (isFunction(stateBuilder[key])) state[key] = stateBuilder[key](state, stateBuilder.$delegates[key]);
            }
            states[name] = state;

            // Register the state in the global state list and with $urlRouter if necessary.
            if (!state[abstractKey] && state.url) {
                $urlRouterProvider.when(state.url, ['$match', '$stateParams', function ($match, $stateParams) {
                    if ($state.$current.navigable != state || !equalForKeys($match, $stateParams)) {
                        $state.transitionTo(state, $match, {inherit: true, location: false});
                    }
                }]);
            }

            // Register any queued children
            flushQueuedChildren(name);

            return state;
        }

        // Checks text to see if it looks like a glob.
        function isGlob(text) {
            return text.indexOf('*') > -1;
        }

        // Returns true if glob matches current $state name.
        function doesStateMatchGlob(glob) {
            var globSegments = glob.split('.'),
                segments = $state.$current.name.split('.');

            //match greedy starts
            if (globSegments[0] === '**') {
                segments = segments.slice(indexOf(segments, globSegments[1]));
                segments.unshift('**');
            }
            //match greedy ends
            if (globSegments[globSegments.length - 1] === '**') {
                segments.splice(indexOf(segments, globSegments[globSegments.length - 2]) + 1, Number.MAX_VALUE);
                segments.push('**');
            }

            if (globSegments.length != segments.length) {
                return false;
            }

            //match single stars
            for (var i = 0, l = globSegments.length; i < l; i++) {
                if (globSegments[i] === '*') {
                    segments[i] = '*';
                }
            }

            return segments.join('') === globSegments.join('');
        }


        // Implicit root state that is always active
        root = registerState({
            name: '',
            url: '^',
            views: null,
            'abstract': true
        });
        root.navigable = null;


        /**
         * @ngdoc function
         * @name ui.router.state.$stateProvider#decorator
         * @methodOf ui.router.state.$stateProvider
         *
         * @description
         * Allows you to extend (carefully) or override (at your own peril) the
         * `stateBuilder` object used internally by `$stateProvider`. This can be used
         * to add custom functionality to ui-router, for example inferring templateUrl
         * based on the state name.
         *
         * When passing only a name, it returns the current (original or decorated) builder
         * function that matches `name`.
         *
         * The builder functions that can be decorated are listed below. Though not all
         * necessarily have a good use case for decoration, that is up to you to decide.
         *
         * In addition, users can attach custom decorators, which will generate new
         * properties within the state's internal definition. There is currently no clear
         * use-case for this beyond accessing internal states (i.e. $state.$current),
         * however, expect this to become increasingly relevant as we introduce additional
         * meta-programming features.
         *
         * **Warning**: Decorators should not be interdependent because the order of
         * execution of the builder functions in non-deterministic. Builder functions
         * should only be dependent on the state definition object and super function.
         *
         *
         * Existing builder functions and current return values:
         *
         * - **parent** `{object}` - returns the parent state object.
         * - **data** `{object}` - returns state data, including any inherited data that is not
         *   overridden by own values (if any).
         * - **url** `{object}` - returns a {@link ui.router.util.type:UrlMatcher UrlMatcher}
         *   or `null`.
         * - **navigable** `{object}` - returns closest ancestor state that has a URL (aka is
         *   navigable).
         * - **params** `{object}` - returns an array of state params that are ensured to
         *   be a super-set of parent's params.
         * - **views** `{object}` - returns a views object where each key is an absolute view
         *   name (i.e. "viewName@stateName") and each value is the config object
         *   (template, controller) for the view. Even when you don't use the views object
         *   explicitly on a state config, one is still created for you internally.
         *   So by decorating this builder function you have access to decorating template
         *   and controller properties.
         * - **ownParams** `{object}` - returns an array of params that belong to the state,
         *   not including any params defined by ancestor states.
         * - **path** `{string}` - returns the full path from the root down to this state.
         *   Needed for state activation.
         * - **includes** `{object}` - returns an object that includes every state that
         *   would pass a `$state.includes()` test.
         *
         * @example
         * <pre>
         * // Override the internal 'views' builder with a function that takes the state
         * // definition, and a reference to the internal function being overridden:
         * $stateProvider.decorator('views', function (state, parent) {
   *   var result = {},
   *       views = parent(state);
   *
   *   angular.forEach(views, function (config, name) {
   *     var autoName = (state.name + '.' + name).replace('.', '/');
   *     config.templateUrl = config.templateUrl || '/partials/' + autoName + '.html';
   *     result[name] = config;
   *   });
   *   return result;
   * });
         *
         * $stateProvider.state('home', {
   *   views: {
   *     'contact.list': { controller: 'ListController' },
   *     'contact.item': { controller: 'ItemController' }
   *   }
   * });
         *
         * // ...
         *
         * $state.go('home');
         * // Auto-populates list and item views with /partials/home/contact/list.html,
         * // and /partials/home/contact/item.html, respectively.
         * </pre>
         *
         * @param {string} name The name of the builder function to decorate.
         * @param {object} func A function that is responsible for decorating the original
         * builder function. The function receives two parameters:
         *
         *   - `{object}` - state - The state config object.
         *   - `{object}` - super - The original builder function.
         *
         * @return {object} $stateProvider - $stateProvider instance
         */
        this.decorator = decorator;
        function decorator(name, func) {
            /*jshint validthis: true */
            if (isString(name) && !isDefined(func)) {
                return stateBuilder[name];
            }
            if (!isFunction(func) || !isString(name)) {
                return this;
            }
            if (stateBuilder[name] && !stateBuilder.$delegates[name]) {
                stateBuilder.$delegates[name] = stateBuilder[name];
            }
            stateBuilder[name] = func;
            return this;
        }

        /**
         * @ngdoc function
         * @name ui.router.state.$stateProvider#state
         * @methodOf ui.router.state.$stateProvider
         *
         * @description
         * Registers a state configuration under a given state name. The stateConfig object
         * has the following acceptable properties.
         *
         * @param {string} name A unique state name, e.g. "home", "about", "contacts".
         * To create a parent/child state use a dot, e.g. "about.sales", "home.newest".
         * @param {object} stateConfig State configuration object.
         * @param {string|function=} stateConfig.template
         * <a id='template'></a>
         *   html template as a string or a function that returns
         *   an html template as a string which should be used by the uiView directives. This property
         *   takes precedence over templateUrl.
         *
         *   If `template` is a function, it will be called with the following parameters:
         *
         *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by
         *     applying the current state
         *
         * <pre>template:
         *   "<h1>inline template definition</h1>" +
         *   "<div ui-view></div>"</pre>
         * <pre>template: function(params) {
   *       return "<h1>generated template</h1>"; }</pre>
         * </div>
         *
         * @param {string|function=} stateConfig.templateUrl
         * <a id='templateUrl'></a>
         *
         *   path or function that returns a path to an html
         *   template that should be used by uiView.
         *
         *   If `templateUrl` is a function, it will be called with the following parameters:
         *
         *   - {array.&lt;object&gt;} - state parameters extracted from the current $location.path() by
         *     applying the current state
         *
         * <pre>templateUrl: "home.html"</pre>
         * <pre>templateUrl: function(params) {
   *     return myTemplates[params.pageId]; }</pre>
         *
         * @param {function=} stateConfig.templateProvider
         * <a id='templateProvider'></a>
         *    Provider function that returns HTML content string.
         * <pre> templateProvider:
         *       function(MyTemplateService, params) {
   *         return MyTemplateService.getTemplate(params.pageId);
   *       }</pre>
         *
         * @param {string|function=} stateConfig.controller
         * <a id='controller'></a>
         *
         *  Controller fn that should be associated with newly
         *   related scope or the name of a registered controller if passed as a string.
         *   Optionally, the ControllerAs may be declared here.
         * <pre>controller: "MyRegisteredController"</pre>
         * <pre>controller:
         *     "MyRegisteredController as fooCtrl"}</pre>
         * <pre>controller: function($scope, MyService) {
   *     $scope.data = MyService.getData(); }</pre>
         *
         * @param {function=} stateConfig.controllerProvider
         * <a id='controllerProvider'></a>
         *
         * Injectable provider function that returns the actual controller or string.
         * <pre>controllerProvider:
         *   function(MyResolveData) {
   *     if (MyResolveData.foo)
   *       return "FooCtrl"
   *     else if (MyResolveData.bar)
   *       return "BarCtrl";
   *     else return function($scope) {
   *       $scope.baz = "Qux";
   *     }
   *   }</pre>
         *
         * @param {string=} stateConfig.controllerAs
         * <a id='controllerAs'></a>
         *
         * A controller alias name. If present the controller will be
         *   published to scope under the controllerAs name.
         * <pre>controllerAs: "myCtrl"</pre>
         *
         * @param {object=} stateConfig.resolve
         * <a id='resolve'></a>
         *
         * An optional map&lt;string, function&gt; of dependencies which
         *   should be injected into the controller. If any of these dependencies are promises,
         *   the router will wait for them all to be resolved before the controller is instantiated.
         *   If all the promises are resolved successfully, the $stateChangeSuccess event is fired
         *   and the values of the resolved promises are injected into any controllers that reference them.
         *   If any  of the promises are rejected the $stateChangeError event is fired.
         *
         *   The map object is:
         *
         *   - key - {string}: name of dependency to be injected into controller
         *   - factory - {string|function}: If string then it is alias for service. Otherwise if function,
         *     it is injected and return value it treated as dependency. If result is a promise, it is
         *     resolved before its value is injected into controller.
         *
         * <pre>resolve: {
   *     myResolve1:
   *       function($http, $stateParams) {
   *         return $http.get("/api/foos/"+stateParams.fooID);
   *       }
   *     }</pre>
         *
         * @param {string=} stateConfig.url
         * <a id='url'></a>
         *
         *   A url fragment with optional parameters. When a state is navigated or
         *   transitioned to, the `$stateParams` service will be populated with any
         *   parameters that were passed.
         *
         * examples:
         * <pre>url: "/home"
         * url: "/users/:userid"
         * url: "/books/{bookid:[a-zA-Z_-]}"
         * url: "/books/{categoryid:int}"
         * url: "/books/{publishername:string}/{categoryid:int}"
         * url: "/messages?before&after"
         * url: "/messages?{before:date}&{after:date}"</pre>
         * url: "/messages/:mailboxid?{before:date}&{after:date}"
         *
         * @param {object=} stateConfig.views
         * <a id='views'></a>
         * an optional map&lt;string, object&gt; which defined multiple views, or targets views
         * manually/explicitly.
         *
         * Examples:
         *
         * Targets three named `ui-view`s in the parent state's template
         * <pre>views: {
   *     header: {
   *       controller: "headerCtrl",
   *       templateUrl: "header.html"
   *     }, body: {
   *       controller: "bodyCtrl",
   *       templateUrl: "body.html"
   *     }, footer: {
   *       controller: "footCtrl",
   *       templateUrl: "footer.html"
   *     }
   *   }</pre>
         *
         * Targets named `ui-view="header"` from grandparent state 'top''s template, and named `ui-view="body" from parent state's template.
         * <pre>views: {
   *     'header@top': {
   *       controller: "msgHeaderCtrl",
   *       templateUrl: "msgHeader.html"
   *     }, 'body': {
   *       controller: "messagesCtrl",
   *       templateUrl: "messages.html"
   *     }
   *   }</pre>
         *
         * @param {boolean=} [stateConfig.abstract=false]
         * <a id='abstract'></a>
         * An abstract state will never be directly activated,
         *   but can provide inherited properties to its common children states.
         * <pre>abstract: true</pre>
         *
         * @param {function=} stateConfig.onEnter
         * <a id='onEnter'></a>
         *
         * Callback function for when a state is entered. Good way
         *   to trigger an action or dispatch an event, such as opening a dialog.
         * If minifying your scripts, make sure to explictly annotate this function,
         * because it won't be automatically annotated by your build tools.
         *
         * <pre>onEnter: function(MyService, $stateParams) {
   *     MyService.foo($stateParams.myParam);
   * }</pre>
         *
         * @param {function=} stateConfig.onExit
         * <a id='onExit'></a>
         *
         * Callback function for when a state is exited. Good way to
         *   trigger an action or dispatch an event, such as opening a dialog.
         * If minifying your scripts, make sure to explictly annotate this function,
         * because it won't be automatically annotated by your build tools.
         *
         * <pre>onExit: function(MyService, $stateParams) {
   *     MyService.cleanup($stateParams.myParam);
   * }</pre>
         *
         * @param {boolean=} [stateConfig.reloadOnSearch=true]
         * <a id='reloadOnSearch'></a>
         *
         * If `false`, will not retrigger the same state
         *   just because a search/query parameter has changed (via $location.search() or $location.hash()).
         *   Useful for when you'd like to modify $location.search() without triggering a reload.
         * <pre>reloadOnSearch: false</pre>
         *
         * @param {object=} stateConfig.data
         * <a id='data'></a>
         *
         * Arbitrary data object, useful for custom configuration.  The parent state's `data` is
         *   prototypally inherited.  In other words, adding a data property to a state adds it to
         *   the entire subtree via prototypal inheritance.
         *
         * <pre>data: {
   *     requiredRole: 'foo'
   * } </pre>
         *
         * @param {object=} stateConfig.params
         * <a id='params'></a>
         *
         * A map which optionally configures parameters declared in the `url`, or
         *   defines additional non-url parameters.  For each parameter being
         *   configured, add a configuration object keyed to the name of the parameter.
         *
         *   Each parameter configuration object may contain the following properties:
         *
         *   - ** value ** - {object|function=}: specifies the default value for this
         *     parameter.  This implicitly sets this parameter as optional.
         *
         *     When UI-Router routes to a state and no value is
         *     specified for this parameter in the URL or transition, the
         *     default value will be used instead.  If `value` is a function,
         *     it will be injected and invoked, and the return value used.
         *
         *     *Note*: `undefined` is treated as "no default value" while `null`
         *     is treated as "the default value is `null`".
         *
         *     *Shorthand*: If you only need to configure the default value of the
         *     parameter, you may use a shorthand syntax.   In the **`params`**
         *     map, instead mapping the param name to a full parameter configuration
         *     object, simply set map it to the default parameter value, e.g.:
         *
         * <pre>// define a parameter's default value
         * params: {
   *     param1: { value: "defaultValue" }
   * }
         * // shorthand default values
         * params: {
   *     param1: "defaultValue",
   *     param2: "param2Default"
   * }</pre>
         *
         *   - ** array ** - {boolean=}: *(default: false)* If true, the param value will be
         *     treated as an array of values.  If you specified a Type, the value will be
         *     treated as an array of the specified Type.  Note: query parameter values
         *     default to a special `"auto"` mode.
         *
         *     For query parameters in `"auto"` mode, if multiple  values for a single parameter
         *     are present in the URL (e.g.: `/foo?bar=1&bar=2&bar=3`) then the values
         *     are mapped to an array (e.g.: `{ foo: [ '1', '2', '3' ] }`).  However, if
         *     only one value is present (e.g.: `/foo?bar=1`) then the value is treated as single
         *     value (e.g.: `{ foo: '1' }`).
         *
         * <pre>params: {
   *     param1: { array: true }
   * }</pre>
         *
         *   - ** squash ** - {bool|string=}: `squash` configures how a default parameter value is represented in the URL when
         *     the current parameter value is the same as the default value. If `squash` is not set, it uses the
         *     configured default squash policy.
         *     (See {@link ui.router.util.$urlMatcherFactory#methods_defaultSquashPolicy `defaultSquashPolicy()`})
         *
         *   There are three squash settings:
         *
         *     - false: The parameter's default value is not squashed.  It is encoded and included in the URL
         *     - true: The parameter's default value is omitted from the URL.  If the parameter is preceeded and followed
         *       by slashes in the state's `url` declaration, then one of those slashes are omitted.
         *       This can allow for cleaner looking URLs.
         *     - `"<arbitrary string>"`: The parameter's default value is replaced with an arbitrary placeholder of  your choice.
         *
         * <pre>params: {
   *     param1: {
   *       value: "defaultId",
   *       squash: true
   * } }
         * // squash "defaultValue" to "~"
         * params: {
   *     param1: {
   *       value: "defaultValue",
   *       squash: "~"
   * } }
         * </pre>
         *
         *
         * @example
         * <pre>
         * // Some state name examples
         *
         * // stateName can be a single top-level name (must be unique).
         * $stateProvider.state("home", {});
         *
         * // Or it can be a nested state name. This state is a child of the
         * // above "home" state.
         * $stateProvider.state("home.newest", {});
         *
         * // Nest states as deeply as needed.
         * $stateProvider.state("home.newest.abc.xyz.inception", {});
         *
         * // state() returns $stateProvider, so you can chain state declarations.
         * $stateProvider
         *   .state("home", {})
         *   .state("about", {})
         *   .state("contacts", {});
         * </pre>
         *
         */
        this.state = state;
        function state(name, definition) {
            /*jshint validthis: true */
            if (isObject(name)) definition = name;
            else definition.name = name;
            registerState(definition);
            return this;
        }

        /**
         * @ngdoc object
         * @name ui.router.state.$state
         *
         * @requires $rootScope
         * @requires $q
         * @requires ui.router.state.$view
         * @requires $injector
         * @requires ui.router.util.$resolve
         * @requires ui.router.state.$stateParams
         * @requires ui.router.router.$urlRouter
         *
         * @property {object} params A param object, e.g. {sectionId: section.id)}, that
         * you'd like to test against the current active state.
         * @property {object} current A reference to the state's config object. However
         * you passed it in. Useful for accessing custom data.
         * @property {object} transition Currently pending transition. A promise that'll
         * resolve or reject.
         *
         * @description
         * `$state` service is responsible for representing states as well as transitioning
         * between them. It also provides interfaces to ask for current state or even states
         * you're coming from.
         */
        this.$get = $get;
        $get.$inject = ['$rootScope', '$q', '$view', '$injector', '$resolve', '$stateParams', '$urlRouter', '$location', '$urlMatcherFactory'];
        function $get($rootScope, $q, $view, $injector, $resolve, $stateParams, $urlRouter, $location, $urlMatcherFactory) {

            var TransitionSuperseded = $q.reject(new Error('transition superseded'));
            var TransitionPrevented = $q.reject(new Error('transition prevented'));
            var TransitionAborted = $q.reject(new Error('transition aborted'));
            var TransitionFailed = $q.reject(new Error('transition failed'));

            // Handles the case where a state which is the target of a transition is not found, and the user
            // can optionally retry or defer the transition
            function handleRedirect(redirect, state, params, options) {
                /**
                 * @ngdoc event
                 * @name ui.router.state.$state#$stateNotFound
                 * @eventOf ui.router.state.$state
                 * @eventType broadcast on root scope
                 * @description
                 * Fired when a requested state **cannot be found** using the provided state name during transition.
                 * The event is broadcast allowing any handlers a single chance to deal with the error (usually by
                 * lazy-loading the unfound state). A special `unfoundState` object is passed to the listener handler,
                 * you can see its three properties in the example. You can use `event.preventDefault()` to abort the
                 * transition and the promise returned from `go` will be rejected with a `'transition aborted'` value.
                 *
                 * @param {Object} event Event object.
                 * @param {Object} unfoundState Unfound State information. Contains: `to, toParams, options` properties.
                 * @param {State} fromState Current state object.
                 * @param {Object} fromParams Current state params.
                 *
                 * @example
                 *
                 * <pre>
                 * // somewhere, assume lazy.state has not been defined
                 * $state.go("lazy.state", {a:1, b:2}, {inherit:false});
                 *
                 * // somewhere else
                 * $scope.$on('$stateNotFound',
                 * function(event, unfoundState, fromState, fromParams){
       *     console.log(unfoundState.to); // "lazy.state"
       *     console.log(unfoundState.toParams); // {a:1, b:2}
       *     console.log(unfoundState.options); // {inherit:false} + default options
       * })
                 * </pre>
                 */
                var evt = $rootScope.$broadcast('$stateNotFound', redirect, state, params);

                if (evt.defaultPrevented) {
                    $urlRouter.update();
                    return TransitionAborted;
                }

                if (!evt.retry) {
                    return null;
                }

                // Allow the handler to return a promise to defer state lookup retry
                if (options.$retry) {
                    $urlRouter.update();
                    return TransitionFailed;
                }
                var retryTransition = $state.transition = $q.when(evt.retry);

                retryTransition.then(function () {
                    if (retryTransition !== $state.transition) return TransitionSuperseded;
                    redirect.options.$retry = true;
                    return $state.transitionTo(redirect.to, redirect.toParams, redirect.options);
                }, function () {
                    return TransitionAborted;
                });
                $urlRouter.update();

                return retryTransition;
            }

            root.locals = {resolve: null, globals: {$stateParams: {}}};

            $state = {
                params: {},
                current: root.self,
                $current: root,
                transition: null
            };

            /**
             * @ngdoc function
             * @name ui.router.state.$state#reload
             * @methodOf ui.router.state.$state
             *
             * @description
             * A method that force reloads the current state. All resolves are re-resolved, events are not re-fired,
             * and controllers reinstantiated (bug with controllers reinstantiating right now, fixing soon).
             *
             * @example
             * <pre>
             * var app angular.module('app', ['ui.router']);
             *
             * app.controller('ctrl', function ($scope, $state) {
     *   $scope.reload = function(){
     *     $state.reload();
     *   }
     * });
             * </pre>
             *
             * `reload()` is just an alias for:
             * <pre>
             * $state.transitionTo($state.current, $stateParams, { 
     *   reload: true, inherit: false, notify: true
     * });
             * </pre>
             *
             * @returns {promise} A promise representing the state of the new transition. See
             * {@link ui.router.state.$state#methods_go $state.go}.
             */
            $state.reload = function reload() {
                return $state.transitionTo($state.current, $stateParams, {reload: true, inherit: false, notify: true});
            };

            /**
             * @ngdoc function
             * @name ui.router.state.$state#go
             * @methodOf ui.router.state.$state
             *
             * @description
             * Convenience method for transitioning to a new state. `$state.go` calls
             * `$state.transitionTo` internally but automatically sets options to
             * `{ location: true, inherit: true, relative: $state.$current, notify: true }`.
             * This allows you to easily use an absolute or relative to path and specify
             * only the parameters you'd like to update (while letting unspecified parameters
             * inherit from the currently active ancestor states).
             *
             * @example
             * <pre>
             * var app = angular.module('app', ['ui.router']);
             *
             * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.go('contact.detail');
     *   };
     * });
             * </pre>
             * <img src='../ngdoc_assets/StateGoExamples.png'/>
             *
             * @param {string} to Absolute state name or relative state path. Some examples:
             *
             * - `$state.go('contact.detail')` - will go to the `contact.detail` state
             * - `$state.go('^')` - will go to a parent state
             * - `$state.go('^.sibling')` - will go to a sibling state
             * - `$state.go('.child.grandchild')` - will go to grandchild state
             *
             * @param {object=} params A map of the parameters that will be sent to the state,
             * will populate $stateParams. Any parameters that are not specified will be inherited from currently
             * defined parameters. This allows, for example, going to a sibling state that shares parameters
             * specified in a parent state. Parameter inheritance only works between common ancestor states, I.e.
             * transitioning to a sibling will get you the parameters for all parents, transitioning to a child
             * will get you all current parameters, etc.
             * @param {object=} options Options object. The options are:
             *
             * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
             *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
             * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
             * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'),
             *    defines which state to be relative from.
             * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
             * - **`reload`** (v0.2.5) - {boolean=false}, If `true` will force transition even if the state or params
             *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
             *    use this when you want to force a reload when *everything* is the same, including search params.
             *
             * @returns {promise} A promise representing the state of the new transition.
             *
             * Possible success values:
             *
             * - $state.current
             *
             * <br/>Possible rejection values:
             *
             * - 'transition superseded' - when a newer transition has been started after this one
             * - 'transition prevented' - when `event.preventDefault()` has been called in a `$stateChangeStart` listener
             * - 'transition aborted' - when `event.preventDefault()` has been called in a `$stateNotFound` listener or
             *   when a `$stateNotFound` `event.retry` promise errors.
             * - 'transition failed' - when a state has been unsuccessfully found after 2 tries.
             * - *resolve error* - when an error has occurred with a `resolve`
             *
             */
            $state.go = function go(to, params, options) {
                return $state.transitionTo(to, params, extend({inherit: true, relative: $state.$current}, options));
            };

            /**
             * @ngdoc function
             * @name ui.router.state.$state#transitionTo
             * @methodOf ui.router.state.$state
             *
             * @description
             * Low-level method for transitioning to a new state. {@link ui.router.state.$state#methods_go $state.go}
             * uses `transitionTo` internally. `$state.go` is recommended in most situations.
             *
             * @example
             * <pre>
             * var app = angular.module('app', ['ui.router']);
             *
             * app.controller('ctrl', function ($scope, $state) {
     *   $scope.changeState = function () {
     *     $state.transitionTo('contact.detail');
     *   };
     * });
             * </pre>
             *
             * @param {string} to State name.
             * @param {object=} toParams A map of the parameters that will be sent to the state,
             * will populate $stateParams.
             * @param {object=} options Options object. The options are:
             *
             * - **`location`** - {boolean=true|string=} - If `true` will update the url in the location bar, if `false`
             *    will not. If string, must be `"replace"`, which will update url and also replace last history record.
             * - **`inherit`** - {boolean=false}, If `true` will inherit url parameters from current url.
             * - **`relative`** - {object=}, When transitioning with relative path (e.g '^'),
             *    defines which state to be relative from.
             * - **`notify`** - {boolean=true}, If `true` will broadcast $stateChangeStart and $stateChangeSuccess events.
             * - **`reload`** (v0.2.5) - {boolean=false}, If `true` will force transition even if the state or params
             *    have not changed, aka a reload of the same state. It differs from reloadOnSearch because you'd
             *    use this when you want to force a reload when *everything* is the same, including search params.
             *
             * @returns {promise} A promise representing the state of the new transition. See
             * {@link ui.router.state.$state#methods_go $state.go}.
             */
            $state.transitionTo = function transitionTo(to, toParams, options) {
                toParams = toParams || {};
                options = extend({
                    location: true, inherit: false, relative: null, notify: true, reload: false, $retry: false
                }, options || {});

                var from = $state.$current, fromParams = $state.params, fromPath = from.path;
                var evt, toState = findState(to, options.relative);

                if (!isDefined(toState)) {
                    var redirect = {to: to, toParams: toParams, options: options};
                    var redirectResult = handleRedirect(redirect, from.self, fromParams, options);

                    if (redirectResult) {
                        return redirectResult;
                    }

                    // Always retry once if the $stateNotFound was not prevented
                    // (handles either redirect changed or state lazy-definition)
                    to = redirect.to;
                    toParams = redirect.toParams;
                    options = redirect.options;
                    toState = findState(to, options.relative);

                    if (!isDefined(toState)) {
                        if (!options.relative) throw new Error("No such state '" + to + "'");
                        throw new Error("Could not resolve '" + to + "' from state '" + options.relative + "'");
                    }
                }
                if (toState[abstractKey]) throw new Error("Cannot transition to abstract state '" + to + "'");
                if (options.inherit) toParams = inheritParams($stateParams, toParams || {}, $state.$current, toState);
                if (!toState.params.$$validates(toParams)) return TransitionFailed;

                toParams = toState.params.$$values(toParams);
                to = toState;

                var toPath = to.path;

                // Starting from the root of the path, keep all levels that haven't changed
                var keep = 0, state = toPath[keep], locals = root.locals, toLocals = [];

                if (!options.reload) {
                    while (state && state === fromPath[keep] && state.ownParams.$$equals(toParams, fromParams)) {
                        locals = toLocals[keep] = state.locals;
                        keep++;
                        state = toPath[keep];
                    }
                }

                // If we're going to the same state and all locals are kept, we've got nothing to do.
                // But clear 'transition', as we still want to cancel any other pending transitions.
                // TODO: We may not want to bump 'transition' if we're called from a location change
                // that we've initiated ourselves, because we might accidentally abort a legitimate
                // transition initiated from code?
                if (shouldTriggerReload(to, from, locals, options)) {
                    if (to.self.reloadOnSearch !== false) $urlRouter.update();
                    $state.transition = null;
                    return $q.when($state.current);
                }

                // Filter parameters before we pass them to event handlers etc.
                toParams = filterByKeys(to.params.$$keys(), toParams || {});

                // Broadcast start event and cancel the transition if requested
                if (options.notify) {
                    /**
                     * @ngdoc event
                     * @name ui.router.state.$state#$stateChangeStart
                     * @eventOf ui.router.state.$state
                     * @eventType broadcast on root scope
                     * @description
                     * Fired when the state transition **begins**. You can use `event.preventDefault()`
                     * to prevent the transition from happening and then the transition promise will be
                     * rejected with a `'transition prevented'` value.
                     *
                     * @param {Object} event Event object.
                     * @param {State} toState The state being transitioned to.
                     * @param {Object} toParams The params supplied to the `toState`.
                     * @param {State} fromState The current state, pre-transition.
                     * @param {Object} fromParams The params supplied to the `fromState`.
                     *
                     * @example
                     *
                     * <pre>
                     * $rootScope.$on('$stateChangeStart',
                     * function(event, toState, toParams, fromState, fromParams){
         *     event.preventDefault();
         *     // transitionTo() promise will be rejected with
         *     // a 'transition prevented' error
         * })
                     * </pre>
                     */
                    if ($rootScope.$broadcast('$stateChangeStart', to.self, toParams, from.self, fromParams).defaultPrevented) {
                        $urlRouter.update();
                        return TransitionPrevented;
                    }
                }

                // Resolve locals for the remaining states, but don't update any global state just
                // yet -- if anything fails to resolve the current state needs to remain untouched.
                // We also set up an inheritance chain for the locals here. This allows the view directive
                // to quickly look up the correct definition for each view in the current state. Even
                // though we create the locals object itself outside resolveState(), it is initially
                // empty and gets filled asynchronously. We need to keep track of the promise for the
                // (fully resolved) current locals, and pass this down the chain.
                var resolved = $q.when(locals);

                for (var l = keep; l < toPath.length; l++, state = toPath[l]) {
                    locals = toLocals[l] = inherit(locals);
                    resolved = resolveState(state, toParams, state === to, resolved, locals, options);
                }

                // Once everything is resolved, we are ready to perform the actual transition
                // and return a promise for the new state. We also keep track of what the
                // current promise is, so that we can detect overlapping transitions and
                // keep only the outcome of the last transition.
                var transition = $state.transition = resolved.then(function () {
                    var l, entering, exiting;

                    if ($state.transition !== transition) return TransitionSuperseded;

                    // Exit 'from' states not kept
                    for (l = fromPath.length - 1; l >= keep; l--) {
                        exiting = fromPath[l];
                        if (exiting.self.onExit) {
                            $injector.invoke(exiting.self.onExit, exiting.self, exiting.locals.globals);
                        }
                        exiting.locals = null;
                    }

                    // Enter 'to' states not kept
                    for (l = keep; l < toPath.length; l++) {
                        entering = toPath[l];
                        entering.locals = toLocals[l];
                        if (entering.self.onEnter) {
                            $injector.invoke(entering.self.onEnter, entering.self, entering.locals.globals);
                        }
                    }

                    // Run it again, to catch any transitions in callbacks
                    if ($state.transition !== transition) return TransitionSuperseded;

                    // Update globals in $state
                    $state.$current = to;
                    $state.current = to.self;
                    $state.params = toParams;
                    copy($state.params, $stateParams);
                    $state.transition = null;

                    if (options.location && to.navigable) {
                        $urlRouter.push(to.navigable.url, to.navigable.locals.globals.$stateParams, {
                            $$avoidResync: true, replace: options.location === 'replace'
                        });
                    }

                    if (options.notify) {
                        /**
                         * @ngdoc event
                         * @name ui.router.state.$state#$stateChangeSuccess
                         * @eventOf ui.router.state.$state
                         * @eventType broadcast on root scope
                         * @description
                         * Fired once the state transition is **complete**.
                         *
                         * @param {Object} event Event object.
                         * @param {State} toState The state being transitioned to.
                         * @param {Object} toParams The params supplied to the `toState`.
                         * @param {State} fromState The current state, pre-transition.
                         * @param {Object} fromParams The params supplied to the `fromState`.
                         */
                        $rootScope.$broadcast('$stateChangeSuccess', to.self, toParams, from.self, fromParams);
                    }
                    $urlRouter.update(true);

                    return $state.current;
                }, function (error) {
                    if ($state.transition !== transition) return TransitionSuperseded;

                    $state.transition = null;
                    /**
                     * @ngdoc event
                     * @name ui.router.state.$state#$stateChangeError
                     * @eventOf ui.router.state.$state
                     * @eventType broadcast on root scope
                     * @description
                     * Fired when an **error occurs** during transition. It's important to note that if you
                     * have any errors in your resolve functions (javascript errors, non-existent services, etc)
                     * they will not throw traditionally. You must listen for this $stateChangeError event to
                     * catch **ALL** errors.
                     *
                     * @param {Object} event Event object.
                     * @param {State} toState The state being transitioned to.
                     * @param {Object} toParams The params supplied to the `toState`.
                     * @param {State} fromState The current state, pre-transition.
                     * @param {Object} fromParams The params supplied to the `fromState`.
                     * @param {Error} error The resolve error object.
                     */
                    evt = $rootScope.$broadcast('$stateChangeError', to.self, toParams, from.self, fromParams, error);

                    if (!evt.defaultPrevented) {
                        $urlRouter.update();
                    }

                    return $q.reject(error);
                });

                return transition;
            };

            /**
             * @ngdoc function
             * @name ui.router.state.$state#is
             * @methodOf ui.router.state.$state
             *
             * @description
             * Similar to {@link ui.router.state.$state#methods_includes $state.includes},
             * but only checks for the full state name. If params is supplied then it will be
             * tested for strict equality against the current active params object, so all params
             * must match with none missing and no extras.
             *
             * @example
             * <pre>
             * $state.$current.name = 'contacts.details.item';
             *
             * // absolute name
             * $state.is('contact.details.item'); // returns true
             * $state.is(contactDetailItemStateObject); // returns true
             *
             * // relative name (. and ^), typically from a template
             * // E.g. from the 'contacts.details' template
             * <div ng-class="{highlighted: $state.is('.item')}">Item</div>
             * </pre>
             *
             * @param {string|object} stateOrName The state name (absolute or relative) or state object you'd like to check.
             * @param {object=} params A param object, e.g. `{sectionId: section.id}`, that you'd like
             * to test against the current active state.
             * @param {object=} options An options object.  The options are:
             *
             * - **`relative`** - {string|object} -  If `stateOrName` is a relative state name and `options.relative` is set, .is will
             * test relative to `options.relative` state (or name).
             *
             * @returns {boolean} Returns true if it is the state.
             */
            $state.is = function is(stateOrName, params, options) {
                options = extend({relative: $state.$current}, options || {});
                var state = findState(stateOrName, options.relative);

                if (!isDefined(state)) {
                    return undefined;
                }
                if ($state.$current !== state) {
                    return false;
                }
                return params ? equalForKeys(state.params.$$values(params), $stateParams) : true;
            };

            /**
             * @ngdoc function
             * @name ui.router.state.$state#includes
             * @methodOf ui.router.state.$state
             *
             * @description
             * A method to determine if the current active state is equal to or is the child of the
             * state stateName. If any params are passed then they will be tested for a match as well.
             * Not all the parameters need to be passed, just the ones you'd like to test for equality.
             *
             * @example
             * Partial and relative names
             * <pre>
             * $state.$current.name = 'contacts.details.item';
             *
             * // Using partial names
             * $state.includes("contacts"); // returns true
             * $state.includes("contacts.details"); // returns true
             * $state.includes("contacts.details.item"); // returns true
             * $state.includes("contacts.list"); // returns false
             * $state.includes("about"); // returns false
             *
             * // Using relative names (. and ^), typically from a template
             * // E.g. from the 'contacts.details' template
             * <div ng-class="{highlighted: $state.includes('.item')}">Item</div>
             * </pre>
             *
             * Basic globbing patterns
             * <pre>
             * $state.$current.name = 'contacts.details.item.url';
             *
             * $state.includes("*.details.*.*"); // returns true
             * $state.includes("*.details.**"); // returns true
             * $state.includes("**.item.**"); // returns true
             * $state.includes("*.details.item.url"); // returns true
             * $state.includes("*.details.*.url"); // returns true
             * $state.includes("*.details.*"); // returns false
             * $state.includes("item.**"); // returns false
             * </pre>
             *
             * @param {string} stateOrName A partial name, relative name, or glob pattern
             * to be searched for within the current state name.
             * @param {object=} params A param object, e.g. `{sectionId: section.id}`,
             * that you'd like to test against the current active state.
             * @param {object=} options An options object.  The options are:
             *
             * - **`relative`** - {string|object=} -  If `stateOrName` is a relative state reference and `options.relative` is set,
             * .includes will test relative to `options.relative` state (or name).
             *
             * @returns {boolean} Returns true if it does include the state
             */
            $state.includes = function includes(stateOrName, params, options) {
                options = extend({relative: $state.$current}, options || {});
                if (isString(stateOrName) && isGlob(stateOrName)) {
                    if (!doesStateMatchGlob(stateOrName)) {
                        return false;
                    }
                    stateOrName = $state.$current.name;
                }

                var state = findState(stateOrName, options.relative);
                if (!isDefined(state)) {
                    return undefined;
                }
                if (!isDefined($state.$current.includes[state.name])) {
                    return false;
                }
                return params ? equalForKeys(state.params.$$values(params), $stateParams, objectKeys(params)) : true;
            };


            /**
             * @ngdoc function
             * @name ui.router.state.$state#href
             * @methodOf ui.router.state.$state
             *
             * @description
             * A url generation method that returns the compiled url for the given state populated with the given params.
             *
             * @example
             * <pre>
             * expect($state.href("about.person", { person: "bob" })).toEqual("/about/bob");
             * </pre>
             *
             * @param {string|object} stateOrName The state name or state object you'd like to generate a url from.
             * @param {object=} params An object of parameter values to fill the state's required parameters.
             * @param {object=} options Options object. The options are:
             *
             * - **`lossy`** - {boolean=true} -  If true, and if there is no url associated with the state provided in the
             *    first parameter, then the constructed href url will be built from the first navigable ancestor (aka
             *    ancestor with a valid url).
             * - **`inherit`** - {boolean=true}, If `true` will inherit url parameters from current url.
             * - **`relative`** - {object=$state.$current}, When transitioning with relative path (e.g '^'),
             *    defines which state to be relative from.
             * - **`absolute`** - {boolean=false},  If true will generate an absolute url, e.g. "http://www.example.com/fullurl".
             *
             * @returns {string} compiled state url
             */
            $state.href = function href(stateOrName, params, options) {
                options = extend({
                    lossy: true,
                    inherit: true,
                    absolute: false,
                    relative: $state.$current
                }, options || {});

                var state = findState(stateOrName, options.relative);

                if (!isDefined(state)) return null;
                if (options.inherit) params = inheritParams($stateParams, params || {}, $state.$current, state);

                var nav = (state && options.lossy) ? state.navigable : state;

                if (!nav || nav.url === undefined || nav.url === null) {
                    return null;
                }
                return $urlRouter.href(nav.url, filterByKeys(state.params.$$keys(), params || {}), {
                    absolute: options.absolute
                });
            };

            /**
             * @ngdoc function
             * @name ui.router.state.$state#get
             * @methodOf ui.router.state.$state
             *
             * @description
             * Returns the state configuration object for any specific state or all states.
             *
             * @param {string|object=} stateOrName (absolute or relative) If provided, will only get the config for
             * the requested state. If not provided, returns an array of ALL state configs.
             * @param {string|object=} context When stateOrName is a relative state reference, the state will be retrieved relative to context.
             * @returns {Object|Array} State configuration object or array of all objects.
             */
            $state.get = function (stateOrName, context) {
                if (arguments.length === 0) return map(objectKeys(states), function (name) {
                    return states[name].self;
                });
                var state = findState(stateOrName, context || $state.$current);
                return (state && state.self) ? state.self : null;
            };

            function resolveState(state, params, paramsAreFiltered, inherited, dst, options) {
                // Make a restricted $stateParams with only the parameters that apply to this state if
                // necessary. In addition to being available to the controller and onEnter/onExit callbacks,
                // we also need $stateParams to be available for any $injector calls we make during the
                // dependency resolution process.
                var $stateParams = (paramsAreFiltered) ? params : filterByKeys(state.params.$$keys(), params);
                var locals = {$stateParams: $stateParams};

                // Resolve 'global' dependencies for the state, i.e. those not specific to a view.
                // We're also including $stateParams in this; that way the parameters are restricted
                // to the set that should be visible to the state, and are independent of when we update
                // the global $state and $stateParams values.
                dst.resolve = $resolve.resolve(state.resolve, locals, dst.resolve, state);
                var promises = [dst.resolve.then(function (globals) {
                    dst.globals = globals;
                })];
                if (inherited) promises.push(inherited);

                // Resolve template and dependencies for all views.
                forEach(state.views, function (view, name) {
                    var injectables = (view.resolve && view.resolve !== state.resolve ? view.resolve : {});
                    injectables.$template = [function () {
                        return $view.load(name, {
                                view: view,
                                locals: locals,
                                params: $stateParams,
                                notify: options.notify
                            }) || '';
                    }];

                    promises.push($resolve.resolve(injectables, locals, dst.resolve, state).then(function (result) {
                        // References to the controller (only instantiated at link time)
                        if (isFunction(view.controllerProvider) || isArray(view.controllerProvider)) {
                            var injectLocals = angular.extend({}, injectables, locals);
                            result.$$controller = $injector.invoke(view.controllerProvider, null, injectLocals);
                        } else {
                            result.$$controller = view.controller;
                        }
                        // Provide access to the state itself for internal use
                        result.$$state = state;
                        result.$$controllerAs = view.controllerAs;
                        dst[name] = result;
                    }));
                });

                // Wait for all the promises and then return the activation object
                return $q.all(promises).then(function (values) {
                    return dst;
                });
            }

            return $state;
        }

        function shouldTriggerReload(to, from, locals, options) {
            if (to === from && ((locals === from.locals && !options.reload) || (to.self.reloadOnSearch === false))) {
                return true;
            }
        }
    }

    angular.module('ui.router.state')
        .value('$stateParams', {})
        .provider('$state', $StateProvider);


    $ViewProvider.$inject = [];
    function $ViewProvider() {

        this.$get = $get;
        /**
         * @ngdoc object
         * @name ui.router.state.$view
         *
         * @requires ui.router.util.$templateFactory
         * @requires $rootScope
         *
         * @description
         *
         */
        $get.$inject = ['$rootScope', '$templateFactory'];
        function $get($rootScope, $templateFactory) {
            return {
                // $view.load('full.viewName', { template: ..., controller: ..., resolve: ..., async: false, params: ... })
                /**
                 * @ngdoc function
                 * @name ui.router.state.$view#load
                 * @methodOf ui.router.state.$view
                 *
                 * @description
                 *
                 * @param {string} name name
                 * @param {object} options option object.
                 */
                load: function load(name, options) {
                    var result, defaults = {
                        template: null,
                        controller: null,
                        view: null,
                        locals: null,
                        notify: true,
                        async: true,
                        params: {}
                    };
                    options = extend(defaults, options);

                    if (options.view) {
                        result = $templateFactory.fromConfig(options.view, options.params, options.locals);
                    }
                    if (result && options.notify) {
                        /**
                         * @ngdoc event
                         * @name ui.router.state.$state#$viewContentLoading
                         * @eventOf ui.router.state.$view
                         * @eventType broadcast on root scope
                         * @description
                         *
                         * Fired once the view **begins loading**, *before* the DOM is rendered.
                         *
                         * @param {Object} event Event object.
                         * @param {Object} viewConfig The view config properties (template, controller, etc).
                         *
                         * @example
                         *
                         * <pre>
                         * $scope.$on('$viewContentLoading',
                         * function(event, viewConfig){
         *     // Access to all the view config properties.
         *     // and one special property 'targetView'
         *     // viewConfig.targetView
         * });
                         * </pre>
                         */
                        $rootScope.$broadcast('$viewContentLoading', options);
                    }
                    return result;
                }
            };
        }
    }

    angular.module('ui.router.state').provider('$view', $ViewProvider);

    /**
     * @ngdoc object
     * @name ui.router.state.$uiViewScrollProvider
     *
     * @description
     * Provider that returns the {@link ui.router.state.$uiViewScroll} service function.
     */
    function $ViewScrollProvider() {

        var useAnchorScroll = false;

        /**
         * @ngdoc function
         * @name ui.router.state.$uiViewScrollProvider#useAnchorScroll
         * @methodOf ui.router.state.$uiViewScrollProvider
         *
         * @description
         * Reverts back to using the core [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll) service for
         * scrolling based on the url anchor.
         */
        this.useAnchorScroll = function () {
            useAnchorScroll = true;
        };

        /**
         * @ngdoc object
         * @name ui.router.state.$uiViewScroll
         *
         * @requires $anchorScroll
         * @requires $timeout
         *
         * @description
         * When called with a jqLite element, it scrolls the element into view (after a
         * `$timeout` so the DOM has time to refresh).
         *
         * If you prefer to rely on `$anchorScroll` to scroll the view to the anchor,
         * this can be enabled by calling {@link ui.router.state.$uiViewScrollProvider#methods_useAnchorScroll `$uiViewScrollProvider.useAnchorScroll()`}.
         */
        this.$get = ['$anchorScroll', '$timeout', function ($anchorScroll, $timeout) {
            if (useAnchorScroll) {
                return $anchorScroll;
            }

            return function ($element) {
                $timeout(function () {
                    $element[0].scrollIntoView();
                }, 0, false);
            };
        }];
    }

    angular.module('ui.router.state').provider('$uiViewScroll', $ViewScrollProvider);

    /**
     * @ngdoc directive
     * @name ui.router.state.directive:ui-view
     *
     * @requires ui.router.state.$state
     * @requires $compile
     * @requires $controller
     * @requires $injector
     * @requires ui.router.state.$uiViewScroll
     * @requires $document
     *
     * @restrict ECA
     *
     * @description
     * The ui-view directive tells $state where to place your templates.
     *
     * @param {string=} name A view name. The name should be unique amongst the other views in the
     * same state. You can have views of the same name that live in different states.
     *
     * @param {string=} autoscroll It allows you to set the scroll behavior of the browser window
     * when a view is populated. By default, $anchorScroll is overridden by ui-router's custom scroll
     * service, {@link ui.router.state.$uiViewScroll}. This custom service let's you
     * scroll ui-view elements into view when they are populated during a state activation.
     *
     * *Note: To revert back to old [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll)
     * functionality, call `$uiViewScrollProvider.useAnchorScroll()`.*
     *
     * @param {string=} onload Expression to evaluate whenever the view updates.
     *
     * @example
     * A view can be unnamed or named.
     * <pre>
     * <!-- Unnamed -->
     * <div ui-view></div>
     *
     * <!-- Named -->
     * <div ui-view="viewName"></div>
     * </pre>
     *
     * You can only have one unnamed view within any template (or root html). If you are only using a
     * single view and it is unnamed then you can populate it like so:
     * <pre>
     * <div ui-view></div>
     * $stateProvider.state("home", {
 *   template: "<h1>HELLO!</h1>"
 * })
     * </pre>
     *
     * The above is a convenient shortcut equivalent to specifying your view explicitly with the {@link ui.router.state.$stateProvider#views `views`}
     * config property, by name, in this case an empty name:
     * <pre>
     * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }    
 * })
     * </pre>
     *
     * But typically you'll only use the views property if you name your view or have more than one view
     * in the same template. There's not really a compelling reason to name a view if its the only one,
     * but you could if you wanted, like so:
     * <pre>
     * <div ui-view="main"></div>
     * </pre>
     * <pre>
     * $stateProvider.state("home", {
 *   views: {
 *     "main": {
 *       template: "<h1>HELLO!</h1>"
 *     }
 *   }    
 * })
     * </pre>
     *
     * Really though, you'll use views to set up multiple views:
     * <pre>
     * <div ui-view></div>
     * <div ui-view="chart"></div>
     * <div ui-view="data"></div>
     * </pre>
     *
     * <pre>
     * $stateProvider.state("home", {
 *   views: {
 *     "": {
 *       template: "<h1>HELLO!</h1>"
 *     },
 *     "chart": {
 *       template: "<chart_thing/>"
 *     },
 *     "data": {
 *       template: "<data_thing/>"
 *     }
 *   }    
 * })
     * </pre>
     *
     * Examples for `autoscroll`:
     *
     * <pre>
     * <!-- If autoscroll present with no expression,
     *      then scroll ui-view into view -->
     * <ui-view autoscroll/>
     *
     * <!-- If autoscroll present with valid expression,
     *      then scroll ui-view into view if expression evaluates to true -->
     * <ui-view autoscroll='true'/>
     * <ui-view autoscroll='false'/>
     * <ui-view autoscroll='scopeVariable'/>
     * </pre>
     */
    $ViewDirective.$inject = ['$state', '$injector', '$uiViewScroll', '$interpolate'];
    function $ViewDirective($state, $injector, $uiViewScroll, $interpolate) {

        function getService() {
            return ($injector.has) ? function (service) {
                return $injector.has(service) ? $injector.get(service) : null;
            } : function (service) {
                try {
                    return $injector.get(service);
                } catch (e) {
                    return null;
                }
            };
        }

        var service = getService(),
            $animator = service('$animator'),
            $animate = service('$animate');

        // Returns a set of DOM manipulation functions based on which Angular version
        // it should use
        function getRenderer(attrs, scope) {
            var statics = function () {
                return {
                    enter: function (element, target, cb) {
                        target.after(element);
                        cb();
                    },
                    leave: function (element, cb) {
                        element.remove();
                        cb();
                    }
                };
            };

            if ($animate) {
                return {
                    enter: function (element, target, cb) {
                        var promise = $animate.enter(element, null, target, cb);
                        if (promise && promise.then) promise.then(cb);
                    },
                    leave: function (element, cb) {
                        var promise = $animate.leave(element, cb);
                        if (promise && promise.then) promise.then(cb);
                    }
                };
            }

            if ($animator) {
                var animate = $animator && $animator(scope, attrs);

                return {
                    enter: function (element, target, cb) {
                        animate.enter(element, null, target);
                        cb();
                    },
                    leave: function (element, cb) {
                        animate.leave(element);
                        cb();
                    }
                };
            }

            return statics();
        }

        var directive = {
            restrict: 'ECA',
            terminal: true,
            priority: 400,
            transclude: 'element',
            compile: function (tElement, tAttrs, $transclude) {
                return function (scope, $element, attrs) {
                    var previousEl, currentEl, currentScope, latestLocals,
                        onloadExp = attrs.onload || '',
                        autoScrollExp = attrs.autoscroll,
                        renderer = getRenderer(attrs, scope);

                    scope.$on('$stateChangeSuccess', function () {
                        updateView(false);
                    });
                    scope.$on('$viewContentLoading', function () {
                        updateView(false);
                    });

                    updateView(true);

                    function cleanupLastView() {
                        if (previousEl) {
                            previousEl.remove();
                            previousEl = null;
                        }

                        if (currentScope) {
                            currentScope.$destroy();
                            currentScope = null;
                        }

                        if (currentEl) {
                            renderer.leave(currentEl, function () {
                                previousEl = null;
                            });

                            previousEl = currentEl;
                            currentEl = null;
                        }
                    }

                    function updateView(firstTime) {
                        var newScope,
                            name = getUiViewName(scope, attrs, $element, $interpolate),
                            previousLocals = name && $state.$current && $state.$current.locals[name];

                        if (!firstTime && previousLocals === latestLocals) return; // nothing to do
                        newScope = scope.$new();
                        latestLocals = $state.$current.locals[name];

                        var clone = $transclude(newScope, function (clone) {
                            renderer.enter(clone, $element, function onUiViewEnter() {
                                if (currentScope) {
                                    currentScope.$emit('$viewContentAnimationEnded');
                                }

                                if (angular.isDefined(autoScrollExp) && !autoScrollExp || scope.$eval(autoScrollExp)) {
                                    $uiViewScroll(clone);
                                }
                            });
                            cleanupLastView();
                        });

                        currentEl = clone;
                        currentScope = newScope;
                        /**
                         * @ngdoc event
                         * @name ui.router.state.directive:ui-view#$viewContentLoaded
                         * @eventOf ui.router.state.directive:ui-view
                         * @eventType emits on ui-view directive scope
                         * @description           *
                         * Fired once the view is **loaded**, *after* the DOM is rendered.
                         *
                         * @param {Object} event Event object.
                         */
                        currentScope.$emit('$viewContentLoaded');
                        currentScope.$eval(onloadExp);
                    }
                };
            }
        };

        return directive;
    }

    $ViewDirectiveFill.$inject = ['$compile', '$controller', '$state', '$interpolate'];
    function $ViewDirectiveFill($compile, $controller, $state, $interpolate) {
        return {
            restrict: 'ECA',
            priority: -400,
            compile: function (tElement) {
                var initial = tElement.html();
                return function (scope, $element, attrs) {
                    var current = $state.$current,
                        name = getUiViewName(scope, attrs, $element, $interpolate),
                        locals = current && current.locals[name];

                    if (!locals) {
                        return;
                    }

                    $element.data('$uiView', {name: name, state: locals.$$state});
                    $element.html(locals.$template ? locals.$template : initial);

                    var link = $compile($element.contents());

                    if (locals.$$controller) {
                        locals.$scope = scope;
                        var controller = $controller(locals.$$controller, locals);
                        if (locals.$$controllerAs) {
                            scope[locals.$$controllerAs] = controller;
                        }
                        $element.data('$ngControllerController', controller);
                        $element.children().data('$ngControllerController', controller);
                    }

                    link(scope);
                };
            }
        };
    }

    /**
     * Shared ui-view code for both directives:
     * Given scope, element, and its attributes, return the view's name
     */
    function getUiViewName(scope, attrs, element, $interpolate) {
        var name = $interpolate(attrs.uiView || attrs.name || '')(scope);
        var inherited = element.inheritedData('$uiView');
        return name.indexOf('@') >= 0 ? name : (name + '@' + (inherited ? inherited.state.name : ''));
    }

    angular.module('ui.router.state').directive('uiView', $ViewDirective);
    angular.module('ui.router.state').directive('uiView', $ViewDirectiveFill);

    function parseStateRef(ref, current) {
        var preparsed = ref.match(/^\s*({[^}]*})\s*$/), parsed;
        if (preparsed) ref = current + '(' + preparsed[1] + ')';
        parsed = ref.replace(/\n/g, " ").match(/^([^(]+?)\s*(\((.*)\))?$/);
        if (!parsed || parsed.length !== 4) throw new Error("Invalid state ref '" + ref + "'");
        return {state: parsed[1], paramExpr: parsed[3] || null};
    }

    function stateContext(el) {
        var stateData = el.parent().inheritedData('$uiView');

        if (stateData && stateData.state && stateData.state.name) {
            return stateData.state;
        }
    }

    /**
     * @ngdoc directive
     * @name ui.router.state.directive:ui-sref
     *
     * @requires ui.router.state.$state
     * @requires $timeout
     *
     * @restrict A
     *
     * @description
     * A directive that binds a link (`<a>` tag) to a state. If the state has an associated
     * URL, the directive will automatically generate & update the `href` attribute via
     * the {@link ui.router.state.$state#methods_href $state.href()} method. Clicking
     * the link will trigger a state transition with optional parameters.
     *
     * Also middle-clicking, right-clicking, and ctrl-clicking on the link will be
     * handled natively by the browser.
     *
     * You can also use relative state paths within ui-sref, just like the relative
     * paths passed to `$state.go()`. You just need to be aware that the path is relative
     * to the state that the link lives in, in other words the state that loaded the
     * template containing the link.
     *
     * You can specify options to pass to {@link ui.router.state.$state#go $state.go()}
     * using the `ui-sref-opts` attribute. Options are restricted to `location`, `inherit`,
     * and `reload`.
     *
     * @example
     * Here's an example of how you'd use ui-sref and how it would compile. If you have the
     * following template:
     * <pre>
     * <a ui-sref="home">Home</a> | <a ui-sref="about">About</a> | <a ui-sref="{page: 2}">Next page</a>
     *
     * <ul>
     *     <li ng-repeat="contact in contacts">
     *         <a ui-sref="contacts.detail({ id: contact.id })">{{ contact.name }}</a>
     *     </li>
     * </ul>
     * </pre>
     *
     * Then the compiled html would be (assuming Html5Mode is off and current state is contacts):
     * <pre>
     * <a href="#/home" ui-sref="home">Home</a> | <a href="#/about" ui-sref="about">About</a> | <a href="#/contacts?page=2" ui-sref="{page: 2}">Next page</a>
     *
     * <ul>
     *     <li ng-repeat="contact in contacts">
     *         <a href="#/contacts/1" ui-sref="contacts.detail({ id: contact.id })">Joe</a>
     *     </li>
     *     <li ng-repeat="contact in contacts">
     *         <a href="#/contacts/2" ui-sref="contacts.detail({ id: contact.id })">Alice</a>
     *     </li>
     *     <li ng-repeat="contact in contacts">
     *         <a href="#/contacts/3" ui-sref="contacts.detail({ id: contact.id })">Bob</a>
     *     </li>
     * </ul>
     *
     * <a ui-sref="home" ui-sref-opts="{reload: true}">Home</a>
     * </pre>
     *
     * @param {string} ui-sref 'stateName' can be any valid absolute or relative state
     * @param {Object} ui-sref-opts options to pass to {@link ui.router.state.$state#go $state.go()}
     */
    $StateRefDirective.$inject = ['$state', '$timeout'];
    function $StateRefDirective($state, $timeout) {
        var allowedOptions = ['location', 'inherit', 'reload'];

        return {
            restrict: 'A',
            require: ['?^uiSrefActive', '?^uiSrefActiveEq'],
            link: function (scope, element, attrs, uiSrefActive) {
                var ref = parseStateRef(attrs.uiSref, $state.current.name);
                var params = null, url = null, base = stateContext(element) || $state.$current;
                var newHref = null, isAnchor = element.prop("tagName") === "A";
                var isForm = element[0].nodeName === "FORM";
                var attr = isForm ? "action" : "href", nav = true;

                var options = {relative: base, inherit: true};
                var optionsOverride = scope.$eval(attrs.uiSrefOpts) || {};

                angular.forEach(allowedOptions, function (option) {
                    if (option in optionsOverride) {
                        options[option] = optionsOverride[option];
                    }
                });

                var update = function (newVal) {
                    if (newVal) params = angular.copy(newVal);
                    if (!nav) return;

                    newHref = $state.href(ref.state, params, options);

                    var activeDirective = uiSrefActive[1] || uiSrefActive[0];
                    if (activeDirective) {
                        activeDirective.$$setStateInfo(ref.state, params);
                    }
                    if (newHref === null) {
                        nav = false;
                        return false;
                    }
                    attrs.$set(attr, newHref);
                };

                if (ref.paramExpr) {
                    scope.$watch(ref.paramExpr, function (newVal, oldVal) {
                        if (newVal !== params) update(newVal);
                    }, true);
                    params = angular.copy(scope.$eval(ref.paramExpr));
                }
                update();

                if (isForm) return;

                element.bind("click", function (e) {
                    var button = e.which || e.button;
                    if (!(button > 1 || e.ctrlKey || e.metaKey || e.shiftKey || element.attr('target'))) {
                        // HACK: This is to allow ng-clicks to be processed before the transition is initiated:
                        var transition = $timeout(function () {
                            $state.go(ref.state, params, options);
                        });
                        e.preventDefault();

                        // if the state has no URL, ignore one preventDefault from the <a> directive.
                        var ignorePreventDefaultCount = isAnchor && !newHref ? 1 : 0;
                        e.preventDefault = function () {
                            if (ignorePreventDefaultCount-- <= 0)
                                $timeout.cancel(transition);
                        };
                    }
                });
            }
        };
    }

    /**
     * @ngdoc directive
     * @name ui.router.state.directive:ui-sref-active
     *
     * @requires ui.router.state.$state
     * @requires ui.router.state.$stateParams
     * @requires $interpolate
     *
     * @restrict A
     *
     * @description
     * A directive working alongside ui-sref to add classes to an element when the
     * related ui-sref directive's state is active, and removing them when it is inactive.
     * The primary use-case is to simplify the special appearance of navigation menus
     * relying on `ui-sref`, by having the "active" state's menu button appear different,
     * distinguishing it from the inactive menu items.
     *
     * ui-sref-active can live on the same element as ui-sref or on a parent element. The first
     * ui-sref-active found at the same level or above the ui-sref will be used.
     *
     * Will activate when the ui-sref's target state or any child state is active. If you
     * need to activate only when the ui-sref target state is active and *not* any of
     * it's children, then you will use
     * {@link ui.router.state.directive:ui-sref-active-eq ui-sref-active-eq}
     *
     * @example
     * Given the following template:
     * <pre>
     * <ul>
     *   <li ui-sref-active="active" class="item">
     *     <a href ui-sref="app.user({user: 'bilbobaggins'})">@bilbobaggins</a>
     *   </li>
     * </ul>
     * </pre>
     *
     *
     * When the app state is "app.user" (or any children states), and contains the state parameter "user" with value "bilbobaggins",
     * the resulting HTML will appear as (note the 'active' class):
     * <pre>
     * <ul>
     *   <li ui-sref-active="active" class="item active">
     *     <a ui-sref="app.user({user: 'bilbobaggins'})" href="/users/bilbobaggins">@bilbobaggins</a>
     *   </li>
     * </ul>
     * </pre>
     *
     * The class name is interpolated **once** during the directives link time (any further changes to the
     * interpolated value are ignored).
     *
     * Multiple classes may be specified in a space-separated format:
     * <pre>
     * <ul>
     *   <li ui-sref-active='class1 class2 class3'>
     *     <a ui-sref="app.user">link</a>
     *   </li>
     * </ul>
     * </pre>
     */

    /**
     * @ngdoc directive
     * @name ui.router.state.directive:ui-sref-active-eq
     *
     * @requires ui.router.state.$state
     * @requires ui.router.state.$stateParams
     * @requires $interpolate
     *
     * @restrict A
     *
     * @description
     * The same as {@link ui.router.state.directive:ui-sref-active ui-sref-active} but will only activate
     * when the exact target state used in the `ui-sref` is active; no child states.
     *
     */
    $StateRefActiveDirective.$inject = ['$state', '$stateParams', '$interpolate'];
    function $StateRefActiveDirective($state, $stateParams, $interpolate) {
        return {
            restrict: "A",
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                var state, params, activeClass;

                // There probably isn't much point in $observing this
                // uiSrefActive and uiSrefActiveEq share the same directive object with some
                // slight difference in logic routing
                activeClass = $interpolate($attrs.uiSrefActiveEq || $attrs.uiSrefActive || '', false)($scope);

                // Allow uiSref to communicate with uiSrefActive[Equals]
                this.$$setStateInfo = function (newState, newParams) {
                    state = $state.get(newState, stateContext($element));
                    params = newParams;
                    update();
                };

                $scope.$on('$stateChangeSuccess', update);

                // Update route state
                function update() {
                    if (isMatch()) {
                        $element.addClass(activeClass);
                    } else {
                        $element.removeClass(activeClass);
                    }
                }

                function isMatch() {
                    if (typeof $attrs.uiSrefActiveEq !== 'undefined') {
                        return state && $state.is(state.name, params);
                    } else {
                        return state && $state.includes(state.name, params);
                    }
                }
            }]
        };
    }

    angular.module('ui.router.state')
        .directive('uiSref', $StateRefDirective)
        .directive('uiSrefActive', $StateRefActiveDirective)
        .directive('uiSrefActiveEq', $StateRefActiveDirective);

    /**
     * @ngdoc filter
     * @name ui.router.state.filter:isState
     *
     * @requires ui.router.state.$state
     *
     * @description
     * Translates to {@link ui.router.state.$state#methods_is $state.is("stateName")}.
     */
    $IsStateFilter.$inject = ['$state'];
    function $IsStateFilter($state) {
        var isFilter = function (state) {
            return $state.is(state);
        };
        isFilter.$stateful = true;
        return isFilter;
    }

    /**
     * @ngdoc filter
     * @name ui.router.state.filter:includedByState
     *
     * @requires ui.router.state.$state
     *
     * @description
     * Translates to {@link ui.router.state.$state#methods_includes $state.includes('fullOrPartialStateName')}.
     */
    $IncludedByStateFilter.$inject = ['$state'];
    function $IncludedByStateFilter($state) {
        var includesFilter = function (state) {
            return $state.includes(state);
        };
        includesFilter.$stateful = true;
        return includesFilter;
    }

    angular.module('ui.router.state')
        .filter('isState', $IsStateFilter)
        .filter('includedByState', $IncludedByStateFilter);
})(window, window.angular);
'use strict';

(function () {

    /**
     * @ngdoc overview
     * @name ngStorage
     */

    angular.module('ngStorage', []).

    /**
     * @ngdoc object
     * @name ngStorage.$localStorage
     * @requires $rootScope
     * @requires $window
     */

    factory('$localStorage', _storageFactory('localStorage')).

    /**
     * @ngdoc object
     * @name ngStorage.$sessionStorage
     * @requires $rootScope
     * @requires $window
     */

    factory('$sessionStorage', _storageFactory('sessionStorage'));

    function _storageFactory(storageType) {
        return [
            '$rootScope',
            '$window',

            function ($rootScope,
                      $window) {
                // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
                var webStorage = $window[storageType] || (console.warn('This browser does not support Web Storage!'), {}),
                    $storage = {
                        $default: function (items) {
                            for (var k in items) {
                                angular.isDefined($storage[k]) || ($storage[k] = items[k]);
                            }

                            return $storage;
                        },
                        $reset: function (items) {
                            for (var k in $storage) {
                                '$' === k[0] || delete $storage[k];
                            }

                            return $storage.$default(items);
                        }
                    },
                    _last$storage,
                    _debounce;

                for (var i = 0, k; i < webStorage.length; i++) {
                    // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
                    (k = webStorage.key(i)) && 'ngStorage-' === k.slice(0, 10) && ($storage[k.slice(10)] = angular.fromJson(webStorage.getItem(k)));
                }

                _last$storage = angular.copy($storage);

                $rootScope.$watch(function () {
                    _debounce || (_debounce = setTimeout(function () {
                        _debounce = null;

                        if (!angular.equals($storage, _last$storage)) {
                            angular.forEach($storage, function (v, k) {
                                angular.isDefined(v) && '$' !== k[0] && webStorage.setItem('ngStorage-' + k, angular.toJson(v));

                                delete _last$storage[k];
                            });

                            for (var k in _last$storage) {
                                webStorage.removeItem('ngStorage-' + k);
                            }

                            _last$storage = angular.copy($storage);
                        }
                    }, 100));
                });

                // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
                'localStorage' === storageType && $window.addEventListener && $window.addEventListener('storage', function (event) {
                    if ('ngStorage-' === event.key.slice(0, 10)) {
                        event.newValue ? $storage[event.key.slice(10)] = angular.fromJson(event.newValue) : delete $storage[event.key.slice(10)];

                        _last$storage = angular.copy($storage);

                        $rootScope.$apply();
                    }
                });

                return $storage;
            }
        ];
    }

})();


/**
 * oclazyload - Load modules on demand (lazy load) with angularJS
 * @version v0.6.3
 * @link https://github.com/ocombe/ocLazyLoad
 * @license MIT
 * @author Olivier Combe <olivier.combe@gmail.com>
 */
(function () {
    'use strict';
    var regModules = ['ng'],
        regInvokes = {},
        regConfigs = [],
        justLoaded = [],
        runBlocks = {},
        ocLazyLoad = angular.module('oc.lazyLoad', ['ng']),
        broadcast = angular.noop,
        modulesToLoad = [],
        recordDeclarations = [true];

    ocLazyLoad.provider('$ocLazyLoad', ['$controllerProvider', '$provide', '$compileProvider', '$filterProvider', '$injector', '$animateProvider',
        function ($controllerProvider, $provide, $compileProvider, $filterProvider, $injector, $animateProvider) {
            var modules = {},
                providers = {
                    $controllerProvider: $controllerProvider,
                    $compileProvider: $compileProvider,
                    $filterProvider: $filterProvider,
                    $provide: $provide, // other things
                    $injector: $injector,
                    $animateProvider: $animateProvider
                },
                anchor = document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0],
                jsLoader, cssLoader, templatesLoader,
                debug = false,
                events = false;

            // Let's get the list of loaded modules & components
            init(angular.element(window.document));

            this.$get = ['$log', '$q', '$templateCache', '$http', '$rootElement', '$rootScope', '$cacheFactory', '$interval', function ($log, $q, $templateCache, $http, $rootElement, $rootScope, $cacheFactory, $interval) {
                var instanceInjector,
                    filesCache = $cacheFactory('ocLazyLoad'),
                    uaCssChecked = false,
                    useCssLoadPatch = false;

                if (!debug) {
                    $log = {};
                    $log['error'] = angular.noop;
                    $log['warn'] = angular.noop;
                    $log['info'] = angular.noop;
                }

                // Make this lazy because at the moment that $get() is called the instance injector hasn't been assigned to the rootElement yet
                providers.getInstanceInjector = function () {
                    return (instanceInjector) ? instanceInjector : (instanceInjector = ($rootElement.data('$injector') || angular.injector()));
                };

                broadcast = function broadcast(eventName, params) {
                    if (events) {
                        $rootScope.$broadcast(eventName, params);
                    }
                    if (debug) {
                        $log.info(eventName, params);
                    }
                };

                /**
                 * Load a js/css file
                 * @param type
                 * @param path
                 * @param params
                 * @returns promise
                 */
                var buildElement = function buildElement(type, path, params) {
                    var deferred = $q.defer(),
                        el, loaded,
                        cacheBuster = function cacheBuster(url) {
                            var dc = new Date().getTime();
                            if (url.indexOf('?') >= 0) {
                                if (url.substring(0, url.length - 1) === '&') {
                                    return url + '_dc=' + dc;
                                }
                                return url + '&_dc=' + dc;
                            } else {
                                return url + '?_dc=' + dc;
                            }
                        };

                    // Store the promise early so the file load can be detected by other parallel lazy loads
                    // (ie: multiple routes on one page) a 'true' value isn't sufficient
                    // as it causes false positive load results.
                    if (angular.isUndefined(filesCache.get(path))) {
                        filesCache.put(path, deferred.promise);
                    }

                    // Switch in case more content types are added later
                    switch (type) {
                        case 'css':
                            el = document.createElement('link');
                            el.type = 'text/css';
                            el.rel = 'stylesheet';
                            el.href = params.cache === false ? cacheBuster(path) : path;
                            break;
                        case 'js':
                            el = document.createElement('script');
                            el.src = params.cache === false ? cacheBuster(path) : path;
                            break;
                        default:
                            deferred.reject(new Error('Requested type "' + type + '" is not known. Could not inject "' + path + '"'));
                            break;
                    }
                    el.onload = el['onreadystatechange'] = function (e) {
                        if ((el['readyState'] && !(/^c|loade/.test(el['readyState']))) || loaded) return;
                        el.onload = el['onreadystatechange'] = null;
                        loaded = 1;
                        broadcast('ocLazyLoad.fileLoaded', path);
                        deferred.resolve();
                    };
                    el.onerror = function () {
                        deferred.reject(new Error('Unable to load ' + path));
                    };
                    el.async = params.serie ? 0 : 1;

                    var insertBeforeElem = anchor.lastChild;
                    if (params.insertBefore) {
                        var element = angular.element(params.insertBefore);
                        if (element && element.length > 0) {
                            insertBeforeElem = element[0];
                        }
                    }
                    anchor.insertBefore(el, insertBeforeElem);

                    /*
                     The event load or readystatechange doesn't fire in:
                     - iOS < 6       (default mobile browser)
                     - Android < 4.4 (default mobile browser)
                     - Safari < 6    (desktop browser)
                     */
                    if (type == 'css') {
                        if (!uaCssChecked) {
                            var ua = navigator.userAgent.toLowerCase();

                            // iOS < 6
                            if (/iP(hone|od|ad)/.test(navigator.platform)) {
                                var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
                                var iOSVersion = parseFloat([parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)].join('.'));
                                useCssLoadPatch = iOSVersion < 6;
                            } else if (ua.indexOf("android") > -1) { // Android < 4.4
                                var androidVersion = parseFloat(ua.slice(ua.indexOf("android") + 8));
                                useCssLoadPatch = androidVersion < 4.4;
                            } else if (ua.indexOf('safari') > -1 && ua.indexOf('chrome') == -1) {
                                var safariVersion = parseFloat(ua.match(/version\/([\.\d]+)/i)[1]);
                                useCssLoadPatch = safariVersion < 6;
                            }
                        }

                        if (useCssLoadPatch) {
                            var tries = 1000; // * 20 = 20000 miliseconds
                            var interval = $interval(function () {
                                try {
                                    el.sheet.cssRules;
                                    $interval.cancel(interval);
                                    el.onload();
                                } catch (e) {
                                    if (--tries <= 0) {
                                        el.onerror();
                                    }
                                }
                            }, 20);
                        }
                    }

                    return deferred.promise;
                };

                if (angular.isUndefined(jsLoader)) {
                    /**
                     * jsLoader function
                     * @type Function
                     * @param paths array list of js files to load
                     * @param callback to call when everything is loaded. We use a callback and not a promise
                     * @param params object config parameters
                     * because the user can overwrite jsLoader and it will probably not use promises :(
                     */
                    jsLoader = function (paths, callback, params) {
                        var promises = [];
                        angular.forEach(paths, function loading(path) {
                            promises.push(buildElement('js', path, params));
                        });
                        $q.all(promises).then(function success() {
                            callback();
                        }, function error(err) {
                            callback(err);
                        });
                    };
                    jsLoader.ocLazyLoadLoader = true;
                }

                if (angular.isUndefined(cssLoader)) {
                    /**
                     * cssLoader function
                     * @type Function
                     * @param paths array list of css files to load
                     * @param callback to call when everything is loaded. We use a callback and not a promise
                     * @param params object config parameters
                     * because the user can overwrite cssLoader and it will probably not use promises :(
                     */
                    cssLoader = function (paths, callback, params) {
                        var promises = [];
                        angular.forEach(paths, function loading(path) {
                            promises.push(buildElement('css', path, params));
                        });
                        $q.all(promises).then(function success() {
                            callback();
                        }, function error(err) {
                            callback(err);
                        });
                    };
                    cssLoader.ocLazyLoadLoader = true;
                }

                if (angular.isUndefined(templatesLoader)) {
                    /**
                     * templatesLoader function
                     * @type Function
                     * @param paths array list of css files to load
                     * @param callback to call when everything is loaded. We use a callback and not a promise
                     * @param params object config parameters for $http
                     * because the user can overwrite templatesLoader and it will probably not use promises :(
                     */
                    templatesLoader = function (paths, callback, params) {
                        var promises = [];
                        angular.forEach(paths, function (url) {
                            var deferred = $q.defer();
                            promises.push(deferred.promise);
                            $http.get(url, params).success(function (data) {
                                if (angular.isString(data) && data.length > 0) {
                                    angular.forEach(angular.element(data), function (node) {
                                        if (node.nodeName === 'SCRIPT' && node.type === 'text/ng-template') {
                                            $templateCache.put(node.id, node.innerHTML);
                                        }
                                    });
                                }
                                if (angular.isUndefined(filesCache.get(url))) {
                                    filesCache.put(url, true);
                                }
                                deferred.resolve();
                            }).error(function (err) {
                                deferred.reject(new Error('Unable to load template file "' + url + '": ' + err));
                            });
                        });
                        return $q.all(promises).then(function success() {
                            callback();
                        }, function error(err) {
                            callback(err);
                        });
                    };
                    templatesLoader.ocLazyLoadLoader = true;
                }

                var filesLoader = function filesLoader(config, params) {
                    var cssFiles = [],
                        templatesFiles = [],
                        jsFiles = [],
                        promises = [],
                        cachePromise = null;

                    recordDeclarations.push(true); // start watching angular.module calls

                    angular.extend(params || {}, config);

                    var pushFile = function (path) {
                        var file_type = null, m;
                        if (typeof path === 'object') {
                            file_type = path.type;
                            path = path.path;
                        }
                        cachePromise = filesCache.get(path);
                        if (angular.isUndefined(cachePromise) || params.cache === false) {

                            // always check for requirejs syntax just in case
                            if ((m = /^(css|less|html|htm|js)?(?=!)/.exec(path)) !== null) { // Detect file type using preceding type declaration (ala requireJS)
                                file_type = m[1];
                                path = path.substr(m[1].length + 1, path.length);  // Strip the type from the path
                            }

                            if (!file_type) {
                                if ((m = /[.](css|less|html|htm|js)?(\?.*)?$/.exec(path)) !== null) {  // Detect file type via file extension
                                    file_type = m[1];
                                } else if (!jsLoader.hasOwnProperty('ocLazyLoadLoader') && jsLoader.hasOwnProperty('load')) { // requirejs
                                    file_type = 'js';
                                } else {
                                    $log.error('File type could not be determined. ' + path);
                                    return;
                                }
                            }

                            if ((file_type === 'css' || file_type === 'less') && cssFiles.indexOf(path) === -1) {
                                cssFiles.push(path);
                            } else if ((file_type === 'html' || file_type === 'htm') && templatesFiles.indexOf(path) === -1) {
                                templatesFiles.push(path);
                            } else if ((file_type === 'js') || jsFiles.indexOf(path) === -1) {
                                jsFiles.push(path);
                            } else {
                                $log.error('File type is not valid. ' + path);
                            }

                        } else if (cachePromise) {
                            promises.push(cachePromise);
                        }
                    };

                    if (params.serie) {
                        pushFile(params.files.shift());
                    } else {
                        angular.forEach(params.files, function (path) {
                            pushFile(path);
                        });
                    }

                    if (cssFiles.length > 0) {
                        var cssDeferred = $q.defer();
                        cssLoader(cssFiles, function (err) {
                            if (angular.isDefined(err) && cssLoader.hasOwnProperty('ocLazyLoadLoader')) {
                                $log.error(err);
                                cssDeferred.reject(err);
                            } else {
                                cssDeferred.resolve();
                            }
                        }, params);
                        promises.push(cssDeferred.promise);
                    }

                    if (templatesFiles.length > 0) {
                        var templatesDeferred = $q.defer();
                        templatesLoader(templatesFiles, function (err) {
                            if (angular.isDefined(err) && templatesLoader.hasOwnProperty('ocLazyLoadLoader')) {
                                $log.error(err);
                                templatesDeferred.reject(err);
                            } else {
                                templatesDeferred.resolve();
                            }
                        }, params);
                        promises.push(templatesDeferred.promise);
                    }

                    if (jsFiles.length > 0) {
                        var jsDeferred = $q.defer();
                        jsLoader(jsFiles, function (err) {
                            if (angular.isDefined(err) && jsLoader.hasOwnProperty('ocLazyLoadLoader')) {
                                $log.error(err);
                                jsDeferred.reject(err);
                            } else {
                                jsDeferred.resolve();
                            }
                        }, params);
                        promises.push(jsDeferred.promise);
                    }

                    if (params.serie && params.files.length > 0) {
                        return $q.all(promises).then(function success() {
                            return filesLoader(config, params);
                        });
                    } else {
                        return $q.all(promises).finally(function (res) {
                            recordDeclarations.pop(); // stop watching angular.module calls
                            return res;
                        });
                    }
                };

                return {
                    /**
                     * Let you get a module config object
                     * @param moduleName String the name of the module
                     * @returns {*}
                     */
                    getModuleConfig: function (moduleName) {
                        if (!angular.isString(moduleName)) {
                            throw new Error('You need to give the name of the module to get');
                        }
                        if (!modules[moduleName]) {
                            return null;
                        }
                        return modules[moduleName];
                    },

                    /**
                     * Let you define a module config object
                     * @param moduleConfig Object the module config object
                     * @returns {*}
                     */
                    setModuleConfig: function (moduleConfig) {
                        if (!angular.isObject(moduleConfig)) {
                            throw new Error('You need to give the module config object to set');
                        }
                        modules[moduleConfig.name] = moduleConfig;
                        return moduleConfig;
                    },

                    /**
                     * Returns the list of loaded modules
                     * @returns {string[]}
                     */
                    getModules: function () {
                        return regModules;
                    },

                    /**
                     * Let you check if a module has been loaded into Angular or not
                     * @param modulesNames String/Object a module name, or a list of module names
                     * @returns {boolean}
                     */
                    isLoaded: function (modulesNames) {
                        var moduleLoaded = function (module) {
                            var isLoaded = regModules.indexOf(module) > -1;
                            if (!isLoaded) {
                                isLoaded = !!moduleExists(module);
                            }
                            return isLoaded;
                        };
                        if (angular.isString(modulesNames)) {
                            modulesNames = [modulesNames];
                        }
                        if (angular.isArray(modulesNames)) {
                            var i, len;
                            for (i = 0, len = modulesNames.length; i < len; i++) {
                                if (!moduleLoaded(modulesNames[i])) {
                                    return false;
                                }
                            }
                            return true;
                        } else {
                            throw new Error('You need to define the module(s) name(s)');
                        }
                    },

                    /**
                     * Load a module or a list of modules into Angular
                     * @param module Mixed the name of a predefined module config object, or a module config object, or an array of either
                     * @param params Object optional parameters
                     * @returns promise
                     */
                    load: function (module, params) {
                        var self = this,
                            config = null,
                            moduleCache = [],
                            deferredList = [],
                            deferred = $q.defer(),
                            errText;

                        if (angular.isUndefined(params)) {
                            params = {};
                        }

                        // If module is an array, break it down
                        if (angular.isArray(module)) {
                            // Resubmit each entry as a single module
                            angular.forEach(module, function (m) {
                                if (m) {
                                    deferredList.push(self.load(m, params));
                                }
                            });

                            // Resolve the promise once everything has loaded
                            $q.all(deferredList).then(function success() {
                                deferred.resolve(module);
                            }, function error(err) {
                                deferred.reject(err);
                            });

                            return deferred.promise;
                        }

                        // Get or Set a configuration depending on what was passed in
                        if (typeof module === 'string') {
                            config = self.getModuleConfig(module);
                            if (!config) {
                                config = {
                                    files: [module]
                                };
                            }
                        } else if (typeof module === 'object') {
                            if (angular.isDefined(module.path) && angular.isDefined(module.type)) { // case {type: 'js', path: lazyLoadUrl + 'testModule.fakejs'}
                                config = {
                                    files: [module]
                                };
                            } else {
                                config = self.setModuleConfig(module);
                            }
                        }

                        if (config === null) {
                            var moduleName = getModuleName(module);
                            errText = 'Module "' + (moduleName || 'unknown') + '" is not configured, cannot load.';
                            $log.error(errText);
                            deferred.reject(new Error(errText));
                            return deferred.promise;
                        } else {
                            // deprecated
                            if (angular.isDefined(config.template)) {
                                if (angular.isUndefined(config.files)) {
                                    config.files = [];
                                }
                                if (angular.isString(config.template)) {
                                    config.files.push(config.template);
                                } else if (angular.isArray(config.template)) {
                                    config.files.concat(config.template);
                                }
                            }
                        }

                        moduleCache.push = function (value) {
                            if (this.indexOf(value) === -1) {
                                Array.prototype.push.apply(this, arguments);
                            }
                        };

                        var localParams = {};
                        angular.extend(localParams, params, config);

                        var loadDependencies = function loadDependencies(module) {
                            var moduleName,
                                loadedModule,
                                requires,
                                diff,
                                promisesList = [];

                            moduleName = getModuleName(module);
                            if (moduleName === null) {
                                return $q.when();
                            } else {
                                try {
                                    loadedModule = getModule(moduleName);
                                } catch (e) {
                                    var deferred = $q.defer();
                                    $log.error(e.message);
                                    deferred.reject(e);
                                    return deferred.promise;
                                }
                                requires = getRequires(loadedModule);
                            }

                            angular.forEach(requires, function (requireEntry) {
                                // If no configuration is provided, try and find one from a previous load.
                                // If there isn't one, bail and let the normal flow run
                                if (typeof requireEntry === 'string') {
                                    var config = self.getModuleConfig(requireEntry);
                                    if (config === null) {
                                        moduleCache.push(requireEntry); // We don't know about this module, but something else might, so push it anyway.
                                        return;
                                    }
                                    requireEntry = config;
                                }

                                // Check if this dependency has been loaded previously
                                if (moduleExists(requireEntry.name)) {
                                    if (typeof module !== 'string') {
                                        // compare against the already loaded module to see if the new definition adds any new files
                                        diff = requireEntry.files.filter(function (n) {
                                            return self.getModuleConfig(requireEntry.name).files.indexOf(n) < 0;
                                        });

                                        // If the module was redefined, advise via the console
                                        if (diff.length !== 0) {
                                            $log.warn('Module "', moduleName, '" attempted to redefine configuration for dependency. "', requireEntry.name, '"\n Additional Files Loaded:', diff);
                                        }

                                        // Push everything to the file loader, it will weed out the duplicates.
                                        promisesList.push(filesLoader(requireEntry.files, localParams).then(function () {
                                            return loadDependencies(requireEntry);
                                        }));
                                    }
                                    return;
                                } else if (angular.isArray(requireEntry)) {
                                    requireEntry = {
                                        files: requireEntry
                                    };
                                } else if (typeof requireEntry === 'object') {
                                    if (requireEntry.hasOwnProperty('name') && requireEntry['name']) {
                                        // The dependency doesn't exist in the module cache and is a new configuration, so store and push it.
                                        self.setModuleConfig(requireEntry);
                                        moduleCache.push(requireEntry['name']);
                                    }
                                }

                                // Check if the dependency has any files that need to be loaded. If there are, push a new promise to the promise list.
                                if (requireEntry.hasOwnProperty('files') && requireEntry.files.length !== 0) {
                                    if (requireEntry.files) {
                                        promisesList.push(filesLoader(requireEntry, localParams).then(function () {
                                            return loadDependencies(requireEntry);
                                        }));
                                    }
                                }
                            });

                            // Create a wrapper promise to watch the promise list and resolve it once everything is done.
                            return $q.all(promisesList);
                        };

                        // if someone loaded the module file with something else and called the load function with just the module name
                        if (angular.isUndefined(config.files) && angular.isDefined(config.name) && moduleExists(config.name)) {
                            recordDeclarations.push(true); // start watching angular.module calls
                            addToLoadList(config.name);
                            recordDeclarations.pop();
                        }

                        filesLoader(config, localParams).then(function success() {
                            if (modulesToLoad.length === 0) {
                                deferred.resolve(module);
                            } else {
                                var loadNext = function loadNext(moduleName) {
                                    moduleCache.push(moduleName);
                                    loadDependencies(moduleName).then(function success() {
                                        try {
                                            justLoaded = [];
                                            register(providers, moduleCache, localParams);
                                        } catch (e) {
                                            $log.error(e.message);
                                            deferred.reject(e);
                                            return;
                                        }

                                        if (modulesToLoad.length > 0) {
                                            loadNext(modulesToLoad.shift()); // load the next in list
                                        } else {
                                            deferred.resolve(module); // everything has been loaded, resolve
                                        }
                                    }, function error(err) {
                                        deferred.reject(err);
                                    });
                                };

                                // load the first in list
                                loadNext(modulesToLoad.shift());
                            }
                        }, function error(err) {
                            deferred.reject(err);
                        });

                        return deferred.promise;
                    }
                };
            }];

            this.config = function (config) {
                if (angular.isDefined(config.jsLoader) || angular.isDefined(config.asyncLoader)) {
                    if (!angular.isFunction(config.jsLoader || config.asyncLoader)) {
                        throw('The js loader needs to be a function');
                    }
                    jsLoader = config.jsLoader || config.asyncLoader;
                }

                if (angular.isDefined(config.cssLoader)) {
                    if (!angular.isFunction(config.cssLoader)) {
                        throw('The css loader needs to be a function');
                    }
                    cssLoader = config.cssLoader;
                }

                if (angular.isDefined(config.templatesLoader)) {
                    if (!angular.isFunction(config.templatesLoader)) {
                        throw('The template loader needs to be a function');
                    }
                    templatesLoader = config.templatesLoader;
                }

                // If we want to define modules configs
                if (angular.isDefined(config.modules)) {
                    if (angular.isArray(config.modules)) {
                        angular.forEach(config.modules, function (moduleConfig) {
                            modules[moduleConfig.name] = moduleConfig;
                        });
                    } else {
                        modules[config.modules.name] = config.modules;
                    }
                }

                if (angular.isDefined(config.debug)) {
                    debug = config.debug;
                }

                if (angular.isDefined(config.events)) {
                    events = config.events;
                }
            };
        }]);

    ocLazyLoad.directive('ocLazyLoad', ['$ocLazyLoad', '$compile', '$animate', '$parse',
        function ($ocLazyLoad, $compile, $animate, $parse) {
            return {
                restrict: 'A',
                terminal: true,
                priority: 1000,
                compile: function (element, attrs) {
                    // we store the content and remove it before compilation
                    var content = element[0].innerHTML;
                    element.html('');

                    return function ($scope, $element, $attr) {
                        var model = $parse($attr.ocLazyLoad);
                        $scope.$watch(function () {
                            // it can be a module name (string), an object, an array, or a scope reference to any of this
                            return model($scope) || $attr.ocLazyLoad;
                        }, function (moduleName) {
                            if (angular.isDefined(moduleName)) {
                                $ocLazyLoad.load(moduleName).then(function success(moduleConfig) {
                                    $animate.enter($compile(content)($scope), null, $element);
                                });
                            }
                        }, true);
                    };
                }
            };
        }]);

    /**
     * Get the list of required modules/services/... for this module
     * @param module
     * @returns {Array}
     */
    function getRequires(module) {
        var requires = [];
        angular.forEach(module.requires, function (requireModule) {
            if (regModules.indexOf(requireModule) === -1) {
                requires.push(requireModule);
            }
        });
        return requires;
    }

    /**
     * Check if a module exists and returns it if it does
     * @param moduleName
     * @returns {boolean}
     */
    function moduleExists(moduleName) {
        if (!angular.isString(moduleName)) {
            return false;
        }
        try {
            return ngModuleFct(moduleName);
        } catch (e) {
            if (/No module/.test(e) || (e.message.indexOf('$injector:nomod') > -1)) {
                return false;
            }
        }
    }

    function getModule(moduleName) {
        try {
            return ngModuleFct(moduleName);
        } catch (e) {
            // this error message really suxx
            if (/No module/.test(e) || (e.message.indexOf('$injector:nomod') > -1)) {
                e.message = 'The module "' + moduleName + '" that you are trying to load does not exist. ' + e.message
            }
            throw e;
        }
    }

    function invokeQueue(providers, queue, moduleName, reconfig) {
        if (!queue) {
            return;
        }

        var i, len, args, provider;
        for (i = 0, len = queue.length; i < len; i++) {
            args = queue[i];
            if (angular.isArray(args)) {
                if (providers !== null) {
                    if (providers.hasOwnProperty(args[0])) {
                        provider = providers[args[0]];
                    } else {
                        throw new Error('unsupported provider ' + args[0]);
                    }
                }
                var isNew = registerInvokeList(args, moduleName);
                if (args[1] !== 'invoke') {
                    if (isNew && angular.isDefined(provider)) {
                        provider[args[1]].apply(provider, args[2]);
                    }
                } else { // config block
                    var callInvoke = function (fct) {
                        var invoked = regConfigs.indexOf(moduleName + '-' + fct);
                        if (invoked === -1 || reconfig) {
                            if (invoked === -1) {
                                regConfigs.push(moduleName + '-' + fct);
                            }
                            if (angular.isDefined(provider)) {
                                provider[args[1]].apply(provider, args[2]);
                            }
                        }
                    };
                    if (angular.isFunction(args[2][0])) {
                        callInvoke(args[2][0]);
                    } else if (angular.isArray(args[2][0])) {
                        for (var j = 0, jlen = args[2][0].length; j < jlen; j++) {
                            if (angular.isFunction(args[2][0][j])) {
                                callInvoke(args[2][0][j]);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Register a new module and load it
     * @param providers
     * @param registerModules
     * @returns {*}
     */
    function register(providers, registerModules, params) {
        if (registerModules) {
            var k, r, moduleName, moduleFn, tempRunBlocks = [];
            for (k = registerModules.length - 1; k >= 0; k--) {
                moduleName = registerModules[k];
                if (typeof moduleName !== 'string') {
                    moduleName = getModuleName(moduleName);
                }
                if (!moduleName || justLoaded.indexOf(moduleName) !== -1) {
                    continue;
                }
                var newModule = regModules.indexOf(moduleName) === -1;
                moduleFn = ngModuleFct(moduleName);
                if (newModule) { // new module
                    regModules.push(moduleName);
                    register(providers, moduleFn.requires, params);
                }
                if (moduleFn._runBlocks.length > 0) {
                    // new run blocks detected! Replace the old ones (if existing)
                    runBlocks[moduleName] = [];
                    while (moduleFn._runBlocks.length > 0) {
                        runBlocks[moduleName].push(moduleFn._runBlocks.shift());
                    }
                }
                if (angular.isDefined(runBlocks[moduleName]) && (newModule || params.rerun)) {
                    tempRunBlocks = tempRunBlocks.concat(runBlocks[moduleName]);
                }
                invokeQueue(providers, moduleFn._invokeQueue, moduleName, params.reconfig);
                invokeQueue(providers, moduleFn._configBlocks, moduleName, params.reconfig); // angular 1.3+
                broadcast(newModule ? 'ocLazyLoad.moduleLoaded' : 'ocLazyLoad.moduleReloaded', moduleName);
                registerModules.pop();
                justLoaded.push(moduleName);
            }
            // execute the run blocks at the end
            var instanceInjector = providers.getInstanceInjector();
            angular.forEach(tempRunBlocks, function (fn) {
                instanceInjector.invoke(fn);
            });
        }
    }

    /**
     * Register an invoke
     * @param args
     * @param moduleName
     * @returns {boolean}
     */
    function registerInvokeList(args, moduleName) {
        var invokeList = args[2][0],
            type = args[1],
            newInvoke = false;
        if (angular.isUndefined(regInvokes[moduleName])) {
            regInvokes[moduleName] = {};
        }
        if (angular.isUndefined(regInvokes[moduleName][type])) {
            regInvokes[moduleName][type] = {};
        }
        var onInvoke = function (invokeName, signature) {
            newInvoke = true;
            regInvokes[moduleName][type][invokeName].push(signature);
            broadcast('ocLazyLoad.componentLoaded', [moduleName, type, invokeName]);
        };
        var signature = function signature(data) {
            if (angular.isArray(data)) { // arrays are objects, we need to test for it first
                return hashCode(data.toString());
            } else if (angular.isObject(data)) { // constants & values for example
                return hashCode(stringify(data));
            } else {
                if (angular.isDefined(data) && data !== null) {
                    return hashCode(data.toString());
                } else { // null & undefined constants
                    return data;
                }
            }
        };
        if (angular.isString(invokeList)) {
            if (angular.isUndefined(regInvokes[moduleName][type][invokeList])) {
                regInvokes[moduleName][type][invokeList] = [];
            }
            if (regInvokes[moduleName][type][invokeList].indexOf(signature(args[2][1])) === -1) {
                onInvoke(invokeList, signature(args[2][1]));
            }
        } else if (angular.isObject(invokeList)) { // decorators for example
            angular.forEach(invokeList, function (invoke) {
                if (angular.isString(invoke)) {
                    if (angular.isUndefined(regInvokes[moduleName][type][invoke])) {
                        regInvokes[moduleName][type][invoke] = [];
                    }
                    if (regInvokes[moduleName][type][invoke].indexOf(signature(invokeList[1])) === -1) {
                        onInvoke(invoke, signature(invokeList[1]));
                    }
                }
            });
        } else {
            return false;
        }
        return newInvoke;
    }

    function getModuleName(module) {
        var moduleName = null;
        if (angular.isString(module)) {
            moduleName = module;
        } else if (angular.isObject(module) && module.hasOwnProperty('name') && angular.isString(module.name)) {
            moduleName = module.name;
        }
        return moduleName;
    }

    /**
     * Get the list of existing registered modules
     * @param element
     */
    function init(element) {
        if (modulesToLoad.length === 0) {
            var elements = [element],
                names = ['ng:app', 'ng-app', 'x-ng-app', 'data-ng-app'],
                NG_APP_CLASS_REGEXP = /\sng[:\-]app(:\s*([\w\d_]+);?)?\s/,
                append = function append(elm) {
                    return (elm && elements.push(elm));
                };

            angular.forEach(names, function (name) {
                names[name] = true;
                append(document.getElementById(name));
                name = name.replace(':', '\\:');
                if (element[0].querySelectorAll) {
                    angular.forEach(element[0].querySelectorAll('.' + name), append);
                    angular.forEach(element[0].querySelectorAll('.' + name + '\\:'), append);
                    angular.forEach(element[0].querySelectorAll('[' + name + ']'), append);
                }
            });

            angular.forEach(elements, function (elm) {
                if (modulesToLoad.length === 0) {
                    var className = ' ' + element.className + ' ';
                    var match = NG_APP_CLASS_REGEXP.exec(className);
                    if (match) {
                        modulesToLoad.push((match[2] || '').replace(/\s+/g, ','));
                    } else {
                        angular.forEach(elm.attributes, function (attr) {
                            if (modulesToLoad.length === 0 && names[attr.name]) {
                                modulesToLoad.push(attr.value);
                            }
                        });
                    }
                }
            });
        }

        if (modulesToLoad.length === 0 && !((window.jasmine || window.mocha) && angular.isDefined(angular.mock))) {
            console.error('No module found during bootstrap, unable to init ocLazyLoad. You should always use the ng-app directive or angular.boostrap when you use ocLazyLoad.');
        }

        var addReg = function addReg(moduleName) {
            if (regModules.indexOf(moduleName) === -1) {
                // register existing modules
                regModules.push(moduleName);
                var mainModule = angular.module(moduleName);

                // register existing components (directives, services, ...)
                invokeQueue(null, mainModule._invokeQueue, moduleName);
                invokeQueue(null, mainModule._configBlocks, moduleName); // angular 1.3+

                angular.forEach(mainModule.requires, addReg);
            }
        };

        angular.forEach(modulesToLoad, function (moduleName) {
            addReg(moduleName);
        });

        modulesToLoad = []; // reset for next bootstrap
        recordDeclarations.pop(); // wait for the next lazy load
    }

    var bootstrapFct = angular.bootstrap;
    angular.bootstrap = function (element, modules, config) {
        // we use slice to make a clean copy
        angular.forEach(modules.slice(), function (module) {
            addToLoadList(module);
        });
        return bootstrapFct(element, modules, config);
    };

    var addToLoadList = function addToLoadList(name) {
        if (recordDeclarations.length > 0 && angular.isString(name) && modulesToLoad.indexOf(name) === -1) {
            modulesToLoad.push(name);
        }
    };

    var ngModuleFct = angular.module;
    angular.module = function (name, requires, configFn) {
        addToLoadList(name);
        return ngModuleFct(name, requires, configFn);
    };

    var hashCode = function hashCode(str) {
        var hash = 0, i, chr, len;
        if (str.length == 0) return hash;
        for (i = 0, len = str.length; i < len; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };

    var stringify = function stringify(obj) {
        var cache = [];
        return JSON.stringify(obj, function (key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        });
    };

    // Array.indexOf polyfill for IE8
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {

            var k;

            // 1. Let O be the result of calling ToObject passing
            //    the this value as the argument.
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get
            //    internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If len is 0, return -1.
            if (len === 0) {
                return -1;
            }

            // 5. If argument fromIndex was passed let n be
            //    ToInteger(fromIndex); else let n be 0.
            var n = +fromIndex || 0;

            if (Math.abs(n) === Infinity) {
                n = 0;
            }

            // 6. If n >= len, return -1.
            if (n >= len) {
                return -1;
            }

            // 7. If n >= 0, then Let k be n.
            // 8. Else, n<0, Let k be len - abs(n).
            //    If k is less than 0, then let k be 0.
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            // 9. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the
                //    HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                //    i.  Let elementK be the result of calling the Get
                //        internal method of O with the argument ToString(k).
                //   ii.  Let same be the result of applying the
                //        Strict Equality Comparison Algorithm to
                //        searchElement and elementK.
                //  iii.  If same is true, return k.
                if (k in O && O[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    }
})();


/*!
 * angular-loading-bar v0.7.0
 * https://chieffancypants.github.io/angular-loading-bar
 * Copyright (c) 2015 Wes Cruver
 * License: MIT
 */

(function () {

    'use strict';

// Alias the loading bar for various backwards compatibilities since the project has matured:
    angular.module('angular-loading-bar', ['cfp.loadingBarInterceptor']);
    angular.module('chieffancypants.loadingBar', ['cfp.loadingBarInterceptor']);


    /**
     * loadingBarInterceptor service
     *
     * Registers itself as an Angular interceptor and listens for XHR requests.
     */
    angular.module('cfp.loadingBarInterceptor', ['cfp.loadingBar'])
        .config(['$httpProvider', function ($httpProvider) {

            var interceptor = ['$q', '$cacheFactory', '$timeout', '$rootScope', '$log', 'cfpLoadingBar', function ($q, $cacheFactory, $timeout, $rootScope, $log, cfpLoadingBar) {

                /**
                 * The total number of requests made
                 */
                var reqsTotal = 0;

                /**
                 * The number of requests completed (either successfully or not)
                 */
                var reqsCompleted = 0;

                /**
                 * The amount of time spent fetching before showing the loading bar
                 */
                var latencyThreshold = cfpLoadingBar.latencyThreshold;

                /**
                 * $timeout handle for latencyThreshold
                 */
                var startTimeout;


                /**
                 * calls cfpLoadingBar.complete() which removes the
                 * loading bar from the DOM.
                 */
                function setComplete() {
                    $timeout.cancel(startTimeout);
                    cfpLoadingBar.complete();
                    reqsCompleted = 0;
                    reqsTotal = 0;
                }

                /**
                 * Determine if the response has already been cached
                 * @param  {Object}  config the config option from the request
                 * @return {Boolean} retrns true if cached, otherwise false
                 */
                function isCached(config) {
                    var cache;
                    var defaultCache = $cacheFactory.get('$http');
                    var defaults = $httpProvider.defaults;

                    // Choose the proper cache source. Borrowed from angular: $http service
                    if ((config.cache || defaults.cache) && config.cache !== false &&
                        (config.method === 'GET' || config.method === 'JSONP')) {
                        cache = angular.isObject(config.cache) ? config.cache
                            : angular.isObject(defaults.cache) ? defaults.cache
                            : defaultCache;
                    }

                    var cached = cache !== undefined ?
                    cache.get(config.url) !== undefined : false;

                    if (config.cached !== undefined && cached !== config.cached) {
                        return config.cached;
                    }
                    config.cached = cached;
                    return cached;
                }


                return {
                    'request': function (config) {
                        // Check to make sure this request hasn't already been cached and that
                        // the requester didn't explicitly ask us to ignore this request:
                        if (!config.ignoreLoadingBar && !isCached(config)) {
                            $rootScope.$broadcast('cfpLoadingBar:loading', {url: config.url});
                            if (reqsTotal === 0) {
                                startTimeout = $timeout(function () {
                                    cfpLoadingBar.start();
                                }, latencyThreshold);
                            }
                            reqsTotal++;
                            cfpLoadingBar.set(reqsCompleted / reqsTotal);
                        }
                        return config;
                    },

                    'response': function (response) {
                        if (!response.config.ignoreLoadingBar && !isCached(response.config)) {
                            reqsCompleted++;
                            $rootScope.$broadcast('cfpLoadingBar:loaded', {url: response.config.url, result: response});
                            if (reqsCompleted >= reqsTotal) {
                                setComplete();
                            } else {
                                cfpLoadingBar.set(reqsCompleted / reqsTotal);
                            }
                        }
                        return response;
                    },

                    'responseError': function (rejection) {
                        if (!rejection.config) {
                            $log.error('Other interceptors are not returning config object \n https://github.com/chieffancypants/angular-loading-bar/pull/50');
                        }
                        if (!rejection.config.ignoreLoadingBar && !isCached(rejection.config)) {
                            reqsCompleted++;
                            $rootScope.$broadcast('cfpLoadingBar:loaded', {
                                url: rejection.config.url,
                                result: rejection
                            });
                            if (reqsCompleted >= reqsTotal) {
                                setComplete();
                            } else {
                                cfpLoadingBar.set(reqsCompleted / reqsTotal);
                            }
                        }
                        return $q.reject(rejection);
                    }
                };
            }];

            $httpProvider.interceptors.push(interceptor);
        }]);


    /**
     * Loading Bar
     *
     * This service handles adding and removing the actual element in the DOM.
     * Generally, best practices for DOM manipulation is to take place in a
     * directive, but because the element itself is injected in the DOM only upon
     * XHR requests, and it's likely needed on every view, the best option is to
     * use a service.
     */
    angular.module('cfp.loadingBar', [])
        .provider('cfpLoadingBar', function () {

            this.includeSpinner = true;
            this.includeBar = true;
            this.latencyThreshold = 100;
            this.startSize = 0.02;
            this.parentSelector = 'body';
            this.spinnerTemplate = '<div id="loading-bar-spinner"><div class="spinner-icon"></div></div>';
            this.loadingBarTemplate = '<div id="loading-bar"><div class="bar"><div class="peg"></div></div></div>';

            this.$get = ['$injector', '$document', '$timeout', '$rootScope', function ($injector, $document, $timeout, $rootScope) {
                var $animate;
                var $parentSelector = this.parentSelector,
                    loadingBarContainer = angular.element(this.loadingBarTemplate),
                    loadingBar = loadingBarContainer.find('div').eq(0),
                    spinner = angular.element(this.spinnerTemplate);

                var incTimeout,
                    completeTimeout,
                    started = false,
                    status = 0;

                var includeSpinner = this.includeSpinner;
                var includeBar = this.includeBar;
                var startSize = this.startSize;

                /**
                 * Inserts the loading bar element into the dom, and sets it to 2%
                 */
                function _start() {
                    if (!$animate) {
                        $animate = $injector.get('$animate');
                    }

                    var $parent = $document.find($parentSelector).eq(0);
                    $timeout.cancel(completeTimeout);

                    // do not continually broadcast the started event:
                    if (started) {
                        return;
                    }

                    $rootScope.$broadcast('cfpLoadingBar:started');
                    started = true;

                    if (includeBar) {
                        $animate.enter(loadingBarContainer, $parent, angular.element($parent[0].lastChild));
                    }

                    if (includeSpinner) {
                        $animate.enter(spinner, $parent, angular.element($parent[0].lastChild));
                    }

                    _set(startSize);
                }

                /**
                 * Set the loading bar's width to a certain percent.
                 *
                 * @param n any value between 0 and 1
                 */
                function _set(n) {
                    if (!started) {
                        return;
                    }
                    var pct = (n * 100) + '%';
                    loadingBar.css('width', pct);
                    status = n;

                    // increment loadingbar to give the illusion that there is always
                    // progress but make sure to cancel the previous timeouts so we don't
                    // have multiple incs running at the same time.
                    $timeout.cancel(incTimeout);
                    incTimeout = $timeout(function () {
                        _inc();
                    }, 250);
                }

                /**
                 * Increments the loading bar by a random amount
                 * but slows down as it progresses
                 */
                function _inc() {
                    if (_status() >= 1) {
                        return;
                    }

                    var rnd = 0;

                    // TODO: do this mathmatically instead of through conditions

                    var stat = _status();
                    if (stat >= 0 && stat < 0.25) {
                        // Start out between 3 - 6% increments
                        rnd = (Math.random() * (5 - 3 + 1) + 3) / 100;
                    } else if (stat >= 0.25 && stat < 0.65) {
                        // increment between 0 - 3%
                        rnd = (Math.random() * 3) / 100;
                    } else if (stat >= 0.65 && stat < 0.9) {
                        // increment between 0 - 2%
                        rnd = (Math.random() * 2) / 100;
                    } else if (stat >= 0.9 && stat < 0.99) {
                        // finally, increment it .5 %
                        rnd = 0.005;
                    } else {
                        // after 99%, don't increment:
                        rnd = 0;
                    }

                    var pct = _status() + rnd;
                    _set(pct);
                }

                function _status() {
                    return status;
                }

                function _completeAnimation() {
                    status = 0;
                    started = false;
                }

                function _complete() {
                    if (!$animate) {
                        $animate = $injector.get('$animate');
                    }

                    $rootScope.$broadcast('cfpLoadingBar:completed');
                    _set(1);

                    $timeout.cancel(completeTimeout);

                    // Attempt to aggregate any start/complete calls within 500ms:
                    completeTimeout = $timeout(function () {
                        var promise = $animate.leave(loadingBarContainer, _completeAnimation);
                        if (promise && promise.then) {
                            promise.then(_completeAnimation);
                        }
                        $animate.leave(spinner);
                    }, 500);
                }

                return {
                    start: _start,
                    set: _set,
                    status: _status,
                    inc: _inc,
                    complete: _complete,
                    includeSpinner: this.includeSpinner,
                    latencyThreshold: this.latencyThreshold,
                    parentSelector: this.parentSelector,
                    startSize: this.startSize
                };


            }];     //
        });       // wtf javascript. srsly
})();
