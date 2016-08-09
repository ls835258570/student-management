
/**
 * angular-ui-utils - Swiss-Army-Knife of AngularJS tools (with no external dependencies!)
 * @version v0.2.2 - 2015-02-18
 * @link http://angular-ui.github.com
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
angular.module('ui.alias', []).config(['$compileProvider', 'uiAliasConfig', function($compileProvider, uiAliasConfig){
    'use strict';

    uiAliasConfig = uiAliasConfig || {};
    angular.forEach(uiAliasConfig, function(config, alias){
        if (angular.isString(config)) {
            config = {
                replace: true,
                template: config
            };
        }
        $compileProvider.directive(alias, function(){
            return config;
        });
    });
}]);

/**
 * General-purpose Event binding. Bind any event not natively supported by Angular
 * Pass an object with keynames for events to ui-event
 * Allows $event object and $params object to be passed
 *
 * @example <input ui-event="{ focus : 'counter++', blur : 'someCallback()' }">
 * @example <input ui-event="{ myCustomEvent : 'myEventHandler($event, $params)'}">
 *
 * @param ui-event {string|object literal} The event to bind to as a string or a hash of events with their callbacks
 */
angular.module('ui.event',[]).directive('uiEvent', ['$parse',
    function ($parse) {
        'use strict';

        return function ($scope, elm, attrs) {
            var events = $scope.$eval(attrs.uiEvent);
            angular.forEach(events, function (uiEvent, eventName) {
                var fn = $parse(uiEvent);
                elm.bind(eventName, function (evt) {
                    var params = Array.prototype.slice.call(arguments);
                    //Take out first paramater (event object);
                    params = params.splice(1);
                    fn($scope, {$event: evt, $params: params});
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                });
            });
        };
    }]);

/**
 * A replacement utility for internationalization very similar to sprintf.
 *
 * @param replace {mixed} The tokens to replace depends on type
 *  string: all instances of $0 will be replaced
 *  array: each instance of $0, $1, $2 etc. will be placed with each array item in corresponding order
 *  object: all attributes will be iterated through, with :key being replaced with its corresponding value
 * @return string
 *
 * @example: 'Hello :name, how are you :day'.format({ name:'John', day:'Today' })
 * @example: 'Records $0 to $1 out of $2 total'.format(['10', '20', '3000'])
 * @example: '$0 agrees to all mentions $0 makes in the event that $0 hits a tree while $0 is driving drunk'.format('Bob')
 */
angular.module('ui.format',[]).filter('format', function(){
    'use strict';

    return function(value, replace) {
        var target = value;
        if (angular.isString(target) && replace !== undefined) {
            if (!angular.isArray(replace) && !angular.isObject(replace)) {
                replace = [replace];
            }
            if (angular.isArray(replace)) {
                var rlen = replace.length;
                var rfx = function (str, i) {
                    i = parseInt(i, 10);
                    return (i >= 0 && i < rlen) ? replace[i] : str;
                };
                target = target.replace(/\$([0-9]+)/g, rfx);
            }
            else {
                angular.forEach(replace, function(value, key){
                    target = target.split(':' + key).join(value);
                });
            }
        }
        return target;
    };
});

/**
 * Wraps the
 * @param text {string} haystack to search through
 * @param search {string} needle to search for
 * @param [caseSensitive] {boolean} optional boolean to use case-sensitive searching
 */
angular.module('ui.highlight',[]).filter('highlight', function () {
    'use strict';

    return function (text, search, caseSensitive) {
        if (text && (search || angular.isNumber(search))) {
            text = text.toString();
            search = search.toString();
            if (caseSensitive) {
                return text.split(search).join('<span class="ui-match">' + search + '</span>');
            } else {
                return text.replace(new RegExp(search, 'gi'), '<span class="ui-match">$&</span>');
            }
        } else {
            return text;
        }
    };
});

// modeled after: angular-1.0.7/src/ng/directive/ngInclude.js
angular.module('ui.include',[])
    .directive('uiInclude', ['$http', '$templateCache', '$anchorScroll', '$compile',
        function($http,   $templateCache,   $anchorScroll,   $compile) {
            'use strict';

            return {
                restrict: 'ECA',
                terminal: true,
                compile: function(element, attr) {
                    var srcExp = attr.uiInclude || attr.src,
                        fragExp = attr.fragment || '',
                        onloadExp = attr.onload || '',
                        autoScrollExp = attr.autoscroll;

                    return function(scope, element) {
                        var changeCounter = 0,
                            childScope;

                        var clearContent = function() {
                            if (childScope) {
                                childScope.$destroy();
                                childScope = null;
                            }

                            element.html('');
                        };

                        function ngIncludeWatchAction() {
                            var thisChangeId = ++changeCounter;
                            var src = scope.$eval(srcExp);
                            var fragment = scope.$eval(fragExp);

                            if (src) {
                                $http.get(src, {cache: $templateCache}).success(function(response) {
                                    if (thisChangeId !== changeCounter) { return; }

                                    if (childScope) { childScope.$destroy(); }
                                    childScope = scope.$new();

                                    var contents;
                                    if (fragment) {
                                        contents = angular.element('<div/>').html(response).find(fragment);
                                    }
                                    else {
                                        contents = angular.element('<div/>').html(response).contents();
                                    }
                                    element.html(contents);
                                    $compile(contents)(childScope);

                                    if (angular.isDefined(autoScrollExp) && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                                        $anchorScroll();
                                    }

                                    childScope.$emit('$includeContentLoaded');
                                    scope.$eval(onloadExp);
                                }).error(function() {
                                    if (thisChangeId === changeCounter) { clearContent(); }
                                });
                            } else { clearContent(); }
                        }

                        scope.$watch(fragExp, ngIncludeWatchAction);
                        scope.$watch(srcExp, ngIncludeWatchAction);
                    };
                }
            };
        }]);

/**
 * Provides an easy way to toggle a checkboxes indeterminate property
 *
 * @example <input type="checkbox" ui-indeterminate="isUnkown">
 */
angular.module('ui.indeterminate',[]).directive('uiIndeterminate', [
    function () {
        'use strict';

        return {
            compile: function(tElm, tAttrs) {
                if (!tAttrs.type || tAttrs.type.toLowerCase() !== 'checkbox') {
                    return angular.noop;
                }

                return function ($scope, elm, attrs) {
                    $scope.$watch(attrs.uiIndeterminate, function(newVal) {
                        elm[0].indeterminate = !!newVal;
                    });
                };
            }
        };
    }]);

/**
 * Converts variable-esque naming conventions to something presentational, capitalized words separated by space.
 * @param {String} value The value to be parsed and prettified.
 * @param {String} [inflector] The inflector to use. Default: humanize.
 * @return {String}
 * @example {{ 'Here Is my_phoneNumber' | inflector:'humanize' }} => Here Is My Phone Number
 *          {{ 'Here Is my_phoneNumber' | inflector:'underscore' }} => here_is_my_phone_number
 *          {{ 'Here Is my_phoneNumber' | inflector:'variable' }} => hereIsMyPhoneNumber
 */
angular.module('ui.inflector',[]).filter('inflector', function () {
    'use strict';

    function tokenize(text) {
        text = text.replace(/([A-Z])|([\-|\_])/g, function(_, $1) { return ' ' + ($1 || ''); });
        return text.replace(/\s\s+/g, ' ').trim().toLowerCase().split(' ');
    }

    function capitalizeTokens(tokens) {
        var result = [];
        angular.forEach(tokens, function(token) {
            result.push(token.charAt(0).toUpperCase() + token.substr(1));
        });
        return result;
    }

    var inflectors = {
        humanize: function (value) {
            return capitalizeTokens(tokenize(value)).join(' ');
        },
        underscore: function (value) {
            return tokenize(value).join('_');
        },
        variable: function (value) {
            value = tokenize(value);
            value = value[0] + capitalizeTokens(value.slice(1)).join('');
            return value;
        }
    };

    return function (text, inflector) {
        if (inflector !== false && angular.isString(text)) {
            inflector = inflector || 'humanize';
            return inflectors[inflector](text);
        } else {
            return text;
        }
    };
});

/**
 * General-purpose jQuery wrapper. Simply pass the plugin name as the expression.
 *
 * It is possible to specify a default set of parameters for each jQuery plugin.
 * Under the jq key, namespace each plugin by that which will be passed to ui-jq.
 * Unfortunately, at this time you can only pre-define the first parameter.
 * @example { jq : { datepicker : { showOn:'click' } } }
 *
 * @param ui-jq {string} The $elm.[pluginName]() to call.
 * @param [ui-options] {mixed} Expression to be evaluated and passed as options to the function
 *     Multiple parameters can be separated by commas
 * @param [ui-refresh] {expression} Watch expression and refire plugin on changes
 *
 * @example <input ui-jq="datepicker" ui-options="{showOn:'click'},secondParameter,thirdParameter" ui-refresh="iChange">
 */
angular.module('ui.jq',[]).
    value('uiJqConfig',{}).
    directive('uiJq', ['uiJqConfig', '$timeout', function uiJqInjectingFunction(uiJqConfig, $timeout) {
        'use strict';


        return {
            restrict: 'A',
            compile: function uiJqCompilingFunction(tElm, tAttrs) {

                if (!angular.isFunction(tElm[tAttrs.uiJq])) {
                    throw new Error('ui-jq: The "' + tAttrs.uiJq + '" function does not exist');
                }
                var options = uiJqConfig && uiJqConfig[tAttrs.uiJq];

                return function uiJqLinkingFunction(scope, elm, attrs) {

                    // If change compatibility is enabled, the form input's "change" event will trigger an "input" event
                    if (attrs.ngModel && elm.is('select,input,textarea')) {
                        elm.bind('change', function() {
                            elm.trigger('input');
                        });
                    }

                    function createLinkOptions(){
                        var linkOptions = [];

                        // If ui-options are passed, merge (or override) them onto global defaults and pass to the jQuery method
                        if (attrs.uiOptions) {
                            linkOptions = scope.$eval('[' + attrs.uiOptions + ']');
                            if (angular.isObject(options) && angular.isObject(linkOptions[0])) {
                                linkOptions[0] = angular.extend({}, options, linkOptions[0]);
                            }
                        } else if (options) {
                            linkOptions = [options];
                        }
                        return linkOptions;
                    }

                    // Call jQuery method and pass relevant options
                    function callPlugin() {
                        $timeout(function() {
                            elm[attrs.uiJq].apply(elm, createLinkOptions());
                        }, 0, false);
                    }

                    // If ui-refresh is used, re-fire the the method upon every change
                    if (attrs.uiRefresh) {
                        scope.$watch(attrs.uiRefresh, function() {
                            callPlugin();
                        });
                    }
                    callPlugin();
                };
            }
        };
    }]);


/*
 Attaches input mask onto input element
 */
angular.module('ui.mask', [])
    .value('uiMaskConfig', {
        'maskDefinitions': {
            '9': /\d/,
            'A': /[a-zA-Z]/,
            '*': /[a-zA-Z0-9]/
        },
        'clearOnBlur': true
    })
    .directive('uiMask', ['uiMaskConfig', '$parse', function (maskConfig, $parse) {
        'use strict';

        return {
            priority: 100,
            require: 'ngModel',
            restrict: 'A',
            compile: function uiMaskCompilingFunction(){
                var options = maskConfig;

                return function uiMaskLinkingFunction(scope, iElement, iAttrs, controller){
                    var maskProcessed = false, eventsBound = false,
                        maskCaretMap, maskPatterns, maskPlaceholder, maskComponents,
                    // Minimum required length of the value to be considered valid
                        minRequiredLength,
                        value, valueMasked, isValid,
                    // Vars for initializing/uninitializing
                        originalPlaceholder = iAttrs.placeholder,
                        originalMaxlength = iAttrs.maxlength,
                    // Vars used exclusively in eventHandler()
                        oldValue, oldValueUnmasked, oldCaretPosition, oldSelectionLength;

                    function initialize(maskAttr){
                        if (!angular.isDefined(maskAttr)) {
                            return uninitialize();
                        }
                        processRawMask(maskAttr);
                        if (!maskProcessed) {
                            return uninitialize();
                        }
                        initializeElement();
                        bindEventListeners();
                        return true;
                    }

                    function initPlaceholder(placeholderAttr) {
                        if(! angular.isDefined(placeholderAttr)) {
                            return;
                        }

                        maskPlaceholder = placeholderAttr;

                        // If the mask is processed, then we need to update the value
                        if (maskProcessed) {
                            eventHandler();
                        }
                    }

                    function formatter(fromModelValue){
                        if (!maskProcessed) {
                            return fromModelValue;
                        }
                        value = unmaskValue(fromModelValue || '');
                        isValid = validateValue(value);
                        controller.$setValidity('mask', isValid);
                        return isValid && value.length ? maskValue(value) : undefined;
                    }

                    function parser(fromViewValue){
                        if (!maskProcessed) {
                            return fromViewValue;
                        }
                        value = unmaskValue(fromViewValue || '');
                        isValid = validateValue(value);
                        // We have to set viewValue manually as the reformatting of the input
                        // value performed by eventHandler() doesn't happen until after
                        // this parser is called, which causes what the user sees in the input
                        // to be out-of-sync with what the controller's $viewValue is set to.
                        controller.$viewValue = value.length ? maskValue(value) : '';
                        controller.$setValidity('mask', isValid);
                        if (value === '' && iAttrs.required) {
                            controller.$setValidity('required', !controller.$error.required);
                        }
                        return isValid ? value : undefined;
                    }

                    var linkOptions = {};

                    if (iAttrs.uiOptions) {
                        linkOptions = scope.$eval('[' + iAttrs.uiOptions + ']');
                        if (angular.isObject(linkOptions[0])) {
                            // we can't use angular.copy nor angular.extend, they lack the power to do a deep merge
                            linkOptions = (function(original, current){
                                for(var i in original) {
                                    if (Object.prototype.hasOwnProperty.call(original, i)) {
                                        if (current[i] === undefined) {
                                            current[i] = angular.copy(original[i]);
                                        } else {
                                            angular.extend(current[i], original[i]);
                                        }
                                    }
                                }
                                return current;
                            })(options, linkOptions[0]);
                        }
                    } else {
                        linkOptions = options;
                    }

                    iAttrs.$observe('uiMask', initialize);
                    iAttrs.$observe('placeholder', initPlaceholder);
                    var modelViewValue = false;
                    iAttrs.$observe('modelViewValue', function(val) {
                        if(val === 'true') {
                            modelViewValue = true;
                        }
                    });
                    scope.$watch(iAttrs.ngModel, function(val) {
                        if(modelViewValue && val) {
                            var model = $parse(iAttrs.ngModel);
                            model.assign(scope, controller.$viewValue);
                        }
                    });
                    controller.$formatters.push(formatter);
                    controller.$parsers.push(parser);

                    function uninitialize(){
                        maskProcessed = false;
                        unbindEventListeners();

                        if (angular.isDefined(originalPlaceholder)) {
                            iElement.attr('placeholder', originalPlaceholder);
                        } else {
                            iElement.removeAttr('placeholder');
                        }

                        if (angular.isDefined(originalMaxlength)) {
                            iElement.attr('maxlength', originalMaxlength);
                        } else {
                            iElement.removeAttr('maxlength');
                        }

                        iElement.val(controller.$modelValue);
                        controller.$viewValue = controller.$modelValue;
                        return false;
                    }

                    function initializeElement(){
                        value = oldValueUnmasked = unmaskValue(controller.$viewValue || '');
                        valueMasked = oldValue = maskValue(value);
                        isValid = validateValue(value);
                        var viewValue = isValid && value.length ? valueMasked : '';
                        if (iAttrs.maxlength) { // Double maxlength to allow pasting new val at end of mask
                            iElement.attr('maxlength', maskCaretMap[maskCaretMap.length - 1] * 2);
                        }
                        iElement.attr('placeholder', maskPlaceholder);
                        iElement.val(viewValue);
                        controller.$viewValue = viewValue;
                        // Not using $setViewValue so we don't clobber the model value and dirty the form
                        // without any kind of user interaction.
                    }

                    function bindEventListeners(){
                        if (eventsBound) {
                            return;
                        }
                        iElement.bind('blur', blurHandler);
                        iElement.bind('mousedown mouseup', mouseDownUpHandler);
                        iElement.bind('input keyup click focus', eventHandler);
                        eventsBound = true;
                    }

                    function unbindEventListeners(){
                        if (!eventsBound) {
                            return;
                        }
                        iElement.unbind('blur', blurHandler);
                        iElement.unbind('mousedown', mouseDownUpHandler);
                        iElement.unbind('mouseup', mouseDownUpHandler);
                        iElement.unbind('input', eventHandler);
                        iElement.unbind('keyup', eventHandler);
                        iElement.unbind('click', eventHandler);
                        iElement.unbind('focus', eventHandler);
                        eventsBound = false;
                    }

                    function validateValue(value){
                        // Zero-length value validity is ngRequired's determination
                        return value.length ? value.length >= minRequiredLength : true;
                    }

                    function unmaskValue(value){
                        var valueUnmasked = '',
                            maskPatternsCopy = maskPatterns.slice();
                        // Preprocess by stripping mask components from value
                        value = value.toString();
                        angular.forEach(maskComponents, function (component){
                            value = value.replace(component, '');
                        });
                        angular.forEach(value.split(''), function (chr){
                            if (maskPatternsCopy.length && maskPatternsCopy[0].test(chr)) {
                                valueUnmasked += chr;
                                maskPatternsCopy.shift();
                            }
                        });
                        return valueUnmasked;
                    }

                    function maskValue(unmaskedValue){
                        var valueMasked = '',
                            maskCaretMapCopy = maskCaretMap.slice();

                        angular.forEach(maskPlaceholder.split(''), function (chr, i){
                            if (unmaskedValue.length && i === maskCaretMapCopy[0]) {
                                valueMasked  += unmaskedValue.charAt(0) || '_';
                                unmaskedValue = unmaskedValue.substr(1);
                                maskCaretMapCopy.shift();
                            }
                            else {
                                valueMasked += chr;
                            }
                        });
                        return valueMasked;
                    }

                    function getPlaceholderChar(i) {
                        var placeholder = iAttrs.placeholder;

                        if (typeof placeholder !== 'undefined' && placeholder[i]) {
                            return placeholder[i];
                        } else {
                            return '_';
                        }
                    }

                    // Generate array of mask components that will be stripped from a masked value
                    // before processing to prevent mask components from being added to the unmasked value.
                    // E.g., a mask pattern of '+7 9999' won't have the 7 bleed into the unmasked value.
                    // If a maskable char is followed by a mask char and has a mask
                    // char behind it, we'll split it into it's own component so if
                    // a user is aggressively deleting in the input and a char ahead
                    // of the maskable char gets deleted, we'll still be able to strip
                    // it in the unmaskValue() preprocessing.
                    function getMaskComponents() {
                        return maskPlaceholder.replace(/[_]+/g, '_').replace(/([^_]+)([a-zA-Z0-9])([^_])/g, '$1$2_$3').split('_');
                    }

                    function processRawMask(mask){
                        var characterCount = 0;

                        maskCaretMap    = [];
                        maskPatterns    = [];
                        maskPlaceholder = '';

                        if (typeof mask === 'string') {
                            minRequiredLength = 0;

                            var isOptional = false,
                                splitMask  = mask.split('');

                            angular.forEach(splitMask, function (chr, i){
                                if (linkOptions.maskDefinitions[chr]) {

                                    maskCaretMap.push(characterCount);

                                    maskPlaceholder += getPlaceholderChar(i);
                                    maskPatterns.push(linkOptions.maskDefinitions[chr]);

                                    characterCount++;
                                    if (!isOptional) {
                                        minRequiredLength++;
                                    }
                                }
                                else if (chr === '?') {
                                    isOptional = true;
                                }
                                else {
                                    maskPlaceholder += chr;
                                    characterCount++;
                                }
                            });
                        }
                        // Caret position immediately following last position is valid.
                        maskCaretMap.push(maskCaretMap.slice().pop() + 1);

                        maskComponents = getMaskComponents();
                        maskProcessed  = maskCaretMap.length > 1 ? true : false;
                    }

                    function blurHandler(){
                        if (linkOptions.clearOnBlur) {
                            oldCaretPosition = 0;
                            oldSelectionLength = 0;
                            if (!isValid || value.length === 0) {
                                valueMasked = '';
                                iElement.val('');
                                scope.$apply(function () {
                                    controller.$setViewValue('');
                                });
                            }
                        }
                    }

                    function mouseDownUpHandler(e){
                        if (e.type === 'mousedown') {
                            iElement.bind('mouseout', mouseoutHandler);
                        } else {
                            iElement.unbind('mouseout', mouseoutHandler);
                        }
                    }

                    iElement.bind('mousedown mouseup', mouseDownUpHandler);

                    function mouseoutHandler(){
                        /*jshint validthis: true */
                        oldSelectionLength = getSelectionLength(this);
                        iElement.unbind('mouseout', mouseoutHandler);
                    }

                    function eventHandler(e){
                        /*jshint validthis: true */
                        e = e || {};
                        // Allows more efficient minification
                        var eventWhich = e.which,
                            eventType = e.type;

                        // Prevent shift and ctrl from mucking with old values
                        if (eventWhich === 16 || eventWhich === 91) { return;}

                        var val = iElement.val(),
                            valOld = oldValue,
                            valMasked,
                            valUnmasked = unmaskValue(val),
                            valUnmaskedOld = oldValueUnmasked,
                            valAltered = false,

                            caretPos = getCaretPosition(this) || 0,
                            caretPosOld = oldCaretPosition || 0,
                            caretPosDelta = caretPos - caretPosOld,
                            caretPosMin = maskCaretMap[0],
                            caretPosMax = maskCaretMap[valUnmasked.length] || maskCaretMap.slice().shift(),

                            selectionLenOld = oldSelectionLength || 0,
                            isSelected = getSelectionLength(this) > 0,
                            wasSelected = selectionLenOld > 0,

                        // Case: Typing a character to overwrite a selection
                            isAddition = (val.length > valOld.length) || (selectionLenOld && val.length > valOld.length - selectionLenOld),
                        // Case: Delete and backspace behave identically on a selection
                            isDeletion = (val.length < valOld.length) || (selectionLenOld && val.length === valOld.length - selectionLenOld),
                            isSelection = (eventWhich >= 37 && eventWhich <= 40) && e.shiftKey, // Arrow key codes

                            isKeyLeftArrow = eventWhich === 37,
                        // Necessary due to "input" event not providing a key code
                            isKeyBackspace = eventWhich === 8 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === -1)),
                            isKeyDelete = eventWhich === 46 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === 0 ) && !wasSelected),

                        // Handles cases where caret is moved and placed in front of invalid maskCaretMap position. Logic below
                        // ensures that, on click or leftward caret placement, caret is moved leftward until directly right of
                        // non-mask character. Also applied to click since users are (arguably) more likely to backspace
                        // a character when clicking within a filled input.
                            caretBumpBack = (isKeyLeftArrow || isKeyBackspace || eventType === 'click') && caretPos > caretPosMin;

                        oldSelectionLength = getSelectionLength(this);

                        // These events don't require any action
                        if (isSelection || (isSelected && (eventType === 'click' || eventType === 'keyup'))) {
                            return;
                        }

                        // Value Handling
                        // ==============

                        // User attempted to delete but raw value was unaffected--correct this grievous offense
                        if ((eventType === 'input') && isDeletion && !wasSelected && valUnmasked === valUnmaskedOld) {
                            while (isKeyBackspace && caretPos > caretPosMin && !isValidCaretPosition(caretPos)) {
                                caretPos--;
                            }
                            while (isKeyDelete && caretPos < caretPosMax && maskCaretMap.indexOf(caretPos) === -1) {
                                caretPos++;
                            }
                            var charIndex = maskCaretMap.indexOf(caretPos);
                            // Strip out non-mask character that user would have deleted if mask hadn't been in the way.
                            valUnmasked = valUnmasked.substring(0, charIndex) + valUnmasked.substring(charIndex + 1);
                            valAltered = true;
                        }

                        // Update values
                        valMasked = maskValue(valUnmasked);

                        oldValue = valMasked;
                        oldValueUnmasked = valUnmasked;
                        iElement.val(valMasked);
                        if (valAltered) {
                            // We've altered the raw value after it's been $digest'ed, we need to $apply the new value.
                            scope.$apply(function (){
                                controller.$setViewValue(valUnmasked);
                            });
                        }

                        // Caret Repositioning
                        // ===================

                        // Ensure that typing always places caret ahead of typed character in cases where the first char of
                        // the input is a mask char and the caret is placed at the 0 position.
                        if (isAddition && (caretPos <= caretPosMin)) {
                            caretPos = caretPosMin + 1;
                        }

                        if (caretBumpBack) {
                            caretPos--;
                        }

                        // Make sure caret is within min and max position limits
                        caretPos = caretPos > caretPosMax ? caretPosMax : caretPos < caretPosMin ? caretPosMin : caretPos;

                        // Scoot the caret back or forth until it's in a non-mask position and within min/max position limits
                        while (!isValidCaretPosition(caretPos) && caretPos > caretPosMin && caretPos < caretPosMax) {
                            caretPos += caretBumpBack ? -1 : 1;
                        }

                        if ((caretBumpBack && caretPos < caretPosMax) || (isAddition && !isValidCaretPosition(caretPosOld))) {
                            caretPos++;
                        }
                        oldCaretPosition = caretPos;
                        setCaretPosition(this, caretPos);
                    }

                    function isValidCaretPosition(pos){ return maskCaretMap.indexOf(pos) > -1; }

                    function getCaretPosition(input){
                        if (!input) return 0;
                        if (input.selectionStart !== undefined) {
                            return input.selectionStart;
                        } else if (document.selection) {
                            // Curse you IE
                            input.focus();
                            var selection = document.selection.createRange();
                            selection.moveStart('character', input.value ? -input.value.length : 0);
                            return selection.text.length;
                        }
                        return 0;
                    }

                    function setCaretPosition(input, pos){
                        if (!input) return 0;
                        if (input.offsetWidth === 0 || input.offsetHeight === 0) {
                            return; // Input's hidden
                        }
                        if (input.setSelectionRange) {
                            input.focus();
                            input.setSelectionRange(pos, pos);
                        }
                        else if (input.createTextRange) {
                            // Curse you IE
                            var range = input.createTextRange();
                            range.collapse(true);
                            range.moveEnd('character', pos);
                            range.moveStart('character', pos);
                            range.select();
                        }
                    }

                    function getSelectionLength(input){
                        if (!input) return 0;
                        if (input.selectionStart !== undefined) {
                            return (input.selectionEnd - input.selectionStart);
                        }
                        if (document.selection) {
                            return (document.selection.createRange().text.length);
                        }
                        return 0;
                    }

                    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
                    if (!Array.prototype.indexOf) {
                        Array.prototype.indexOf = function (searchElement /*, fromIndex */){
                            if (this === null) {
                                throw new TypeError();
                            }
                            var t = Object(this);
                            var len = t.length >>> 0;
                            if (len === 0) {
                                return -1;
                            }
                            var n = 0;
                            if (arguments.length > 1) {
                                n = Number(arguments[1]);
                                if (n !== n) { // shortcut for verifying if it's NaN
                                    n = 0;
                                } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                                }
                            }
                            if (n >= len) {
                                return -1;
                            }
                            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
                            for (; k < len; k++) {
                                if (k in t && t[k] === searchElement) {
                                    return k;
                                }
                            }
                            return -1;
                        };
                    }

                };
            }
        };
    }
    ]);

/**
 * Add a clear button to form inputs to reset their value
 */
angular.module('ui.reset',[]).value('uiResetConfig',null).directive('uiReset', ['uiResetConfig', function (uiResetConfig) {
    'use strict';

    var resetValue = null;
    if (uiResetConfig !== undefined){
        resetValue = uiResetConfig;
    }
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            var aElement;
            aElement = angular.element('<a class="ui-reset" />');
            elm.wrap('<span class="ui-resetwrap" />').after(aElement);
            aElement.bind('click', function (e) {
                e.preventDefault();
                scope.$apply(function () {
                    if (attrs.uiReset){
                        ctrl.$setViewValue(scope.$eval(attrs.uiReset));
                    }else{
                        ctrl.$setViewValue(resetValue);
                    }
                    ctrl.$render();
                });
            });
        }
    };
}]);

/**
 * Set a $uiRoute boolean to see if the current route matches
 */
angular.module('ui.route', []).directive('uiRoute', ['$location', '$parse', function ($location, $parse) {
    'use strict';

    return {
        restrict: 'AC',
        scope: true,
        compile: function(tElement, tAttrs) {
            var useProperty;
            if (tAttrs.uiRoute) {
                useProperty = 'uiRoute';
            } else if (tAttrs.ngHref) {
                useProperty = 'ngHref';
            } else if (tAttrs.href) {
                useProperty = 'href';
            } else {
                throw new Error('uiRoute missing a route or href property on ' + tElement[0]);
            }
            return function ($scope, elm, attrs) {
                var modelSetter = $parse(attrs.ngModel || attrs.routeModel || '$uiRoute').assign;
                var watcher = angular.noop;

                // Used by href and ngHref
                function staticWatcher(newVal) {
                    var hash = newVal.indexOf('#');
                    if (hash > -1){
                        newVal = newVal.substr(hash + 1);
                    }
                    watcher = function watchHref() {
                        modelSetter($scope, ($location.path().indexOf(newVal) > -1));
                    };
                    watcher();
                }
                // Used by uiRoute
                function regexWatcher(newVal) {
                    var hash = newVal.indexOf('#');
                    if (hash > -1){
                        newVal = newVal.substr(hash + 1);
                    }
                    watcher = function watchRegex() {
                        var regexp = new RegExp('^' + newVal + '$', ['i']);
                        modelSetter($scope, regexp.test($location.path()));
                    };
                    watcher();
                }

                switch (useProperty) {
                    case 'uiRoute':
                        // if uiRoute={{}} this will be undefined, otherwise it will have a value and $observe() never gets triggered
                        if (attrs.uiRoute){
                            regexWatcher(attrs.uiRoute);
                        }else{
                            attrs.$observe('uiRoute', regexWatcher);
                        }
                        break;
                    case 'ngHref':
                        // Setup watcher() every time ngHref changes
                        if (attrs.ngHref){
                            staticWatcher(attrs.ngHref);
                        }else{
                            attrs.$observe('ngHref', staticWatcher);
                        }
                        break;
                    case 'href':
                        // Setup watcher()
                        staticWatcher(attrs.href);
                }

                $scope.$on('$routeChangeSuccess', function(){
                    watcher();
                });

                //Added for compatibility with ui-router
                $scope.$on('$stateChangeSuccess', function(){
                    watcher();
                });
            };
        }
    };
}]);

angular.module('ui.scroll.jqlite', ['ui.scroll']).service('jqLiteExtras', [
    '$log', '$window', function(console, window) {
        'use strict';

        return {
            registerFor: function(element) {
                var convertToPx, css, getMeasurements, getStyle, getWidthHeight, isWindow, scrollTo;
                css = angular.element.prototype.css;
                element.prototype.css = function(name, value) {
                    var elem, self;
                    self = this;
                    elem = self[0];
                    if (!(!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style)) {
                        return css.call(self, name, value);
                    }
                };
                isWindow = function(obj) {
                    return obj && obj.document && obj.location && obj.alert && obj.setInterval;
                };
                scrollTo = function(self, direction, value) {
                    var elem, method, preserve, prop, _ref;
                    elem = self[0];
                    _ref = {
                        top: ['scrollTop', 'pageYOffset', 'scrollLeft'],
                        left: ['scrollLeft', 'pageXOffset', 'scrollTop']
                    }[direction], method = _ref[0], prop = _ref[1], preserve = _ref[2];
                    if (isWindow(elem)) {
                        if (angular.isDefined(value)) {
                            return elem.scrollTo(self[preserve].call(self), value);
                        } else {
                            if (prop in elem) {
                                return elem[prop];
                            } else {
                                return elem.document.documentElement[method];
                            }
                        }
                    } else {
                        if (angular.isDefined(value)) {
                            return elem[method] = value;
                        } else {
                            return elem[method];
                        }
                    }
                };
                if (window.getComputedStyle) {
                    getStyle = function(elem) {
                        return window.getComputedStyle(elem, null);
                    };
                    convertToPx = function(elem, value) {
                        return parseFloat(value);
                    };
                } else {
                    getStyle = function(elem) {
                        return elem.currentStyle;
                    };
                    convertToPx = function(elem, value) {
                        var core_pnum, left, result, rnumnonpx, rs, rsLeft, style;
                        core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
                        rnumnonpx = new RegExp('^(' + core_pnum + ')(?!px)[a-z%]+$', 'i');
                        if (!rnumnonpx.test(value)) {
                            return parseFloat(value);
                        } else {
                            style = elem.style;
                            left = style.left;
                            rs = elem.runtimeStyle;
                            rsLeft = rs && rs.left;
                            if (rs) {
                                rs.left = style.left;
                            }
                            style.left = value;
                            result = style.pixelLeft;
                            style.left = left;
                            if (rsLeft) {
                                rs.left = rsLeft;
                            }
                            return result;
                        }
                    };
                }
                getMeasurements = function(elem, measure) {
                    var base, borderA, borderB, computedMarginA, computedMarginB, computedStyle, dirA, dirB, marginA, marginB, paddingA, paddingB, _ref;
                    if (isWindow(elem)) {
                        base = document.documentElement[{
                            height: 'clientHeight',
                            width: 'clientWidth'
                        }[measure]];
                        return {
                            base: base,
                            padding: 0,
                            border: 0,
                            margin: 0
                        };
                    }
                    _ref = {
                        width: [elem.offsetWidth, 'Left', 'Right'],
                        height: [elem.offsetHeight, 'Top', 'Bottom']
                    }[measure], base = _ref[0], dirA = _ref[1], dirB = _ref[2];
                    computedStyle = getStyle(elem);
                    paddingA = convertToPx(elem, computedStyle['padding' + dirA]) || 0;
                    paddingB = convertToPx(elem, computedStyle['padding' + dirB]) || 0;
                    borderA = convertToPx(elem, computedStyle['border' + dirA + 'Width']) || 0;
                    borderB = convertToPx(elem, computedStyle['border' + dirB + 'Width']) || 0;
                    computedMarginA = computedStyle['margin' + dirA];
                    computedMarginB = computedStyle['margin' + dirB];
                    marginA = convertToPx(elem, computedMarginA) || 0;
                    marginB = convertToPx(elem, computedMarginB) || 0;
                    return {
                        base: base,
                        padding: paddingA + paddingB,
                        border: borderA + borderB,
                        margin: marginA + marginB
                    };
                };
                getWidthHeight = function(elem, direction, measure) {
                    var computedStyle, measurements, result;
                    measurements = getMeasurements(elem, direction);
                    if (measurements.base > 0) {
                        return {
                            base: measurements.base - measurements.padding - measurements.border,
                            outer: measurements.base,
                            outerfull: measurements.base + measurements.margin
                        }[measure];
                    } else {
                        computedStyle = getStyle(elem);
                        result = computedStyle[direction];
                        if (result < 0 || result === null) {
                            result = elem.style[direction] || 0;
                        }
                        result = parseFloat(result) || 0;
                        return {
                            base: result - measurements.padding - measurements.border,
                            outer: result,
                            outerfull: result + measurements.padding + measurements.border + measurements.margin
                        }[measure];
                    }
                };
                return angular.forEach({
                    before: function(newElem) {
                        var children, elem, i, parent, self, _i, _ref;
                        self = this;
                        elem = self[0];
                        parent = self.parent();
                        children = parent.contents();
                        if (children[0] === elem) {
                            return parent.prepend(newElem);
                        } else {
                            for (i = _i = 1, _ref = children.length - 1; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
                                if (children[i] === elem) {
                                    angular.element(children[i - 1]).after(newElem);
                                    return;
                                }
                            }
                            throw new Error('invalid DOM structure ' + elem.outerHTML);
                        }
                    },
                    height: function(value) {
                        var self;
                        self = this;
                        if (angular.isDefined(value)) {
                            if (angular.isNumber(value)) {
                                value = value + 'px';
                            }
                            return css.call(self, 'height', value);
                        } else {
                            return getWidthHeight(this[0], 'height', 'base');
                        }
                    },
                    outerHeight: function(option) {
                        return getWidthHeight(this[0], 'height', option ? 'outerfull' : 'outer');
                    },
                    /*
                     UIScroller no longer relies on jQuery method offset. The jQLite implementation of the method
                     is kept here just for the reference. Also the offset setter method was never implemented
                     */

                    offset: function(value) {
                        var box, doc, docElem, elem, self, win;
                        self = this;
                        if (arguments.length) {
                            if (value === void 0) {
                                return self;
                            } else {
                                throw new Error('offset setter method is not implemented');
                            }
                        }
                        box = {
                            top: 0,
                            left: 0
                        };
                        elem = self[0];
                        doc = elem && elem.ownerDocument;
                        if (!doc) {
                            return;
                        }
                        docElem = doc.documentElement;
                        if (elem.getBoundingClientRect != null) {
                            box = elem.getBoundingClientRect();
                        }
                        win = doc.defaultView || doc.parentWindow;
                        return {
                            top: box.top + (win.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
                            left: box.left + (win.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
                        };
                    },
                    scrollTop: function(value) {
                        return scrollTo(this, 'top', value);
                    },
                    scrollLeft: function(value) {
                        return scrollTo(this, 'left', value);
                    }
                }, function(value, key) {
                    if (!element.prototype[key]) {
                        return element.prototype[key] = value;
                    }
                });
            }
        };
    }
]).run([
    '$log', '$window', 'jqLiteExtras', function(console, window, jqLiteExtras) {
        'use strict';

        if (!window.jQuery) {
            return jqLiteExtras.registerFor(angular.element);
        }
    }
]);

/*
 //# sourceURL=src/scripts/ui-scroll-jqlite.js
 */


/*
 globals: angular, window

 List of used element methods available in JQuery but not in JQuery Lite

 element.before(elem)
 element.height()
 element.outerHeight(true)
 element.height(value) = only for Top/Bottom padding elements
 element.scrollTop()
 element.scrollTop(value)
 */

angular.module('ui.scroll', []).directive('uiScrollViewport', [
    '$log', function() {
        'use strict';

        return {
            controller: [
                '$scope', '$element', function(scope, element) {
                    this.viewport = element;
                    return this;
                }
            ]
        };
    }
]).directive('uiScroll', [
    '$log', '$injector', '$rootScope', '$timeout', function(console, $injector, $rootScope, $timeout) {
        'use strict';

        return {
            require: ['?^uiScrollViewport'],
            transclude: 'element',
            priority: 1000,
            terminal: true,
            compile: function(elementTemplate, attr, linker) {
                return function($scope, element, $attr, controllers) {
                    var adapter, adjustBuffer, adjustRowHeight, bof, bottomVisiblePos, buffer, bufferPadding, bufferSize, clipBottom, clipTop, datasource, datasourceName, doAdjustment, enqueueFetch, eof, eventListener, fetch, finalize, first, getValueChain, hideElementBeforeAppend, insert, isDatasource, isLoading, itemName, loading, log, match, next, pending, reload, removeFromBuffer, resizeHandler, ridActual, scrollHandler, scrollHeight, shouldLoadBottom, shouldLoadTop, showElementAfterRender, tempScope, topVisible, topVisibleElement, topVisibleItem, topVisiblePos, topVisibleScope, viewport, viewportScope, wheelHandler;
                    log = console.debug || console.log;
                    match = $attr.uiScroll.match(/^\s*(\w+)\s+in\s+([\w\.]+)\s*$/);
                    if (!match) {
                        throw new Error('Expected uiScroll in form of \'_item_ in _datasource_\' but got \'' + $attr.uiScroll + '\'');
                    }
                    itemName = match[1];
                    datasourceName = match[2];
                    isDatasource = function(datasource) {
                        return angular.isObject(datasource) && datasource.get && angular.isFunction(datasource.get);
                    };
                    getValueChain = function(targetScope, target) {
                        var chain;
                        if (!targetScope) {
                            return null;
                        }
                        chain = target.match(/^([\w]+)\.(.+)$/);
                        if (!chain || chain.length !== 3) {
                            return targetScope[target];
                        }
                        return getValueChain(targetScope[chain[1]], chain[2]);
                    };
                    datasource = getValueChain($scope, datasourceName);
                    if (!isDatasource(datasource)) {
                        datasource = $injector.get(datasourceName);
                        if (!isDatasource(datasource)) {
                            throw new Error('' + datasourceName + ' is not a valid datasource');
                        }
                    }
                    bufferSize = Math.max(3, +$attr.bufferSize || 10);
                    bufferPadding = function() {
                        return viewport.outerHeight() * Math.max(0.1, +$attr.padding || 0.1);
                    };
                    scrollHeight = function(elem) {
                        var _ref;
                        return (_ref = elem[0].scrollHeight) != null ? _ref : elem[0].document.documentElement.scrollHeight;
                    };
                    adapter = null;
                    linker(tempScope = $scope.$new(), function(template) {
                        var bottomPadding, createPadding, padding, repeaterType, topPadding, viewport;
                        repeaterType = template[0].localName;
                        if (repeaterType === 'dl') {
                            throw new Error('ui-scroll directive does not support <' + template[0].localName + '> as a repeating tag: ' + template[0].outerHTML);
                        }
                        if (repeaterType !== 'li' && repeaterType !== 'tr') {
                            repeaterType = 'div';
                        }
                        viewport = controllers[0] && controllers[0].viewport ? controllers[0].viewport : angular.element(window);
                        viewport.css({
                            'overflow-y': 'auto',
                            'display': 'block'
                        });
                        padding = function(repeaterType) {
                            var div, result, table;
                            switch (repeaterType) {
                                case 'tr':
                                    table = angular.element('<table><tr><td><div></div></td></tr></table>');
                                    div = table.find('div');
                                    result = table.find('tr');
                                    result.paddingHeight = function() {
                                        return div.height.apply(div, arguments);
                                    };
                                    return result;
                                default:
                                    result = angular.element('<' + repeaterType + '></' + repeaterType + '>');
                                    result.paddingHeight = result.height;
                                    return result;
                            }
                        };
                        createPadding = function(padding, element, direction) {
                            element[{
                                top: 'before',
                                bottom: 'after'
                            }[direction]](padding);
                            return {
                                paddingHeight: function() {
                                    return padding.paddingHeight.apply(padding, arguments);
                                },
                                insert: function(element) {
                                    return padding[{
                                        top: 'after',
                                        bottom: 'before'
                                    }[direction]](element);
                                }
                            };
                        };
                        topPadding = createPadding(padding(repeaterType), element, 'top');
                        bottomPadding = createPadding(padding(repeaterType), element, 'bottom');
                        tempScope.$destroy();
                        return adapter = {
                            viewport: viewport,
                            topPadding: topPadding.paddingHeight,
                            bottomPadding: bottomPadding.paddingHeight,
                            append: bottomPadding.insert,
                            prepend: topPadding.insert,
                            bottomDataPos: function() {
                                return scrollHeight(viewport) - bottomPadding.paddingHeight();
                            },
                            topDataPos: function() {
                                return topPadding.paddingHeight();
                            }
                        };
                    });
                    viewport = adapter.viewport;
                    viewportScope = viewport.scope() || $rootScope;
                    if (angular.isDefined($attr.topVisible)) {
                        topVisibleItem = function(item) {
                            return viewportScope[$attr.topVisible] = item;
                        };
                    }
                    if (angular.isDefined($attr.topVisibleElement)) {
                        topVisibleElement = function(element) {
                            return viewportScope[$attr.topVisibleElement] = element;
                        };
                    }
                    if (angular.isDefined($attr.topVisibleScope)) {
                        topVisibleScope = function(scope) {
                            return viewportScope[$attr.topVisibleScope] = scope;
                        };
                    }
                    topVisible = function(item) {
                        if (topVisibleItem) {
                            topVisibleItem(item.scope[itemName]);
                        }
                        if (topVisibleElement) {
                            topVisibleElement(item.element);
                        }
                        if (topVisibleScope) {
                            topVisibleScope(item.scope);
                        }
                        if (datasource.topVisible) {
                            return datasource.topVisible(item);
                        }
                    };
                    if (angular.isDefined($attr.isLoading)) {
                        loading = function(value) {
                            viewportScope[$attr.isLoading] = value;
                            if (datasource.loading) {
                                return datasource.loading(value);
                            }
                        };
                    } else {
                        loading = function(value) {
                            if (datasource.loading) {
                                return datasource.loading(value);
                            }
                        };
                    }
                    ridActual = 0;
                    first = 1;
                    next = 1;
                    buffer = [];
                    pending = [];
                    eof = false;
                    bof = false;
                    isLoading = false;
                    removeFromBuffer = function(start, stop) {
                        var i, _i;
                        for (i = _i = start; start <= stop ? _i < stop : _i > stop; i = start <= stop ? ++_i : --_i) {
                            buffer[i].scope.$destroy();
                            buffer[i].element.remove();
                        }
                        return buffer.splice(start, stop - start);
                    };
                    reload = function() {
                        ridActual++;
                        first = 1;
                        next = 1;
                        removeFromBuffer(0, buffer.length);
                        adapter.topPadding(0);
                        adapter.bottomPadding(0);
                        pending = [];
                        eof = false;
                        bof = false;
                        return adjustBuffer(ridActual, false);
                    };
                    bottomVisiblePos = function() {
                        return viewport.scrollTop() + viewport.outerHeight();
                    };
                    topVisiblePos = function() {
                        return viewport.scrollTop();
                    };
                    shouldLoadBottom = function() {
                        return !eof && adapter.bottomDataPos() < bottomVisiblePos() + bufferPadding();
                    };
                    clipBottom = function() {
                        var bottomHeight, i, item, itemHeight, itemTop, newRow, overage, rowTop, _i, _ref;
                        bottomHeight = 0;
                        overage = 0;
                        for (i = _i = _ref = buffer.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
                            item = buffer[i];
                            itemTop = item.element.offset().top;
                            newRow = rowTop !== itemTop;
                            rowTop = itemTop;
                            if (newRow) {
                                itemHeight = item.element.outerHeight(true);
                            }
                            if (adapter.bottomDataPos() - bottomHeight - itemHeight > bottomVisiblePos() + bufferPadding()) {
                                if (newRow) {
                                    bottomHeight += itemHeight;
                                }
                                overage++;
                                eof = false;
                            } else {
                                if (newRow) {
                                    break;
                                }
                                overage++;
                            }
                        }
                        if (overage > 0) {
                            adapter.bottomPadding(adapter.bottomPadding() + bottomHeight);
                            removeFromBuffer(buffer.length - overage, buffer.length);
                            next -= overage;
                            return log('clipped off bottom ' + overage + ' bottom padding ' + (adapter.bottomPadding()));
                        }
                    };
                    shouldLoadTop = function() {
                        return !bof && (adapter.topDataPos() > topVisiblePos() - bufferPadding());
                    };
                    clipTop = function() {
                        var item, itemHeight, itemTop, newRow, overage, rowTop, topHeight, _i, _len;
                        topHeight = 0;
                        overage = 0;
                        for (_i = 0, _len = buffer.length; _i < _len; _i++) {
                            item = buffer[_i];
                            itemTop = item.element.offset().top;
                            newRow = rowTop !== itemTop;
                            rowTop = itemTop;
                            if (newRow) {
                                itemHeight = item.element.outerHeight(true);
                            }
                            if (adapter.topDataPos() + topHeight + itemHeight < topVisiblePos() - bufferPadding()) {
                                if (newRow) {
                                    topHeight += itemHeight;
                                }
                                overage++;
                                bof = false;
                            } else {
                                if (newRow) {
                                    break;
                                }
                                overage++;
                            }
                        }
                        if (overage > 0) {
                            adapter.topPadding(adapter.topPadding() + topHeight);
                            removeFromBuffer(0, overage);
                            first += overage;
                            return log('clipped off top ' + overage + ' top padding ' + (adapter.topPadding()));
                        }
                    };
                    enqueueFetch = function(rid, direction, scrolling) {
                        if (!isLoading) {
                            isLoading = true;
                            loading(true);
                        }
                        if (pending.push(direction) === 1) {
                            return fetch(rid, scrolling);
                        }
                    };
                    hideElementBeforeAppend = function(element) {
                        element.displayTemp = element.css('display');
                        return element.css('display', 'none');
                    };
                    showElementAfterRender = function(element) {
                        if (element.hasOwnProperty('displayTemp')) {
                            return element.css('display', element.displayTemp);
                        }
                    };
                    insert = function(index, item) {
                        var itemScope, toBeAppended, wrapper;
                        itemScope = $scope.$new();
                        itemScope[itemName] = item;
                        toBeAppended = index > first;
                        itemScope.$index = index;
                        if (toBeAppended) {
                            itemScope.$index--;
                        }
                        wrapper = {
                            scope: itemScope
                        };
                        linker(itemScope, function(clone) {
                            wrapper.element = clone;
                            if (toBeAppended) {
                                if (index === next) {
                                    hideElementBeforeAppend(clone);
                                    adapter.append(clone);
                                    return buffer.push(wrapper);
                                } else {
                                    buffer[index - first].element.after(clone);
                                    return buffer.splice(index - first + 1, 0, wrapper);
                                }
                            } else {
                                hideElementBeforeAppend(clone);
                                adapter.prepend(clone);
                                return buffer.unshift(wrapper);
                            }
                        });
                        return {
                            appended: toBeAppended,
                            wrapper: wrapper
                        };
                    };
                    adjustRowHeight = function(appended, wrapper) {
                        var newHeight;
                        if (appended) {
                            return adapter.bottomPadding(Math.max(0, adapter.bottomPadding() - wrapper.element.outerHeight(true)));
                        } else {
                            newHeight = adapter.topPadding() - wrapper.element.outerHeight(true);
                            if (newHeight >= 0) {
                                return adapter.topPadding(newHeight);
                            } else {
                                return viewport.scrollTop(viewport.scrollTop() + wrapper.element.outerHeight(true));
                            }
                        }
                    };
                    doAdjustment = function(rid, scrolling, finalize) {
                        var item, itemHeight, itemTop, newRow, rowTop, topHeight, _i, _len, _results;
                        log('top {actual=' + (adapter.topDataPos()) + ' visible from=' + (topVisiblePos()) + ' bottom {visible through=' + (bottomVisiblePos()) + ' actual=' + (adapter.bottomDataPos()) + '}');
                        if (shouldLoadBottom()) {
                            enqueueFetch(rid, true, scrolling);
                        } else {
                            if (shouldLoadTop()) {
                                enqueueFetch(rid, false, scrolling);
                            }
                        }
                        if (finalize) {
                            finalize(rid);
                        }
                        if (pending.length === 0) {
                            topHeight = 0;
                            _results = [];
                            for (_i = 0, _len = buffer.length; _i < _len; _i++) {
                                item = buffer[_i];
                                itemTop = item.element.offset().top;
                                newRow = rowTop !== itemTop;
                                rowTop = itemTop;
                                if (newRow) {
                                    itemHeight = item.element.outerHeight(true);
                                }
                                if (newRow && (adapter.topDataPos() + topHeight + itemHeight < topVisiblePos())) {
                                    _results.push(topHeight += itemHeight);
                                } else {
                                    if (newRow) {
                                        topVisible(item);
                                    }
                                    break;
                                }
                            }
                            return _results;
                        }
                    };
                    adjustBuffer = function(rid, scrolling, newItems, finalize) {
                        if (newItems && newItems.length) {
                            return $timeout(function() {
                                var itemTop, row, rowTop, rows, _i, _j, _len, _len1;
                                rows = [];
                                for (_i = 0, _len = newItems.length; _i < _len; _i++) {
                                    row = newItems[_i];
                                    element = row.wrapper.element;
                                    showElementAfterRender(element);
                                    itemTop = element.offset().top;
                                    if (rowTop !== itemTop) {
                                        rows.push(row);
                                        rowTop = itemTop;
                                    }
                                }
                                for (_j = 0, _len1 = rows.length; _j < _len1; _j++) {
                                    row = rows[_j];
                                    adjustRowHeight(row.appended, row.wrapper);
                                }
                                return doAdjustment(rid, scrolling, finalize);
                            });
                        } else {
                            return doAdjustment(rid, scrolling, finalize);
                        }
                    };
                    finalize = function(rid, scrolling, newItems) {
                        return adjustBuffer(rid, scrolling, newItems, function() {
                            pending.shift();
                            if (pending.length === 0) {
                                isLoading = false;
                                return loading(false);
                            } else {
                                return fetch(rid, scrolling);
                            }
                        });
                    };
                    fetch = function(rid, scrolling) {
                        var direction;
                        direction = pending[0];
                        if (direction) {
                            if (buffer.length && !shouldLoadBottom()) {
                                return finalize(rid, scrolling);
                            } else {
                                return datasource.get(next, bufferSize, function(result) {
                                    var item, newItems, _i, _len;
                                    if (rid && rid !== ridActual) {
                                        return;
                                    }
                                    newItems = [];
                                    if (result.length < bufferSize) {
                                        eof = true;
                                        adapter.bottomPadding(0);
                                    }
                                    if (result.length > 0) {
                                        clipTop();
                                        for (_i = 0, _len = result.length; _i < _len; _i++) {
                                            item = result[_i];
                                            newItems.push(insert(++next, item));
                                        }
                                    }
                                    return finalize(rid, scrolling, newItems);
                                });
                            }
                        } else {
                            if (buffer.length && !shouldLoadTop()) {
                                return finalize(rid, scrolling);
                            } else {
                                return datasource.get(first - bufferSize, bufferSize, function(result) {
                                    var i, newItems, _i, _ref;
                                    if (rid && rid !== ridActual) {
                                        return;
                                    }
                                    newItems = [];
                                    if (result.length < bufferSize) {
                                        bof = true;
                                        adapter.topPadding(0);
                                    }
                                    if (result.length > 0) {
                                        if (buffer.length) {
                                            clipBottom();
                                        }
                                        for (i = _i = _ref = result.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
                                            newItems.unshift(insert(--first, result[i]));
                                        }
                                    }
                                    return finalize(rid, scrolling, newItems);
                                });
                            }
                        }
                    };
                    resizeHandler = function() {
                        if (!$rootScope.$$phase && !isLoading) {
                            adjustBuffer(null, false);
                            return $scope.$apply();
                        }
                    };
                    viewport.bind('resize', resizeHandler);
                    scrollHandler = function() {
                        if (!$rootScope.$$phase && !isLoading) {
                            adjustBuffer(null, true);
                            return $scope.$apply();
                        }
                    };
                    viewport.bind('scroll', scrollHandler);
                    wheelHandler = function(event) {
                        var scrollTop, yMax;
                        scrollTop = viewport[0].scrollTop;
                        yMax = viewport[0].scrollHeight - viewport[0].clientHeight;
                        if ((scrollTop === 0 && !bof) || (scrollTop === yMax && !eof)) {
                            return event.preventDefault();
                        }
                    };
                    viewport.bind('mousewheel', wheelHandler);
                    $scope.$watch(datasource.revision, function() {
                        return reload();
                    });
                    if (datasource.scope) {
                        eventListener = datasource.scope.$new();
                    } else {
                        eventListener = $scope.$new();
                    }
                    $scope.$on('$destroy', function() {
                        eventListener.$destroy();
                        viewport.unbind('resize', resizeHandler);
                        viewport.unbind('scroll', scrollHandler);
                        return viewport.unbind('mousewheel', wheelHandler);
                    });
                    eventListener.$on('update.items', function(event, locator, newItem) {
                        var wrapper, _fn, _i, _len, _ref;
                        if (angular.isFunction(locator)) {
                            _fn = function(wrapper) {
                                return locator(wrapper.scope);
                            };
                            for (_i = 0, _len = buffer.length; _i < _len; _i++) {
                                wrapper = buffer[_i];
                                _fn(wrapper);
                            }
                        } else {
                            if ((0 <= (_ref = locator - first - 1) && _ref < buffer.length)) {
                                buffer[locator - first - 1].scope[itemName] = newItem;
                            }
                        }
                        return null;
                    });
                    eventListener.$on('delete.items', function(event, locator) {
                        var i, item, temp, wrapper, _fn, _i, _j, _k, _len, _len1, _len2, _ref;
                        if (angular.isFunction(locator)) {
                            temp = [];
                            for (_i = 0, _len = buffer.length; _i < _len; _i++) {
                                item = buffer[_i];
                                temp.unshift(item);
                            }
                            _fn = function(wrapper) {
                                if (locator(wrapper.scope)) {
                                    removeFromBuffer(temp.length - 1 - i, temp.length - i);
                                    return next--;
                                }
                            };
                            for (i = _j = 0, _len1 = temp.length; _j < _len1; i = ++_j) {
                                wrapper = temp[i];
                                _fn(wrapper);
                            }
                        } else {
                            if ((0 <= (_ref = locator - first - 1) && _ref < buffer.length)) {
                                removeFromBuffer(locator - first - 1, locator - first);
                                next--;
                            }
                        }
                        for (i = _k = 0, _len2 = buffer.length; _k < _len2; i = ++_k) {
                            item = buffer[i];
                            item.scope.$index = first + i;
                        }
                        return adjustBuffer(null, false);
                    });
                    return eventListener.$on('insert.item', function(event, locator, item) {
                        var i, inserted, _i, _len, _ref;
                        inserted = [];
                        if (angular.isFunction(locator)) {
                            throw new Error('not implemented - Insert with locator function');
                        } else {
                            if ((0 <= (_ref = locator - first - 1) && _ref < buffer.length)) {
                                inserted.push(insert(locator, item));
                                next++;
                            }
                        }
                        for (i = _i = 0, _len = buffer.length; _i < _len; i = ++_i) {
                            item = buffer[i];
                            item.scope.$index = first + i;
                        }
                        return adjustBuffer(null, false, inserted);
                    });
                };
            }
        };
    }
]);

/*
 //# sourceURL=src/scripts/ui-scroll.js
 */


/**
 * Adds a 'ui-scrollfix' class to the element when the page scrolls past it's position.
 * @param [offset] {int} optional Y-offset to override the detected offset.
 *   Takes 300 (absolute) or -300 or +300 (relative to detected)
 */
angular.module('ui.scrollfix',[]).directive('uiScrollfix', ['$window', function ($window) {
    'use strict';

    function getWindowScrollTop() {
        if (angular.isDefined($window.pageYOffset)) {
            return $window.pageYOffset;
        } else {
            var iebody = (document.compatMode && document.compatMode !== 'BackCompat') ? document.documentElement : document.body;
            return iebody.scrollTop;
        }
    }
    return {
        require: '^?uiScrollfixTarget',
        link: function (scope, elm, attrs, uiScrollfixTarget) {
            var absolute = true,
                shift = 0,
                fixLimit,
                $target = uiScrollfixTarget && uiScrollfixTarget.$element || angular.element($window);

            if (!attrs.uiScrollfix) {
                absolute = false;
            } else if (typeof(attrs.uiScrollfix) === 'string') {
                // charAt is generally faster than indexOf: http://jsperf.com/indexof-vs-charat
                if (attrs.uiScrollfix.charAt(0) === '-') {
                    absolute = false;
                    shift = - parseFloat(attrs.uiScrollfix.substr(1));
                } else if (attrs.uiScrollfix.charAt(0) === '+') {
                    absolute = false;
                    shift = parseFloat(attrs.uiScrollfix.substr(1));
                }
            }

            fixLimit = absolute ? attrs.uiScrollfix : elm[0].offsetTop + shift;

            function onScroll() {

                var limit = absolute ? attrs.uiScrollfix : elm[0].offsetTop + shift;

                // if pageYOffset is defined use it, otherwise use other crap for IE
                var offset = uiScrollfixTarget ? $target[0].scrollTop : getWindowScrollTop();
                if (!elm.hasClass('ui-scrollfix') && offset > limit) {
                    elm.addClass('ui-scrollfix');
                    fixLimit = limit;
                } else if (elm.hasClass('ui-scrollfix') && offset < fixLimit) {
                    elm.removeClass('ui-scrollfix');
                }
            }

            $target.on('scroll', onScroll);

            // Unbind scroll event handler when directive is removed
            scope.$on('$destroy', function() {
                $target.off('scroll', onScroll);
            });
        }
    };
}]).directive('uiScrollfixTarget', [function () {
    'use strict';
    return {
        controller: ['$element', function($element) {
            this.$element = $element;
        }]
    };
}]);

/**
 * uiShow Directive
 *
 * Adds a 'ui-show' class to the element instead of display:block
 * Created to allow tighter control  of CSS without bulkier directives
 *
 * @param expression {boolean} evaluated expression to determine if the class should be added
 */
angular.module('ui.showhide',[])
    .directive('uiShow', [function () {
        'use strict';

        return function (scope, elm, attrs) {
            scope.$watch(attrs.uiShow, function (newVal) {
                if (newVal) {
                    elm.addClass('ui-show');
                } else {
                    elm.removeClass('ui-show');
                }
            });
        };
    }])

/**
 * uiHide Directive
 *
 * Adds a 'ui-hide' class to the element instead of display:block
 * Created to allow tighter control  of CSS without bulkier directives
 *
 * @param expression {boolean} evaluated expression to determine if the class should be added
 */
    .directive('uiHide', [function () {
        'use strict';

        return function (scope, elm, attrs) {
            scope.$watch(attrs.uiHide, function (newVal) {
                if (newVal) {
                    elm.addClass('ui-hide');
                } else {
                    elm.removeClass('ui-hide');
                }
            });
        };
    }])

/**
 * uiToggle Directive
 *
 * Adds a class 'ui-show' if true, and a 'ui-hide' if false to the element instead of display:block/display:none
 * Created to allow tighter control  of CSS without bulkier directives. This also allows you to override the
 * default visibility of the element using either class.
 *
 * @param expression {boolean} evaluated expression to determine if the class should be added
 */
    .directive('uiToggle', [function () {
        'use strict';

        return function (scope, elm, attrs) {
            scope.$watch(attrs.uiToggle, function (newVal) {
                if (newVal) {
                    elm.removeClass('ui-hide').addClass('ui-show');
                } else {
                    elm.removeClass('ui-show').addClass('ui-hide');
                }
            });
        };
    }]);

/**
 * Filters out all duplicate items from an array by checking the specified key
 * @param [key] {string} the name of the attribute of each object to compare for uniqueness
 if the key is empty, the entire object will be compared
 if the key === false then no filtering will be performed
 * @return {array}
 */
angular.module('ui.unique',[]).filter('unique', ['$parse', function ($parse) {
    'use strict';

    return function (items, filterOn) {

        if (filterOn === false) {
            return items;
        }

        if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
            var newItems = [],
                get = angular.isString(filterOn) ? $parse(filterOn) : function (item) { return item; };

            var extractValueToCompare = function (item) {
                return angular.isObject(item) ? get(item) : item;
            };

            angular.forEach(items, function (item) {
                var isDuplicate = false;

                for (var i = 0; i < newItems.length; i++) {
                    if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    newItems.push(item);
                }

            });
            items = newItems;
        }
        return items;
    };
}]);

/*
 * Author: Remy Alain Ticona Carbajal http://realtica.org
 * Description: The main objective of ng-uploader is to have a user control,
 * clean, simple, customizable, and above all very easy to implement.
 * Licence: MIT
 */

angular.module('ui.uploader', []).service('uiUploader', uiUploader);

uiUploader.$inject = ['$log'];

function uiUploader($log) {
    'use strict';

    /*jshint validthis: true */
    var self = this;
    self.files = [];
    self.options = {};
    self.activeUploads = 0;
    $log.info('uiUploader loaded');

    function addFiles(files) {
        for (var i = 0; i < files.length; i++) {
            self.files.push(files[i]);
        }
    }

    function getFiles() {
        return self.files;
    }

    function startUpload(options) {
        self.options = options;
        for (var i = 0; i < self.files.length; i++) {
            if (self.activeUploads == self.options.concurrency) {
                break;
            }
            if (self.files[i].active)
                continue;
            ajaxUpload(self.files[i], self.options.url);
        }
    }

    function removeFile(file){
        self.files.splice(self.files.indexOf(file),1);
    }

    function removeAll(){
        self.files.splice(0,self.files.length);
    }

    return {
        addFiles: addFiles,
        getFiles: getFiles,
        files: self.files,
        startUpload: startUpload,
        removeFile: removeFile,
        removeAll:removeAll
    };

    function getHumanSize(bytes) {
        var sizes = ['n/a', 'bytes', 'KiB', 'MiB', 'GiB', 'TB', 'PB', 'EiB', 'ZiB', 'YiB'];
        var i = +Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + sizes[isNaN(bytes) ? 0 : i + 1];
    }

    function ajaxUpload(file, url) {
        var xhr, formData, prop, data = '',
            key = '' || 'file';
        self.activeUploads += 1;
        file.active = true;
        xhr = new window.XMLHttpRequest();
        formData = new window.FormData();
        xhr.open('POST', url);

        // Triggered when upload starts:
        xhr.upload.onloadstart = function() {};

        // Triggered many times during upload:
        xhr.upload.onprogress = function(event) {
            if (!event.lengthComputable) {
                return;
            }
            // Update file size because it might be bigger than reported by
            // the fileSize:
            //$log.info("progres..");
            //console.info(event.loaded);
            file.loaded = event.loaded;
            file.humanSize = getHumanSize(event.loaded);
            self.options.onProgress(file);
        };

        // Triggered when upload is completed:
        xhr.onload = function() {
            self.activeUploads -= 1;
            startUpload(self.options);
            self.options.onCompleted(file, xhr.responseText);
        };

        // Triggered when upload fails:
        xhr.onerror = function() {};

        // Append additional data if provided:
        if (data) {
            for (prop in data) {
                if (data.hasOwnProperty(prop)) {
                    formData.append(prop, data[prop]);
                }
            }
        }

        // Append file data:
        formData.append(key, file, file.name);

        // Initiate upload:
        xhr.send(formData);

        return xhr;
    }

}

/**
 * General-purpose validator for ngModel.
 * angular.js comes with several built-in validation mechanism for input fields (ngRequired, ngPattern etc.) but using
 * an arbitrary validation function requires creation of a custom formatters and / or parsers.
 * The ui-validate directive makes it easy to use any function(s) defined in scope as a validator function(s).
 * A validator function will trigger validation on both model and input changes.
 *
 * @example <input ui-validate=" 'myValidatorFunction($value)' ">
 * @example <input ui-validate="{ foo : '$value > anotherModel', bar : 'validateFoo($value)' }">
 * @example <input ui-validate="{ foo : '$value > anotherModel' }" ui-validate-watch=" 'anotherModel' ">
 * @example <input ui-validate="{ foo : '$value > anotherModel', bar : 'validateFoo($value)' }" ui-validate-watch=" { foo : 'anotherModel' } ">
 *
 * @param ui-validate {string|object literal} If strings is passed it should be a scope's function to be used as a validator.
 * If an object literal is passed a key denotes a validation error key while a value should be a validator function.
 * In both cases validator function should take a value to validate as its argument and should return true/false indicating a validation result.
 */
angular.module('ui.validate',[]).directive('uiValidate', function () {
    'use strict';

    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            var validateFn, validators = {},
                validateExpr = scope.$eval(attrs.uiValidate);

            if (!validateExpr){ return;}

            if (angular.isString(validateExpr)) {
                validateExpr = { validator: validateExpr };
            }

            angular.forEach(validateExpr, function (exprssn, key) {
                validateFn = function (valueToValidate) {
                    var expression = scope.$eval(exprssn, { '$value' : valueToValidate });
                    if (angular.isObject(expression) && angular.isFunction(expression.then)) {
                        // expression is a promise
                        expression.then(function(){
                            ctrl.$setValidity(key, true);
                        }, function(){
                            ctrl.$setValidity(key, false);
                        });
                        return valueToValidate;
                    } else if (expression) {
                        // expression is true
                        ctrl.$setValidity(key, true);
                        return valueToValidate;
                    } else {
                        // expression is false
                        ctrl.$setValidity(key, false);
                        return valueToValidate;
                    }
                };
                validators[key] = validateFn;
                ctrl.$formatters.push(validateFn);
                ctrl.$parsers.push(validateFn);
            });

            function apply_watch(watch)
            {
                //string - update all validators on expression change
                if (angular.isString(watch))
                {
                    scope.$watch(watch, function(){
                        angular.forEach(validators, function(validatorFn){
                            validatorFn(ctrl.$modelValue);
                        });
                    });
                    return;
                }

                //array - update all validators on change of any expression
                if (angular.isArray(watch))
                {
                    angular.forEach(watch, function(expression){
                        scope.$watch(expression, function()
                        {
                            angular.forEach(validators, function(validatorFn){
                                validatorFn(ctrl.$modelValue);
                            });
                        });
                    });
                    return;
                }

                //object - update appropriate validator
                if (angular.isObject(watch))
                {
                    angular.forEach(watch, function(expression, validatorKey)
                    {
                        //value is string - look after one expression
                        if (angular.isString(expression))
                        {
                            scope.$watch(expression, function(){
                                validators[validatorKey](ctrl.$modelValue);
                            });
                        }

                        //value is array - look after all expressions in array
                        if (angular.isArray(expression))
                        {
                            angular.forEach(expression, function(intExpression)
                            {
                                scope.$watch(intExpression, function(){
                                    validators[validatorKey](ctrl.$modelValue);
                                });
                            });
                        }
                    });
                }
            }
            // Support for ui-validate-watch
            if (attrs.uiValidateWatch){
                apply_watch( scope.$eval(attrs.uiValidateWatch) );
            }
        }
    };
});

angular.module('ui.utils',  [
    'ui.event',
    'ui.format',
    'ui.highlight',
    'ui.include',
    'ui.indeterminate',
    'ui.inflector',
    'ui.jq',
    'ui.mask',
    'ui.reset',
    'ui.route',
    'ui.scrollfix',
    'ui.scroll',
    'ui.scroll.jqlite',
    'ui.showhide',
    'ui.unique',
    'ui.validate'
]);



/*
 * angular-ui-bootstrap
 * http://angular-ui.github.io/bootstrap/

 * Version: 0.12.1 - 2015-02-20
 * License: MIT
 */
angular.module("ui.bootstrap", ["ui.bootstrap.tpls", "ui.bootstrap.transition","ui.bootstrap.collapse","ui.bootstrap.accordion","ui.bootstrap.alert","ui.bootstrap.bindHtml","ui.bootstrap.buttons","ui.bootstrap.carousel","ui.bootstrap.dateparser","ui.bootstrap.position","ui.bootstrap.datepicker","ui.bootstrap.dropdown","ui.bootstrap.modal","ui.bootstrap.pagination","ui.bootstrap.tooltip","ui.bootstrap.popover","ui.bootstrap.progressbar","ui.bootstrap.rating","ui.bootstrap.tabs","ui.bootstrap.timepicker","ui.bootstrap.typeahead"]);
angular.module("ui.bootstrap.tpls", ["template/accordion/accordion-group.html","template/accordion/accordion.html","template/alert/alert.html","template/carousel/carousel.html","template/carousel/slide.html","template/datepicker/datepicker.html","template/datepicker/day.html","template/datepicker/month.html","template/datepicker/popup.html","template/datepicker/year.html","template/modal/backdrop.html","template/modal/window.html","template/pagination/pager.html","template/pagination/pagination.html","template/tooltip/tooltip-html-unsafe-popup.html","template/tooltip/tooltip-popup.html","template/popover/popover.html","template/progressbar/bar.html","template/progressbar/progress.html","template/progressbar/progressbar.html","template/rating/rating.html","template/tabs/tab.html","template/tabs/tabset.html","template/timepicker/timepicker.html","template/typeahead/typeahead-match.html","template/typeahead/typeahead-popup.html"]);
angular.module('ui.bootstrap.transition', [])

/**
 * $transition service provides a consistent interface to trigger CSS 3 transitions and to be informed when they complete.
 * @param  {DOMElement} element  The DOMElement that will be animated.
 * @param  {string|object|function} trigger  The thing that will cause the transition to start:
 *   - As a string, it represents the css class to be added to the element.
 *   - As an object, it represents a hash of style attributes to be applied to the element.
 *   - As a function, it represents a function to be called that will cause the transition to occur.
 * @return {Promise}  A promise that is resolved when the transition finishes.
 */
    .factory('$transition', ['$q', '$timeout', '$rootScope', function($q, $timeout, $rootScope) {

        var $transition = function(element, trigger, options) {
            options = options || {};
            var deferred = $q.defer();
            var endEventName = $transition[options.animation ? 'animationEndEventName' : 'transitionEndEventName'];

            var transitionEndHandler = function(event) {
                $rootScope.$apply(function() {
                    element.unbind(endEventName, transitionEndHandler);
                    deferred.resolve(element);
                });
            };

            if (endEventName) {
                element.bind(endEventName, transitionEndHandler);
            }

            // Wrap in a timeout to allow the browser time to update the DOM before the transition is to occur
            $timeout(function() {
                if ( angular.isString(trigger) ) {
                    element.addClass(trigger);
                } else if ( angular.isFunction(trigger) ) {
                    trigger(element);
                } else if ( angular.isObject(trigger) ) {
                    element.css(trigger);
                }
                //If browser does not support transitions, instantly resolve
                if ( !endEventName ) {
                    deferred.resolve(element);
                }
            });

            // Add our custom cancel function to the promise that is returned
            // We can call this if we are about to run a new transition, which we know will prevent this transition from ending,
            // i.e. it will therefore never raise a transitionEnd event for that transition
            deferred.promise.cancel = function() {
                if ( endEventName ) {
                    element.unbind(endEventName, transitionEndHandler);
                }
                deferred.reject('Transition cancelled');
            };

            return deferred.promise;
        };

        // Work out the name of the transitionEnd event
        var transElement = document.createElement('trans');
        var transitionEndEventNames = {
            'WebkitTransition': 'webkitTransitionEnd',
            'MozTransition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'transition': 'transitionend'
        };
        var animationEndEventNames = {
            'WebkitTransition': 'webkitAnimationEnd',
            'MozTransition': 'animationend',
            'OTransition': 'oAnimationEnd',
            'transition': 'animationend'
        };
        function findEndEventName(endEventNames) {
            for (var name in endEventNames){
                if (transElement.style[name] !== undefined) {
                    return endEventNames[name];
                }
            }
        }
        $transition.transitionEndEventName = findEndEventName(transitionEndEventNames);
        $transition.animationEndEventName = findEndEventName(animationEndEventNames);
        return $transition;
    }]);

angular.module('ui.bootstrap.collapse', ['ui.bootstrap.transition'])

    .directive('collapse', ['$transition', function ($transition) {

        return {
            link: function (scope, element, attrs) {

                var initialAnimSkip = true;
                var currentTransition;

                function doTransition(change) {
                    var newTransition = $transition(element, change);
                    if (currentTransition) {
                        currentTransition.cancel();
                    }
                    currentTransition = newTransition;
                    newTransition.then(newTransitionDone, newTransitionDone);
                    return newTransition;

                    function newTransitionDone() {
                        // Make sure it's this transition, otherwise, leave it alone.
                        if (currentTransition === newTransition) {
                            currentTransition = undefined;
                        }
                    }
                }

                function expand() {
                    if (initialAnimSkip) {
                        initialAnimSkip = false;
                        expandDone();
                    } else {
                        element.removeClass('collapse').addClass('collapsing');
                        doTransition({ height: element[0].scrollHeight + 'px' }).then(expandDone);
                    }
                }

                function expandDone() {
                    element.removeClass('collapsing');
                    element.addClass('collapse in');
                    element.css({height: 'auto'});
                }

                function collapse() {
                    if (initialAnimSkip) {
                        initialAnimSkip = false;
                        collapseDone();
                        element.css({height: 0});
                    } else {
                        // CSS transitions don't work with height: auto, so we have to manually change the height to a specific value
                        element.css({ height: element[0].scrollHeight + 'px' });
                        //trigger reflow so a browser realizes that height was updated from auto to a specific value
                        var x = element[0].offsetWidth;

                        element.removeClass('collapse in').addClass('collapsing');

                        doTransition({ height: 0 }).then(collapseDone);
                    }
                }

                function collapseDone() {
                    element.removeClass('collapsing');
                    element.addClass('collapse');
                }

                scope.$watch(attrs.collapse, function (shouldCollapse) {
                    if (shouldCollapse) {
                        collapse();
                    } else {
                        expand();
                    }
                });
            }
        };
    }]);

angular.module('ui.bootstrap.accordion', ['ui.bootstrap.collapse'])

    .constant('accordionConfig', {
        closeOthers: true
    })

    .controller('AccordionController', ['$scope', '$attrs', 'accordionConfig', function ($scope, $attrs, accordionConfig) {

        // This array keeps track of the accordion groups
        this.groups = [];

        // Ensure that all the groups in this accordion are closed, unless close-others explicitly says not to
        this.closeOthers = function(openGroup) {
            var closeOthers = angular.isDefined($attrs.closeOthers) ? $scope.$eval($attrs.closeOthers) : accordionConfig.closeOthers;
            if ( closeOthers ) {
                angular.forEach(this.groups, function (group) {
                    if ( group !== openGroup ) {
                        group.isOpen = false;
                    }
                });
            }
        };

        // This is called from the accordion-group directive to add itself to the accordion
        this.addGroup = function(groupScope) {
            var that = this;
            this.groups.push(groupScope);

            groupScope.$on('$destroy', function (event) {
                that.removeGroup(groupScope);
            });
        };

        // This is called from the accordion-group directive when to remove itself
        this.removeGroup = function(group) {
            var index = this.groups.indexOf(group);
            if ( index !== -1 ) {
                this.groups.splice(index, 1);
            }
        };

    }])

// The accordion directive simply sets up the directive controller
// and adds an accordion CSS class to itself element.
    .directive('accordion', function () {
        return {
            restrict:'EA',
            controller:'AccordionController',
            transclude: true,
            replace: false,
            templateUrl: 'template/accordion/accordion.html'
        };
    })

// The accordion-group directive indicates a block of html that will expand and collapse in an accordion
    .directive('accordionGroup', function() {
        return {
            require:'^accordion',         // We need this directive to be inside an accordion
            restrict:'EA',
            transclude:true,              // It transcludes the contents of the directive into the template
            replace: true,                // The element containing the directive will be replaced with the template
            templateUrl:'template/accordion/accordion-group.html',
            scope: {
                heading: '@',               // Interpolate the heading attribute onto this scope
                isOpen: '=?',
                isDisabled: '=?'
            },
            controller: function() {
                this.setHeading = function(element) {
                    this.heading = element;
                };
            },
            link: function(scope, element, attrs, accordionCtrl) {
                accordionCtrl.addGroup(scope);

                scope.$watch('isOpen', function(value) {
                    if ( value ) {
                        accordionCtrl.closeOthers(scope);
                    }
                });

                scope.toggleOpen = function() {
                    if ( !scope.isDisabled ) {
                        scope.isOpen = !scope.isOpen;
                    }
                };
            }
        };
    })

// Use accordion-heading below an accordion-group to provide a heading containing HTML
// <accordion-group>
//   <accordion-heading>Heading containing HTML - <img src="..."></accordion-heading>
// </accordion-group>
    .directive('accordionHeading', function() {
        return {
            restrict: 'EA',
            transclude: true,   // Grab the contents to be used as the heading
            template: '',       // In effect remove this element!
            replace: true,
            require: '^accordionGroup',
            link: function(scope, element, attr, accordionGroupCtrl, transclude) {
                // Pass the heading to the accordion-group controller
                // so that it can be transcluded into the right place in the template
                // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
                accordionGroupCtrl.setHeading(transclude(scope, function() {}));
            }
        };
    })

// Use in the accordion-group template to indicate where you want the heading to be transcluded
// You must provide the property on the accordion-group controller that will hold the transcluded element
// <div class="accordion-group">
//   <div class="accordion-heading" ><a ... accordion-transclude="heading">...</a></div>
//   ...
// </div>
    .directive('accordionTransclude', function() {
        return {
            require: '^accordionGroup',
            link: function(scope, element, attr, controller) {
                scope.$watch(function() { return controller[attr.accordionTransclude]; }, function(heading) {
                    if ( heading ) {
                        element.html('');
                        element.append(heading);
                    }
                });
            }
        };
    });

angular.module('ui.bootstrap.alert', [])

    .controller('AlertController', ['$scope', '$attrs', function ($scope, $attrs) {
        $scope.closeable = 'close' in $attrs;
        this.close = $scope.close;
    }])

    .directive('alert', function () {
        return {
            restrict:'EA',
            controller:'AlertController',
            templateUrl:'template/alert/alert.html',
            transclude:true,
            replace:true,
            scope: {
                type: '@',
                close: '&'
            }
        };
    })

    .directive('dismissOnTimeout', ['$timeout', function($timeout) {
        return {
            require: 'alert',
            link: function(scope, element, attrs, alertCtrl) {
                $timeout(function(){
                    alertCtrl.close();
                }, parseInt(attrs.dismissOnTimeout, 10));
            }
        };
    }]);

angular.module('ui.bootstrap.bindHtml', [])

    .directive('bindHtmlUnsafe', function () {
        return function (scope, element, attr) {
            element.addClass('ng-binding').data('$binding', attr.bindHtmlUnsafe);
            scope.$watch(attr.bindHtmlUnsafe, function bindHtmlUnsafeWatchAction(value) {
                element.html(value || '');
            });
        };
    });
angular.module('ui.bootstrap.buttons', [])

    .constant('buttonConfig', {
        activeClass: 'active',
        toggleEvent: 'click'
    })

    .controller('ButtonsController', ['buttonConfig', function(buttonConfig) {
        this.activeClass = buttonConfig.activeClass || 'active';
        this.toggleEvent = buttonConfig.toggleEvent || 'click';
    }])

    .directive('btnRadio', function () {
        return {
            require: ['btnRadio', 'ngModel'],
            controller: 'ButtonsController',
            link: function (scope, element, attrs, ctrls) {
                var buttonsCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                //model -> UI
                ngModelCtrl.$render = function () {
                    element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, scope.$eval(attrs.btnRadio)));
                };

                //ui->model
                element.bind(buttonsCtrl.toggleEvent, function () {
                    var isActive = element.hasClass(buttonsCtrl.activeClass);

                    if (!isActive || angular.isDefined(attrs.uncheckable)) {
                        scope.$apply(function () {
                            ngModelCtrl.$setViewValue(isActive ? null : scope.$eval(attrs.btnRadio));
                            ngModelCtrl.$render();
                        });
                    }
                });
            }
        };
    })

    .directive('btnCheckbox', function () {
        return {
            require: ['btnCheckbox', 'ngModel'],
            controller: 'ButtonsController',
            link: function (scope, element, attrs, ctrls) {
                var buttonsCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                function getTrueValue() {
                    return getCheckboxValue(attrs.btnCheckboxTrue, true);
                }

                function getFalseValue() {
                    return getCheckboxValue(attrs.btnCheckboxFalse, false);
                }

                function getCheckboxValue(attributeValue, defaultValue) {
                    var val = scope.$eval(attributeValue);
                    return angular.isDefined(val) ? val : defaultValue;
                }

                //model -> UI
                ngModelCtrl.$render = function () {
                    element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, getTrueValue()));
                };

                //ui->model
                element.bind(buttonsCtrl.toggleEvent, function () {
                    scope.$apply(function () {
                        ngModelCtrl.$setViewValue(element.hasClass(buttonsCtrl.activeClass) ? getFalseValue() : getTrueValue());
                        ngModelCtrl.$render();
                    });
                });
            }
        };
    });

/**
 * @ngdoc overview
 * @name ui.bootstrap.carousel
 *
 * @description
 * AngularJS version of an image carousel.
 *
 */
angular.module('ui.bootstrap.carousel', ['ui.bootstrap.transition'])
    .controller('CarouselController', ['$scope', '$timeout', '$interval', '$transition', function ($scope, $timeout, $interval, $transition) {
        var self = this,
            slides = self.slides = $scope.slides = [],
            currentIndex = -1,
            currentInterval, isPlaying;
        self.currentSlide = null;

        var destroyed = false;
        /* direction: "prev" or "next" */
        self.select = $scope.select = function(nextSlide, direction) {
            var nextIndex = slides.indexOf(nextSlide);
            //Decide direction if it's not given
            if (direction === undefined) {
                direction = nextIndex > currentIndex ? 'next' : 'prev';
            }
            if (nextSlide && nextSlide !== self.currentSlide) {
                if ($scope.$currentTransition) {
                    $scope.$currentTransition.cancel();
                    //Timeout so ng-class in template has time to fix classes for finished slide
                    $timeout(goNext);
                } else {
                    goNext();
                }
            }
            function goNext() {
                // Scope has been destroyed, stop here.
                if (destroyed) { return; }
                //If we have a slide to transition from and we have a transition type and we're allowed, go
                if (self.currentSlide && angular.isString(direction) && !$scope.noTransition && nextSlide.$element) {
                    //We shouldn't do class manip in here, but it's the same weird thing bootstrap does. need to fix sometime
                    nextSlide.$element.addClass(direction);
                    var reflow = nextSlide.$element[0].offsetWidth; //force reflow

                    //Set all other slides to stop doing their stuff for the new transition
                    angular.forEach(slides, function(slide) {
                        angular.extend(slide, {direction: '', entering: false, leaving: false, active: false});
                    });
                    angular.extend(nextSlide, {direction: direction, active: true, entering: true});
                    angular.extend(self.currentSlide||{}, {direction: direction, leaving: true});

                    $scope.$currentTransition = $transition(nextSlide.$element, {});
                    //We have to create new pointers inside a closure since next & current will change
                    (function(next,current) {
                        $scope.$currentTransition.then(
                            function(){ transitionDone(next, current); },
                            function(){ transitionDone(next, current); }
                        );
                    }(nextSlide, self.currentSlide));
                } else {
                    transitionDone(nextSlide, self.currentSlide);
                }
                self.currentSlide = nextSlide;
                currentIndex = nextIndex;
                //every time you change slides, reset the timer
                restartTimer();
            }
            function transitionDone(next, current) {
                angular.extend(next, {direction: '', active: true, leaving: false, entering: false});
                angular.extend(current||{}, {direction: '', active: false, leaving: false, entering: false});
                $scope.$currentTransition = null;
            }
        };
        $scope.$on('$destroy', function () {
            destroyed = true;
        });

        /* Allow outside people to call indexOf on slides array */
        self.indexOfSlide = function(slide) {
            return slides.indexOf(slide);
        };

        $scope.next = function() {
            var newIndex = (currentIndex + 1) % slides.length;

            //Prevent this user-triggered transition from occurring if there is already one in progress
            if (!$scope.$currentTransition) {
                return self.select(slides[newIndex], 'next');
            }
        };

        $scope.prev = function() {
            var newIndex = currentIndex - 1 < 0 ? slides.length - 1 : currentIndex - 1;

            //Prevent this user-triggered transition from occurring if there is already one in progress
            if (!$scope.$currentTransition) {
                return self.select(slides[newIndex], 'prev');
            }
        };

        $scope.isActive = function(slide) {
            return self.currentSlide === slide;
        };

        $scope.$watch('interval', restartTimer);
        $scope.$on('$destroy', resetTimer);

        function restartTimer() {
            resetTimer();
            var interval = +$scope.interval;
            if (!isNaN(interval) && interval > 0) {
                currentInterval = $interval(timerFn, interval);
            }
        }

        function resetTimer() {
            if (currentInterval) {
                $interval.cancel(currentInterval);
                currentInterval = null;
            }
        }

        function timerFn() {
            var interval = +$scope.interval;
            if (isPlaying && !isNaN(interval) && interval > 0) {
                $scope.next();
            } else {
                $scope.pause();
            }
        }

        $scope.play = function() {
            if (!isPlaying) {
                isPlaying = true;
                restartTimer();
            }
        };
        $scope.pause = function() {
            if (!$scope.noPause) {
                isPlaying = false;
                resetTimer();
            }
        };

        self.addSlide = function(slide, element) {
            slide.$element = element;
            slides.push(slide);
            //if this is the first slide or the slide is set to active, select it
            if(slides.length === 1 || slide.active) {
                self.select(slides[slides.length-1]);
                if (slides.length == 1) {
                    $scope.play();
                }
            } else {
                slide.active = false;
            }
        };

        self.removeSlide = function(slide) {
            //get the index of the slide inside the carousel
            var index = slides.indexOf(slide);
            slides.splice(index, 1);
            if (slides.length > 0 && slide.active) {
                if (index >= slides.length) {
                    self.select(slides[index-1]);
                } else {
                    self.select(slides[index]);
                }
            } else if (currentIndex > index) {
                currentIndex--;
            }
        };

    }])

/**
 * @ngdoc directive
 * @name ui.bootstrap.carousel.directive:carousel
 * @restrict EA
 *
 * @description
 * Carousel is the outer container for a set of image 'slides' to showcase.
 *
 * @param {number=} interval The time, in milliseconds, that it will take the carousel to go to the next slide.
 * @param {boolean=} noTransition Whether to disable transitions on the carousel.
 * @param {boolean=} noPause Whether to disable pausing on the carousel (by default, the carousel interval pauses on hover).
 *
 * @example
 <example module="ui.bootstrap">
 <file name="index.html">
 <carousel>
 <slide>
 <img src="http://placekitten.com/150/150" style="margin:auto;">
 <div class="carousel-caption">
 <p>Beautiful!</p>
 </div>
 </slide>
 <slide>
 <img src="http://placekitten.com/100/150" style="margin:auto;">
 <div class="carousel-caption">
 <p>D'aww!</p>
 </div>
 </slide>
 </carousel>
 </file>
 <file name="demo.css">
 .carousel-indicators {
      top: auto;
      bottom: 15px;
    }
 </file>
 </example>
 */
    .directive('carousel', [function() {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            controller: 'CarouselController',
            require: 'carousel',
            templateUrl: 'template/carousel/carousel.html',
            scope: {
                interval: '=',
                noTransition: '=',
                noPause: '='
            }
        };
    }])

/**
 * @ngdoc directive
 * @name ui.bootstrap.carousel.directive:slide
 * @restrict EA
 *
 * @description
 * Creates a slide inside a {@link ui.bootstrap.carousel.directive:carousel carousel}.  Must be placed as a child of a carousel element.
 *
 * @param {boolean=} active Model binding, whether or not this slide is currently active.
 *
 * @example
 <example module="ui.bootstrap">
 <file name="index.html">
 <div ng-controller="CarouselDemoCtrl">
 <carousel>
 <slide ng-repeat="slide in slides" active="slide.active">
 <img ng-src="{{slide.image}}" style="margin:auto;">
 <div class="carousel-caption">
 <h4>Slide {{$index}}</h4>
 <p>{{slide.text}}</p>
 </div>
 </slide>
 </carousel>
 Interval, in milliseconds: <input type="number" ng-model="myInterval">
 <br />Enter a negative number to stop the interval.
 </div>
 </file>
 <file name="script.js">
 function CarouselDemoCtrl($scope) {
  $scope.myInterval = 5000;
}
 </file>
 <file name="demo.css">
 .carousel-indicators {
      top: auto;
      bottom: 15px;
    }
 </file>
 </example>
 */

    .directive('slide', function() {
        return {
            require: '^carousel',
            restrict: 'EA',
            transclude: true,
            replace: true,
            templateUrl: 'template/carousel/slide.html',
            scope: {
                active: '=?'
            },
            link: function (scope, element, attrs, carouselCtrl) {
                carouselCtrl.addSlide(scope, element);
                //when the scope is destroyed then remove the slide from the current slides array
                scope.$on('$destroy', function() {
                    carouselCtrl.removeSlide(scope);
                });

                scope.$watch('active', function(active) {
                    if (active) {
                        carouselCtrl.select(scope);
                    }
                });
            }
        };
    });

angular.module('ui.bootstrap.dateparser', [])

    .service('dateParser', ['$locale', 'orderByFilter', function($locale, orderByFilter) {

        this.parsers = {};

        var formatCodeToRegex = {
            'yyyy': {
                regex: '\\d{4}',
                apply: function(value) { this.year = +value; }
            },
            'yy': {
                regex: '\\d{2}',
                apply: function(value) { this.year = +value + 2000; }
            },
            'y': {
                regex: '\\d{1,4}',
                apply: function(value) { this.year = +value; }
            },
            'MMMM': {
                regex: $locale.DATETIME_FORMATS.MONTH.join('|'),
                apply: function(value) { this.month = $locale.DATETIME_FORMATS.MONTH.indexOf(value); }
            },
            'MMM': {
                regex: $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
                apply: function(value) { this.month = $locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value); }
            },
            'MM': {
                regex: '0[1-9]|1[0-2]',
                apply: function(value) { this.month = value - 1; }
            },
            'M': {
                regex: '[1-9]|1[0-2]',
                apply: function(value) { this.month = value - 1; }
            },
            'dd': {
                regex: '[0-2][0-9]{1}|3[0-1]{1}',
                apply: function(value) { this.date = +value; }
            },
            'd': {
                regex: '[1-2]?[0-9]{1}|3[0-1]{1}',
                apply: function(value) { this.date = +value; }
            },
            'EEEE': {
                regex: $locale.DATETIME_FORMATS.DAY.join('|')
            },
            'EEE': {
                regex: $locale.DATETIME_FORMATS.SHORTDAY.join('|')
            }
        };

        function createParser(format) {
            var map = [], regex = format.split('');

            angular.forEach(formatCodeToRegex, function(data, code) {
                var index = format.indexOf(code);

                if (index > -1) {
                    format = format.split('');

                    regex[index] = '(' + data.regex + ')';
                    format[index] = '$'; // Custom symbol to define consumed part of format
                    for (var i = index + 1, n = index + code.length; i < n; i++) {
                        regex[i] = '';
                        format[i] = '$';
                    }
                    format = format.join('');

                    map.push({ index: index, apply: data.apply });
                }
            });

            return {
                regex: new RegExp('^' + regex.join('') + '$'),
                map: orderByFilter(map, 'index')
            };
        }

        this.parse = function(input, format) {
            if ( !angular.isString(input) || !format ) {
                return input;
            }

            format = $locale.DATETIME_FORMATS[format] || format;

            if ( !this.parsers[format] ) {
                this.parsers[format] = createParser(format);
            }

            var parser = this.parsers[format],
                regex = parser.regex,
                map = parser.map,
                results = input.match(regex);

            if ( results && results.length ) {
                var fields = { year: 1900, month: 0, date: 1, hours: 0 }, dt;

                for( var i = 1, n = results.length; i < n; i++ ) {
                    var mapper = map[i-1];
                    if ( mapper.apply ) {
                        mapper.apply.call(fields, results[i]);
                    }
                }

                if ( isValid(fields.year, fields.month, fields.date) ) {
                    dt = new Date( fields.year, fields.month, fields.date, fields.hours);
                }

                return dt;
            }
        };

        // Check if date is valid for specific month (and year for February).
        // Month: 0 = Jan, 1 = Feb, etc
        function isValid(year, month, date) {
            if ( month === 1 && date > 28) {
                return date === 29 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
            }

            if ( month === 3 || month === 5 || month === 8 || month === 10) {
                return date < 31;
            }

            return true;
        }
    }]);

angular.module('ui.bootstrap.position', [])

/**
 * A set of utility methods that can be use to retrieve position of DOM elements.
 * It is meant to be used where we need to absolute-position DOM elements in
 * relation to other, existing elements (this is the case for tooltips, popovers,
 * typeahead suggestions etc.).
 */
    .factory('$position', ['$document', '$window', function ($document, $window) {

        function getStyle(el, cssprop) {
            if (el.currentStyle) { //IE
                return el.currentStyle[cssprop];
            } else if ($window.getComputedStyle) {
                return $window.getComputedStyle(el)[cssprop];
            }
            // finally try and get inline style
            return el.style[cssprop];
        }

        /**
         * Checks if a given element is statically positioned
         * @param element - raw DOM element
         */
        function isStaticPositioned(element) {
            return (getStyle(element, 'position') || 'static' ) === 'static';
        }

        /**
         * returns the closest, non-statically positioned parentOffset of a given element
         * @param element
         */
        var parentOffsetEl = function (element) {
            var docDomEl = $document[0];
            var offsetParent = element.offsetParent || docDomEl;
            while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent) ) {
                offsetParent = offsetParent.offsetParent;
            }
            return offsetParent || docDomEl;
        };

        return {
            /**
             * Provides read-only equivalent of jQuery's position function:
             * http://api.jquery.com/position/
             */
            position: function (element) {
                var elBCR = this.offset(element);
                var offsetParentBCR = { top: 0, left: 0 };
                var offsetParentEl = parentOffsetEl(element[0]);
                if (offsetParentEl != $document[0]) {
                    offsetParentBCR = this.offset(angular.element(offsetParentEl));
                    offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
                    offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
                }

                var boundingClientRect = element[0].getBoundingClientRect();
                return {
                    width: boundingClientRect.width || element.prop('offsetWidth'),
                    height: boundingClientRect.height || element.prop('offsetHeight'),
                    top: elBCR.top - offsetParentBCR.top,
                    left: elBCR.left - offsetParentBCR.left
                };
            },

            /**
             * Provides read-only equivalent of jQuery's offset function:
             * http://api.jquery.com/offset/
             */
            offset: function (element) {
                var boundingClientRect = element[0].getBoundingClientRect();
                return {
                    width: boundingClientRect.width || element.prop('offsetWidth'),
                    height: boundingClientRect.height || element.prop('offsetHeight'),
                    top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
                    left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
                };
            },

            /**
             * Provides coordinates for the targetEl in relation to hostEl
             */
            positionElements: function (hostEl, targetEl, positionStr, appendToBody) {

                var positionStrParts = positionStr.split('-');
                var pos0 = positionStrParts[0], pos1 = positionStrParts[1] || 'center';

                var hostElPos,
                    targetElWidth,
                    targetElHeight,
                    targetElPos;

                hostElPos = appendToBody ? this.offset(hostEl) : this.position(hostEl);

                targetElWidth = targetEl.prop('offsetWidth');
                targetElHeight = targetEl.prop('offsetHeight');

                var shiftWidth = {
                    center: function () {
                        return hostElPos.left + hostElPos.width / 2 - targetElWidth / 2;
                    },
                    left: function () {
                        return hostElPos.left;
                    },
                    right: function () {
                        return hostElPos.left + hostElPos.width;
                    }
                };

                var shiftHeight = {
                    center: function () {
                        return hostElPos.top + hostElPos.height / 2 - targetElHeight / 2;
                    },
                    top: function () {
                        return hostElPos.top;
                    },
                    bottom: function () {
                        return hostElPos.top + hostElPos.height;
                    }
                };

                switch (pos0) {
                    case 'right':
                        targetElPos = {
                            top: shiftHeight[pos1](),
                            left: shiftWidth[pos0]()
                        };
                        break;
                    case 'left':
                        targetElPos = {
                            top: shiftHeight[pos1](),
                            left: hostElPos.left - targetElWidth
                        };
                        break;
                    case 'bottom':
                        targetElPos = {
                            top: shiftHeight[pos0](),
                            left: shiftWidth[pos1]()
                        };
                        break;
                    default:
                        targetElPos = {
                            top: hostElPos.top - targetElHeight,
                            left: shiftWidth[pos1]()
                        };
                        break;
                }

                return targetElPos;
            }
        };
    }]);

angular.module('ui.bootstrap.datepicker', ['ui.bootstrap.dateparser', 'ui.bootstrap.position'])

    .constant('datepickerConfig', {
        formatDay: 'dd',
        formatMonth: 'MMMM',
        formatYear: 'yyyy',
        formatDayHeader: 'EEE',
        formatDayTitle: 'MMMM yyyy',
        formatMonthTitle: 'yyyy',
        datepickerMode: 'day',
        minMode: 'day',
        maxMode: 'year',
        showWeeks: true,
        startingDay: 0,
        yearRange: 20,
        minDate: null,
        maxDate: null
    })

    .controller('DatepickerController', ['$scope', '$attrs', '$parse', '$interpolate', '$timeout', '$log', 'dateFilter', 'datepickerConfig', function($scope, $attrs, $parse, $interpolate, $timeout, $log, dateFilter, datepickerConfig) {
        var self = this,
            ngModelCtrl = { $setViewValue: angular.noop }; // nullModelCtrl;

        // Modes chain
        this.modes = ['day', 'month', 'year'];

        // Configuration attributes
        angular.forEach(['formatDay', 'formatMonth', 'formatYear', 'formatDayHeader', 'formatDayTitle', 'formatMonthTitle',
            'minMode', 'maxMode', 'showWeeks', 'startingDay', 'yearRange'], function( key, index ) {
            self[key] = angular.isDefined($attrs[key]) ? (index < 8 ? $interpolate($attrs[key])($scope.$parent) : $scope.$parent.$eval($attrs[key])) : datepickerConfig[key];
        });

        // Watchable date attributes
        angular.forEach(['minDate', 'maxDate'], function( key ) {
            if ( $attrs[key] ) {
                $scope.$parent.$watch($parse($attrs[key]), function(value) {
                    self[key] = value ? new Date(value) : null;
                    self.refreshView();
                });
            } else {
                self[key] = datepickerConfig[key] ? new Date(datepickerConfig[key]) : null;
            }
        });

        $scope.datepickerMode = $scope.datepickerMode || datepickerConfig.datepickerMode;
        $scope.uniqueId = 'datepicker-' + $scope.$id + '-' + Math.floor(Math.random() * 10000);
        this.activeDate = angular.isDefined($attrs.initDate) ? $scope.$parent.$eval($attrs.initDate) : new Date();

        $scope.isActive = function(dateObject) {
            if (self.compare(dateObject.date, self.activeDate) === 0) {
                $scope.activeDateId = dateObject.uid;
                return true;
            }
            return false;
        };

        this.init = function( ngModelCtrl_ ) {
            ngModelCtrl = ngModelCtrl_;

            ngModelCtrl.$render = function() {
                self.render();
            };
        };

        this.render = function() {
            if ( ngModelCtrl.$modelValue ) {
                var date = new Date( ngModelCtrl.$modelValue ),
                    isValid = !isNaN(date);

                if ( isValid ) {
                    this.activeDate = date;
                } else {
                    $log.error('Datepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
                }
                ngModelCtrl.$setValidity('date', isValid);
            }
            this.refreshView();
        };

        this.refreshView = function() {
            if ( this.element ) {
                this._refreshView();

                var date = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
                ngModelCtrl.$setValidity('date-disabled', !date || (this.element && !this.isDisabled(date)));
            }
        };

        this.createDateObject = function(date, format) {
            var model = ngModelCtrl.$modelValue ? new Date(ngModelCtrl.$modelValue) : null;
            return {
                date: date,
                label: dateFilter(date, format),
                selected: model && this.compare(date, model) === 0,
                disabled: this.isDisabled(date),
                current: this.compare(date, new Date()) === 0
            };
        };

        this.isDisabled = function( date ) {
            return ((this.minDate && this.compare(date, this.minDate) < 0) || (this.maxDate && this.compare(date, this.maxDate) > 0) || ($attrs.dateDisabled && $scope.dateDisabled({date: date, mode: $scope.datepickerMode})));
        };

        // Split array into smaller arrays
        this.split = function(arr, size) {
            var arrays = [];
            while (arr.length > 0) {
                arrays.push(arr.splice(0, size));
            }
            return arrays;
        };

        $scope.select = function( date ) {
            if ( $scope.datepickerMode === self.minMode ) {
                var dt = ngModelCtrl.$modelValue ? new Date( ngModelCtrl.$modelValue ) : new Date(0, 0, 0, 0, 0, 0, 0);
                dt.setFullYear( date.getFullYear(), date.getMonth(), date.getDate() );
                ngModelCtrl.$setViewValue( dt );
                ngModelCtrl.$render();
            } else {
                self.activeDate = date;
                $scope.datepickerMode = self.modes[ self.modes.indexOf( $scope.datepickerMode ) - 1 ];
            }
        };

        $scope.move = function( direction ) {
            var year = self.activeDate.getFullYear() + direction * (self.step.years || 0),
                month = self.activeDate.getMonth() + direction * (self.step.months || 0);
            self.activeDate.setFullYear(year, month, 1);
            self.refreshView();
        };

        $scope.toggleMode = function( direction ) {
            direction = direction || 1;

            if (($scope.datepickerMode === self.maxMode && direction === 1) || ($scope.datepickerMode === self.minMode && direction === -1)) {
                return;
            }

            $scope.datepickerMode = self.modes[ self.modes.indexOf( $scope.datepickerMode ) + direction ];
        };

        // Key event mapper
        $scope.keys = { 13:'enter', 32:'space', 33:'pageup', 34:'pagedown', 35:'end', 36:'home', 37:'left', 38:'up', 39:'right', 40:'down' };

        var focusElement = function() {
            $timeout(function() {
                self.element[0].focus();
            }, 0 , false);
        };

        // Listen for focus requests from popup directive
        $scope.$on('datepicker.focus', focusElement);

        $scope.keydown = function( evt ) {
            var key = $scope.keys[evt.which];

            if ( !key || evt.shiftKey || evt.altKey ) {
                return;
            }

            evt.preventDefault();
            evt.stopPropagation();

            if (key === 'enter' || key === 'space') {
                if ( self.isDisabled(self.activeDate)) {
                    return; // do nothing
                }
                $scope.select(self.activeDate);
                focusElement();
            } else if (evt.ctrlKey && (key === 'up' || key === 'down')) {
                $scope.toggleMode(key === 'up' ? 1 : -1);
                focusElement();
            } else {
                self.handleKeyDown(key, evt);
                self.refreshView();
            }
        };
    }])

    .directive( 'datepicker', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'template/datepicker/datepicker.html',
            scope: {
                datepickerMode: '=?',
                dateDisabled: '&'
            },
            require: ['datepicker', '?^ngModel'],
            controller: 'DatepickerController',
            link: function(scope, element, attrs, ctrls) {
                var datepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                if ( ngModelCtrl ) {
                    datepickerCtrl.init( ngModelCtrl );
                }
            }
        };
    })

    .directive('daypicker', ['dateFilter', function (dateFilter) {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'template/datepicker/day.html',
            require: '^datepicker',
            link: function(scope, element, attrs, ctrl) {
                scope.showWeeks = ctrl.showWeeks;

                ctrl.step = { months: 1 };
                ctrl.element = element;

                var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                function getDaysInMonth( year, month ) {
                    return ((month === 1) && (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0))) ? 29 : DAYS_IN_MONTH[month];
                }

                function getDates(startDate, n) {
                    var dates = new Array(n), current = new Date(startDate), i = 0;
                    current.setHours(12); // Prevent repeated dates because of timezone bug
                    while ( i < n ) {
                        dates[i++] = new Date(current);
                        current.setDate( current.getDate() + 1 );
                    }
                    return dates;
                }

                ctrl._refreshView = function() {
                    var year = ctrl.activeDate.getFullYear(),
                        month = ctrl.activeDate.getMonth(),
                        firstDayOfMonth = new Date(year, month, 1),
                        difference = ctrl.startingDay - firstDayOfMonth.getDay(),
                        numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : - difference,
                        firstDate = new Date(firstDayOfMonth);

                    if ( numDisplayedFromPreviousMonth > 0 ) {
                        firstDate.setDate( - numDisplayedFromPreviousMonth + 1 );
                    }

                    // 42 is the number of days on a six-month calendar
                    var days = getDates(firstDate, 42);
                    for (var i = 0; i < 42; i ++) {
                        days[i] = angular.extend(ctrl.createDateObject(days[i], ctrl.formatDay), {
                            secondary: days[i].getMonth() !== month,
                            uid: scope.uniqueId + '-' + i
                        });
                    }

                    scope.labels = new Array(7);
                    for (var j = 0; j < 7; j++) {
                        scope.labels[j] = {
                            abbr: dateFilter(days[j].date, ctrl.formatDayHeader),
                            full: dateFilter(days[j].date, 'EEEE')
                        };
                    }

                    scope.title = dateFilter(ctrl.activeDate, ctrl.formatDayTitle);
                    scope.rows = ctrl.split(days, 7);

                    if ( scope.showWeeks ) {
                        scope.weekNumbers = [];
                        var weekNumber = getISO8601WeekNumber( scope.rows[0][0].date ),
                            numWeeks = scope.rows.length;
                        while( scope.weekNumbers.push(weekNumber++) < numWeeks ) {}
                    }
                };

                ctrl.compare = function(date1, date2) {
                    return (new Date( date1.getFullYear(), date1.getMonth(), date1.getDate() ) - new Date( date2.getFullYear(), date2.getMonth(), date2.getDate() ) );
                };

                function getISO8601WeekNumber(date) {
                    var checkDate = new Date(date);
                    checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
                    var time = checkDate.getTime();
                    checkDate.setMonth(0); // Compare with Jan 1
                    checkDate.setDate(1);
                    return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
                }

                ctrl.handleKeyDown = function( key, evt ) {
                    var date = ctrl.activeDate.getDate();

                    if (key === 'left') {
                        date = date - 1;   // up
                    } else if (key === 'up') {
                        date = date - 7;   // down
                    } else if (key === 'right') {
                        date = date + 1;   // down
                    } else if (key === 'down') {
                        date = date + 7;
                    } else if (key === 'pageup' || key === 'pagedown') {
                        var month = ctrl.activeDate.getMonth() + (key === 'pageup' ? - 1 : 1);
                        ctrl.activeDate.setMonth(month, 1);
                        date = Math.min(getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth()), date);
                    } else if (key === 'home') {
                        date = 1;
                    } else if (key === 'end') {
                        date = getDaysInMonth(ctrl.activeDate.getFullYear(), ctrl.activeDate.getMonth());
                    }
                    ctrl.activeDate.setDate(date);
                };

                ctrl.refreshView();
            }
        };
    }])

    .directive('monthpicker', ['dateFilter', function (dateFilter) {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'template/datepicker/month.html',
            require: '^datepicker',
            link: function(scope, element, attrs, ctrl) {
                ctrl.step = { years: 1 };
                ctrl.element = element;

                ctrl._refreshView = function() {
                    var months = new Array(12),
                        year = ctrl.activeDate.getFullYear();

                    for ( var i = 0; i < 12; i++ ) {
                        months[i] = angular.extend(ctrl.createDateObject(new Date(year, i, 1), ctrl.formatMonth), {
                            uid: scope.uniqueId + '-' + i
                        });
                    }

                    scope.title = dateFilter(ctrl.activeDate, ctrl.formatMonthTitle);
                    scope.rows = ctrl.split(months, 3);
                };

                ctrl.compare = function(date1, date2) {
                    return new Date( date1.getFullYear(), date1.getMonth() ) - new Date( date2.getFullYear(), date2.getMonth() );
                };

                ctrl.handleKeyDown = function( key, evt ) {
                    var date = ctrl.activeDate.getMonth();

                    if (key === 'left') {
                        date = date - 1;   // up
                    } else if (key === 'up') {
                        date = date - 3;   // down
                    } else if (key === 'right') {
                        date = date + 1;   // down
                    } else if (key === 'down') {
                        date = date + 3;
                    } else if (key === 'pageup' || key === 'pagedown') {
                        var year = ctrl.activeDate.getFullYear() + (key === 'pageup' ? - 1 : 1);
                        ctrl.activeDate.setFullYear(year);
                    } else if (key === 'home') {
                        date = 0;
                    } else if (key === 'end') {
                        date = 11;
                    }
                    ctrl.activeDate.setMonth(date);
                };

                ctrl.refreshView();
            }
        };
    }])

    .directive('yearpicker', ['dateFilter', function (dateFilter) {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'template/datepicker/year.html',
            require: '^datepicker',
            link: function(scope, element, attrs, ctrl) {
                var range = ctrl.yearRange;

                ctrl.step = { years: range };
                ctrl.element = element;

                function getStartingYear( year ) {
                    return parseInt((year - 1) / range, 10) * range + 1;
                }

                ctrl._refreshView = function() {
                    var years = new Array(range);

                    for ( var i = 0, start = getStartingYear(ctrl.activeDate.getFullYear()); i < range; i++ ) {
                        years[i] = angular.extend(ctrl.createDateObject(new Date(start + i, 0, 1), ctrl.formatYear), {
                            uid: scope.uniqueId + '-' + i
                        });
                    }

                    scope.title = [years[0].label, years[range - 1].label].join(' - ');
                    scope.rows = ctrl.split(years, 5);
                };

                ctrl.compare = function(date1, date2) {
                    return date1.getFullYear() - date2.getFullYear();
                };

                ctrl.handleKeyDown = function( key, evt ) {
                    var date = ctrl.activeDate.getFullYear();

                    if (key === 'left') {
                        date = date - 1;   // up
                    } else if (key === 'up') {
                        date = date - 5;   // down
                    } else if (key === 'right') {
                        date = date + 1;   // down
                    } else if (key === 'down') {
                        date = date + 5;
                    } else if (key === 'pageup' || key === 'pagedown') {
                        date += (key === 'pageup' ? - 1 : 1) * ctrl.step.years;
                    } else if (key === 'home') {
                        date = getStartingYear( ctrl.activeDate.getFullYear() );
                    } else if (key === 'end') {
                        date = getStartingYear( ctrl.activeDate.getFullYear() ) + range - 1;
                    }
                    ctrl.activeDate.setFullYear(date);
                };

                ctrl.refreshView();
            }
        };
    }])

    .constant('datepickerPopupConfig', {
        datepickerPopup: 'yyyy-MM-dd',
        currentText: 'Today',
        clearText: 'Clear',
        closeText: 'Done',
        closeOnDateSelection: true,
        appendToBody: false,
        showButtonBar: true
    })

    .directive('datepickerPopup', ['$compile', '$parse', '$document', '$position', 'dateFilter', 'dateParser', 'datepickerPopupConfig',
        function ($compile, $parse, $document, $position, dateFilter, dateParser, datepickerPopupConfig) {
            return {
                restrict: 'EA',
                require: 'ngModel',
                scope: {
                    isOpen: '=?',
                    currentText: '@',
                    clearText: '@',
                    closeText: '@',
                    dateDisabled: '&'
                },
                link: function(scope, element, attrs, ngModel) {
                    var dateFormat,
                        closeOnDateSelection = angular.isDefined(attrs.closeOnDateSelection) ? scope.$parent.$eval(attrs.closeOnDateSelection) : datepickerPopupConfig.closeOnDateSelection,
                        appendToBody = angular.isDefined(attrs.datepickerAppendToBody) ? scope.$parent.$eval(attrs.datepickerAppendToBody) : datepickerPopupConfig.appendToBody;

                    scope.showButtonBar = angular.isDefined(attrs.showButtonBar) ? scope.$parent.$eval(attrs.showButtonBar) : datepickerPopupConfig.showButtonBar;

                    scope.getText = function( key ) {
                        return scope[key + 'Text'] || datepickerPopupConfig[key + 'Text'];
                    };

                    attrs.$observe('datepickerPopup', function(value) {
                        dateFormat = value || datepickerPopupConfig.datepickerPopup;
                        ngModel.$render();
                    });

                    // popup element used to display calendar
                    var popupEl = angular.element('<div datepicker-popup-wrap><div datepicker></div></div>');
                    popupEl.attr({
                        'ng-model': 'date',
                        'ng-change': 'dateSelection()'
                    });

                    function cameltoDash( string ){
                        return string.replace(/([A-Z])/g, function($1) { return '-' + $1.toLowerCase(); });
                    }

                    // datepicker element
                    var datepickerEl = angular.element(popupEl.children()[0]);
                    if ( attrs.datepickerOptions ) {
                        angular.forEach(scope.$parent.$eval(attrs.datepickerOptions), function( value, option ) {
                            datepickerEl.attr( cameltoDash(option), value );
                        });
                    }

                    scope.watchData = {};
                    angular.forEach(['minDate', 'maxDate', 'datepickerMode'], function( key ) {
                        if ( attrs[key] ) {
                            var getAttribute = $parse(attrs[key]);
                            scope.$parent.$watch(getAttribute, function(value){
                                scope.watchData[key] = value;
                            });
                            datepickerEl.attr(cameltoDash(key), 'watchData.' + key);

                            // Propagate changes from datepicker to outside
                            if ( key === 'datepickerMode' ) {
                                var setAttribute = getAttribute.assign;
                                scope.$watch('watchData.' + key, function(value, oldvalue) {
                                    if ( value !== oldvalue ) {
                                        setAttribute(scope.$parent, value);
                                    }
                                });
                            }
                        }
                    });
                    if (attrs.dateDisabled) {
                        datepickerEl.attr('date-disabled', 'dateDisabled({ date: date, mode: mode })');
                    }

                    function parseDate(viewValue) {
                        if (!viewValue) {
                            ngModel.$setValidity('date', true);
                            return null;
                        } else if (angular.isDate(viewValue) && !isNaN(viewValue)) {
                            ngModel.$setValidity('date', true);
                            return viewValue;
                        } else if (angular.isString(viewValue)) {
                            var date = dateParser.parse(viewValue, dateFormat) || new Date(viewValue);
                            if (isNaN(date)) {
                                ngModel.$setValidity('date', false);
                                return undefined;
                            } else {
                                ngModel.$setValidity('date', true);
                                return date;
                            }
                        } else {
                            ngModel.$setValidity('date', false);
                            return undefined;
                        }
                    }
                    ngModel.$parsers.unshift(parseDate);

                    // Inner change
                    scope.dateSelection = function(dt) {
                        if (angular.isDefined(dt)) {
                            scope.date = dt;
                        }
                        ngModel.$setViewValue(scope.date);
                        ngModel.$render();

                        if ( closeOnDateSelection ) {
                            scope.isOpen = false;
                            element[0].focus();
                        }
                    };

                    element.bind('input change keyup', function() {
                        scope.$apply(function() {
                            scope.date = ngModel.$modelValue;
                        });
                    });

                    // Outter change
                    ngModel.$render = function() {
                        var date = ngModel.$viewValue ? dateFilter(ngModel.$viewValue, dateFormat) : '';
                        element.val(date);
                        scope.date = parseDate( ngModel.$modelValue );
                    };

                    var documentClickBind = function(event) {
                        if (scope.isOpen && event.target !== element[0]) {
                            scope.$apply(function() {
                                scope.isOpen = false;
                            });
                        }
                    };

                    var keydown = function(evt, noApply) {
                        scope.keydown(evt);
                    };
                    element.bind('keydown', keydown);

                    scope.keydown = function(evt) {
                        if (evt.which === 27) {
                            evt.preventDefault();
                            evt.stopPropagation();
                            scope.close();
                        } else if (evt.which === 40 && !scope.isOpen) {
                            scope.isOpen = true;
                        }
                    };

                    scope.$watch('isOpen', function(value) {
                        if (value) {
                            scope.$broadcast('datepicker.focus');
                            scope.position = appendToBody ? $position.offset(element) : $position.position(element);
                            scope.position.top = scope.position.top + element.prop('offsetHeight');

                            $document.bind('click', documentClickBind);
                        } else {
                            $document.unbind('click', documentClickBind);
                        }
                    });

                    scope.select = function( date ) {
                        if (date === 'today') {
                            var today = new Date();
                            if (angular.isDate(ngModel.$modelValue)) {
                                date = new Date(ngModel.$modelValue);
                                date.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
                            } else {
                                date = new Date(today.setHours(0, 0, 0, 0));
                            }
                        }
                        scope.dateSelection( date );
                    };

                    scope.close = function() {
                        scope.isOpen = false;
                        element[0].focus();
                    };

                    var $popup = $compile(popupEl)(scope);
                    // Prevent jQuery cache memory leak (template is now redundant after linking)
                    popupEl.remove();

                    if ( appendToBody ) {
                        $document.find('body').append($popup);
                    } else {
                        element.after($popup);
                    }

                    scope.$on('$destroy', function() {
                        $popup.remove();
                        element.unbind('keydown', keydown);
                        $document.unbind('click', documentClickBind);
                    });
                }
            };
        }])

    .directive('datepickerPopupWrap', function() {
        return {
            restrict:'EA',
            replace: true,
            transclude: true,
            templateUrl: 'template/datepicker/popup.html',
            link:function (scope, element, attrs) {
                element.bind('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
            }
        };
    });

angular.module('ui.bootstrap.dropdown', [])

    .constant('dropdownConfig', {
        openClass: 'open'
    })

    .service('dropdownService', ['$document', function($document) {
        var openScope = null;

        this.open = function( dropdownScope ) {
            if ( !openScope ) {
                $document.bind('click', closeDropdown);
                $document.bind('keydown', escapeKeyBind);
            }

            if ( openScope && openScope !== dropdownScope ) {
                openScope.isOpen = false;
            }

            openScope = dropdownScope;
        };

        this.close = function( dropdownScope ) {
            if ( openScope === dropdownScope ) {
                openScope = null;
                $document.unbind('click', closeDropdown);
                $document.unbind('keydown', escapeKeyBind);
            }
        };

        var closeDropdown = function( evt ) {
            // This method may still be called during the same mouse event that
            // unbound this event handler. So check openScope before proceeding.
            if (!openScope) { return; }

            var toggleElement = openScope.getToggleElement();
            if ( evt && toggleElement && toggleElement[0].contains(evt.target) ) {
                return;
            }

            openScope.$apply(function() {
                openScope.isOpen = false;
            });
        };

        var escapeKeyBind = function( evt ) {
            if ( evt.which === 27 ) {
                openScope.focusToggleElement();
                closeDropdown();
            }
        };
    }])

    .controller('DropdownController', ['$scope', '$attrs', '$parse', 'dropdownConfig', 'dropdownService', '$animate', function($scope, $attrs, $parse, dropdownConfig, dropdownService, $animate) {
        var self = this,
            scope = $scope.$new(), // create a child scope so we are not polluting original one
            openClass = dropdownConfig.openClass,
            getIsOpen,
            setIsOpen = angular.noop,
            toggleInvoker = $attrs.onToggle ? $parse($attrs.onToggle) : angular.noop;

        this.init = function( element ) {
            self.$element = element;

            if ( $attrs.isOpen ) {
                getIsOpen = $parse($attrs.isOpen);
                setIsOpen = getIsOpen.assign;

                $scope.$watch(getIsOpen, function(value) {
                    scope.isOpen = !!value;
                });
            }
        };

        this.toggle = function( open ) {
            return scope.isOpen = arguments.length ? !!open : !scope.isOpen;
        };

        // Allow other directives to watch status
        this.isOpen = function() {
            return scope.isOpen;
        };

        scope.getToggleElement = function() {
            return self.toggleElement;
        };

        scope.focusToggleElement = function() {
            if ( self.toggleElement ) {
                self.toggleElement[0].focus();
            }
        };

        scope.$watch('isOpen', function( isOpen, wasOpen ) {
            $animate[isOpen ? 'addClass' : 'removeClass'](self.$element, openClass);

            if ( isOpen ) {
                scope.focusToggleElement();
                dropdownService.open( scope );
            } else {
                dropdownService.close( scope );
            }

            setIsOpen($scope, isOpen);
            if (angular.isDefined(isOpen) && isOpen !== wasOpen) {
                toggleInvoker($scope, { open: !!isOpen });
            }
        });

        $scope.$on('$locationChangeSuccess', function() {
            scope.isOpen = false;
        });

        $scope.$on('$destroy', function() {
            scope.$destroy();
        });
    }])

    .directive('dropdown', function() {
        return {
            controller: 'DropdownController',
            link: function(scope, element, attrs, dropdownCtrl) {
                dropdownCtrl.init( element );
            }
        };
    })

    .directive('dropdownToggle', function() {
        return {
            require: '?^dropdown',
            link: function(scope, element, attrs, dropdownCtrl) {
                if ( !dropdownCtrl ) {
                    return;
                }

                dropdownCtrl.toggleElement = element;

                var toggleDropdown = function(event) {
                    event.preventDefault();

                    if ( !element.hasClass('disabled') && !attrs.disabled ) {
                        scope.$apply(function() {
                            dropdownCtrl.toggle();
                        });
                    }
                };

                element.bind('click', toggleDropdown);

                // WAI-ARIA
                element.attr({ 'aria-haspopup': true, 'aria-expanded': false });
                scope.$watch(dropdownCtrl.isOpen, function( isOpen ) {
                    element.attr('aria-expanded', !!isOpen);
                });

                scope.$on('$destroy', function() {
                    element.unbind('click', toggleDropdown);
                });
            }
        };
    });

angular.module('ui.bootstrap.modal', ['ui.bootstrap.transition'])

/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
    .factory('$$stackedMap', function () {
        return {
            createNew: function () {
                var stack = [];

                return {
                    add: function (key, value) {
                        stack.push({
                            key: key,
                            value: value
                        });
                    },
                    get: function (key) {
                        for (var i = 0; i < stack.length; i++) {
                            if (key == stack[i].key) {
                                return stack[i];
                            }
                        }
                    },
                    keys: function() {
                        var keys = [];
                        for (var i = 0; i < stack.length; i++) {
                            keys.push(stack[i].key);
                        }
                        return keys;
                    },
                    top: function () {
                        return stack[stack.length - 1];
                    },
                    remove: function (key) {
                        var idx = -1;
                        for (var i = 0; i < stack.length; i++) {
                            if (key == stack[i].key) {
                                idx = i;
                                break;
                            }
                        }
                        return stack.splice(idx, 1)[0];
                    },
                    removeTop: function () {
                        return stack.splice(stack.length - 1, 1)[0];
                    },
                    length: function () {
                        return stack.length;
                    }
                };
            }
        };
    })

/**
 * A helper directive for the $modal service. It creates a backdrop element.
 */
    .directive('modalBackdrop', ['$timeout', function ($timeout) {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'template/modal/backdrop.html',
            link: function (scope, element, attrs) {
                scope.backdropClass = attrs.backdropClass || '';

                scope.animate = false;

                //trigger CSS transitions
                $timeout(function () {
                    scope.animate = true;
                });
            }
        };
    }])

    .directive('modalWindow', ['$modalStack', '$timeout', function ($modalStack, $timeout) {
        return {
            restrict: 'EA',
            scope: {
                index: '@',
                animate: '='
            },
            replace: true,
            transclude: true,
            templateUrl: function(tElement, tAttrs) {
                return tAttrs.templateUrl || 'template/modal/window.html';
            },
            link: function (scope, element, attrs) {
                element.addClass(attrs.windowClass || '');
                scope.size = attrs.size;

                $timeout(function () {
                    // trigger CSS transitions
                    scope.animate = true;

                    /**
                     * Auto-focusing of a freshly-opened modal element causes any child elements
                     * with the autofocus attribute to lose focus. This is an issue on touch
                     * based devices which will show and then hide the onscreen keyboard.
                     * Attempts to refocus the autofocus element via JavaScript will not reopen
                     * the onscreen keyboard. Fixed by updated the focusing logic to only autofocus
                     * the modal element if the modal does not contain an autofocus element.
                     */
                    if (!element[0].querySelectorAll('[autofocus]').length) {
                        element[0].focus();
                    }
                });

                scope.close = function (evt) {
                    var modal = $modalStack.getTop();
                    if (modal && modal.value.backdrop && modal.value.backdrop != 'static' && (evt.target === evt.currentTarget)) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        $modalStack.dismiss(modal.key, 'backdrop click');
                    }
                };
            }
        };
    }])

    .directive('modalTransclude', function () {
        return {
            link: function($scope, $element, $attrs, controller, $transclude) {
                $transclude($scope.$parent, function(clone) {
                    $element.empty();
                    $element.append(clone);
                });
            }
        };
    })

    .factory('$modalStack', ['$transition', '$timeout', '$document', '$compile', '$rootScope', '$$stackedMap',
        function ($transition, $timeout, $document, $compile, $rootScope, $$stackedMap) {

            var OPENED_MODAL_CLASS = 'modal-open';

            var backdropDomEl, backdropScope;
            var openedWindows = $$stackedMap.createNew();
            var $modalStack = {};

            function backdropIndex() {
                var topBackdropIndex = -1;
                var opened = openedWindows.keys();
                for (var i = 0; i < opened.length; i++) {
                    if (openedWindows.get(opened[i]).value.backdrop) {
                        topBackdropIndex = i;
                    }
                }
                return topBackdropIndex;
            }

            $rootScope.$watch(backdropIndex, function(newBackdropIndex){
                if (backdropScope) {
                    backdropScope.index = newBackdropIndex;
                }
            });

            function removeModalWindow(modalInstance) {

                var body = $document.find('body').eq(0);
                var modalWindow = openedWindows.get(modalInstance).value;

                //clean up the stack
                openedWindows.remove(modalInstance);

                //remove window DOM element
                removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, 300, function() {
                    modalWindow.modalScope.$destroy();
                    body.toggleClass(OPENED_MODAL_CLASS, openedWindows.length() > 0);
                    checkRemoveBackdrop();
                });
            }

            function checkRemoveBackdrop() {
                //remove backdrop if no longer needed
                if (backdropDomEl && backdropIndex() == -1) {
                    var backdropScopeRef = backdropScope;
                    removeAfterAnimate(backdropDomEl, backdropScope, 150, function () {
                        backdropScopeRef.$destroy();
                        backdropScopeRef = null;
                    });
                    backdropDomEl = undefined;
                    backdropScope = undefined;
                }
            }

            function removeAfterAnimate(domEl, scope, emulateTime, done) {
                // Closing animation
                scope.animate = false;

                var transitionEndEventName = $transition.transitionEndEventName;
                if (transitionEndEventName) {
                    // transition out
                    var timeout = $timeout(afterAnimating, emulateTime);

                    domEl.bind(transitionEndEventName, function () {
                        $timeout.cancel(timeout);
                        afterAnimating();
                        scope.$apply();
                    });
                } else {
                    // Ensure this call is async
                    $timeout(afterAnimating);
                }

                function afterAnimating() {
                    if (afterAnimating.done) {
                        return;
                    }
                    afterAnimating.done = true;

                    domEl.remove();
                    if (done) {
                        done();
                    }
                }
            }

            $document.bind('keydown', function (evt) {
                var modal;

                if (evt.which === 27) {
                    modal = openedWindows.top();
                    if (modal && modal.value.keyboard) {
                        evt.preventDefault();
                        $rootScope.$apply(function () {
                            $modalStack.dismiss(modal.key, 'escape key press');
                        });
                    }
                }
            });

            $modalStack.open = function (modalInstance, modal) {

                openedWindows.add(modalInstance, {
                    deferred: modal.deferred,
                    modalScope: modal.scope,
                    backdrop: modal.backdrop,
                    keyboard: modal.keyboard
                });

                var body = $document.find('body').eq(0),
                    currBackdropIndex = backdropIndex();

                if (currBackdropIndex >= 0 && !backdropDomEl) {
                    backdropScope = $rootScope.$new(true);
                    backdropScope.index = currBackdropIndex;
                    var angularBackgroundDomEl = angular.element('<div modal-backdrop></div>');
                    angularBackgroundDomEl.attr('backdrop-class', modal.backdropClass);
                    backdropDomEl = $compile(angularBackgroundDomEl)(backdropScope);
                    body.append(backdropDomEl);
                }

                var angularDomEl = angular.element('<div modal-window></div>');
                angularDomEl.attr({
                    'template-url': modal.windowTemplateUrl,
                    'window-class': modal.windowClass,
                    'size': modal.size,
                    'index': openedWindows.length() - 1,
                    'animate': 'animate'
                }).html(modal.content);

                var modalDomEl = $compile(angularDomEl)(modal.scope);
                openedWindows.top().value.modalDomEl = modalDomEl;
                body.append(modalDomEl);
                body.addClass(OPENED_MODAL_CLASS);
            };

            $modalStack.close = function (modalInstance, result) {
                var modalWindow = openedWindows.get(modalInstance);
                if (modalWindow) {
                    modalWindow.value.deferred.resolve(result);
                    removeModalWindow(modalInstance);
                }
            };

            $modalStack.dismiss = function (modalInstance, reason) {
                var modalWindow = openedWindows.get(modalInstance);
                if (modalWindow) {
                    modalWindow.value.deferred.reject(reason);
                    removeModalWindow(modalInstance);
                }
            };

            $modalStack.dismissAll = function (reason) {
                var topModal = this.getTop();
                while (topModal) {
                    this.dismiss(topModal.key, reason);
                    topModal = this.getTop();
                }
            };

            $modalStack.getTop = function () {
                return openedWindows.top();
            };

            return $modalStack;
        }])

    .provider('$modal', function () {

        var $modalProvider = {
            options: {
                backdrop: true, //can be also false or 'static'
                keyboard: true
            },
            $get: ['$injector', '$rootScope', '$q', '$http', '$templateCache', '$controller', '$modalStack',
                function ($injector, $rootScope, $q, $http, $templateCache, $controller, $modalStack) {

                    var $modal = {};

                    function getTemplatePromise(options) {
                        return options.template ? $q.when(options.template) :
                            $http.get(angular.isFunction(options.templateUrl) ? (options.templateUrl)() : options.templateUrl,
                                {cache: $templateCache}).then(function (result) {
                                    return result.data;
                                });
                    }

                    function getResolvePromises(resolves) {
                        var promisesArr = [];
                        angular.forEach(resolves, function (value) {
                            if (angular.isFunction(value) || angular.isArray(value)) {
                                promisesArr.push($q.when($injector.invoke(value)));
                            }
                        });
                        return promisesArr;
                    }

                    $modal.open = function (modalOptions) {

                        var modalResultDeferred = $q.defer();
                        var modalOpenedDeferred = $q.defer();

                        //prepare an instance of a modal to be injected into controllers and returned to a caller
                        var modalInstance = {
                            result: modalResultDeferred.promise,
                            opened: modalOpenedDeferred.promise,
                            close: function (result) {
                                $modalStack.close(modalInstance, result);
                            },
                            dismiss: function (reason) {
                                $modalStack.dismiss(modalInstance, reason);
                            }
                        };

                        //merge and clean up options
                        modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
                        modalOptions.resolve = modalOptions.resolve || {};

                        //verify options
                        if (!modalOptions.template && !modalOptions.templateUrl) {
                            throw new Error('One of template or templateUrl options is required.');
                        }

                        var templateAndResolvePromise =
                            $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));


                        templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {

                            var modalScope = (modalOptions.scope || $rootScope).$new();
                            modalScope.$close = modalInstance.close;
                            modalScope.$dismiss = modalInstance.dismiss;

                            var ctrlInstance, ctrlLocals = {};
                            var resolveIter = 1;

                            //controllers
                            if (modalOptions.controller) {
                                ctrlLocals.$scope = modalScope;
                                ctrlLocals.$modalInstance = modalInstance;
                                angular.forEach(modalOptions.resolve, function (value, key) {
                                    ctrlLocals[key] = tplAndVars[resolveIter++];
                                });

                                ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                                if (modalOptions.controllerAs) {
                                    modalScope[modalOptions.controllerAs] = ctrlInstance;
                                }
                            }

                            $modalStack.open(modalInstance, {
                                scope: modalScope,
                                deferred: modalResultDeferred,
                                content: tplAndVars[0],
                                backdrop: modalOptions.backdrop,
                                keyboard: modalOptions.keyboard,
                                backdropClass: modalOptions.backdropClass,
                                windowClass: modalOptions.windowClass,
                                windowTemplateUrl: modalOptions.windowTemplateUrl,
                                size: modalOptions.size
                            });

                        }, function resolveError(reason) {
                            modalResultDeferred.reject(reason);
                        });

                        templateAndResolvePromise.then(function () {
                            modalOpenedDeferred.resolve(true);
                        }, function () {
                            modalOpenedDeferred.reject(false);
                        });

                        return modalInstance;
                    };

                    return $modal;
                }]
        };

        return $modalProvider;
    });

angular.module('ui.bootstrap.pagination', [])

    .controller('PaginationController', ['$scope', '$attrs', '$parse', function ($scope, $attrs, $parse) {
        var self = this,
            ngModelCtrl = { $setViewValue: angular.noop }, // nullModelCtrl
            setNumPages = $attrs.numPages ? $parse($attrs.numPages).assign : angular.noop;

        this.init = function(ngModelCtrl_, config) {
            ngModelCtrl = ngModelCtrl_;
            this.config = config;

            ngModelCtrl.$render = function() {
                self.render();
            };

            if ($attrs.itemsPerPage) {
                $scope.$parent.$watch($parse($attrs.itemsPerPage), function(value) {
                    self.itemsPerPage = parseInt(value, 10);
                    $scope.totalPages = self.calculateTotalPages();
                });
            } else {
                this.itemsPerPage = config.itemsPerPage;
            }
        };

        this.calculateTotalPages = function() {
            var totalPages = this.itemsPerPage < 1 ? 1 : Math.ceil($scope.totalItems / this.itemsPerPage);
            return Math.max(totalPages || 0, 1);
        };

        this.render = function() {
            $scope.page = parseInt(ngModelCtrl.$viewValue, 10) || 1;
        };

        $scope.selectPage = function(page) {
            if ( $scope.page !== page && page > 0 && page <= $scope.totalPages) {
                ngModelCtrl.$setViewValue(page);
                ngModelCtrl.$render();
            }
        };

        $scope.getText = function( key ) {
            return $scope[key + 'Text'] || self.config[key + 'Text'];
        };
        $scope.noPrevious = function() {
            return $scope.page === 1;
        };
        $scope.noNext = function() {
            return $scope.page === $scope.totalPages;
        };

        $scope.$watch('totalItems', function() {
            $scope.totalPages = self.calculateTotalPages();
        });

        $scope.$watch('totalPages', function(value) {
            setNumPages($scope.$parent, value); // Readonly variable

            if ( $scope.page > value ) {
                $scope.selectPage(value);
            } else {
                ngModelCtrl.$render();
            }
        });
    }])

    .constant('paginationConfig', {
        itemsPerPage: 10,
        boundaryLinks: false,
        directionLinks: true,
        firstText: 'First',
        previousText: 'Previous',
        nextText: 'Next',
        lastText: 'Last',
        rotate: true
    })

    .directive('pagination', ['$parse', 'paginationConfig', function($parse, paginationConfig) {
        return {
            restrict: 'EA',
            scope: {
                totalItems: '=',
                firstText: '@',
                previousText: '@',
                nextText: '@',
                lastText: '@'
            },
            require: ['pagination', '?ngModel'],
            controller: 'PaginationController',
            templateUrl: 'template/pagination/pagination.html',
            replace: true,
            link: function(scope, element, attrs, ctrls) {
                var paginationCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                if (!ngModelCtrl) {
                    return; // do nothing if no ng-model
                }

                // Setup configuration parameters
                var maxSize = angular.isDefined(attrs.maxSize) ? scope.$parent.$eval(attrs.maxSize) : paginationConfig.maxSize,
                    rotate = angular.isDefined(attrs.rotate) ? scope.$parent.$eval(attrs.rotate) : paginationConfig.rotate;
                scope.boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$parent.$eval(attrs.boundaryLinks) : paginationConfig.boundaryLinks;
                scope.directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$parent.$eval(attrs.directionLinks) : paginationConfig.directionLinks;

                paginationCtrl.init(ngModelCtrl, paginationConfig);

                if (attrs.maxSize) {
                    scope.$parent.$watch($parse(attrs.maxSize), function(value) {
                        maxSize = parseInt(value, 10);
                        paginationCtrl.render();
                    });
                }

                // Create page object used in template
                function makePage(number, text, isActive) {
                    return {
                        number: number,
                        text: text,
                        active: isActive
                    };
                }

                function getPages(currentPage, totalPages) {
                    var pages = [];

                    // Default page limits
                    var startPage = 1, endPage = totalPages;
                    var isMaxSized = ( angular.isDefined(maxSize) && maxSize < totalPages );

                    // recompute if maxSize
                    if ( isMaxSized ) {
                        if ( rotate ) {
                            // Current page is displayed in the middle of the visible ones
                            startPage = Math.max(currentPage - Math.floor(maxSize/2), 1);
                            endPage   = startPage + maxSize - 1;

                            // Adjust if limit is exceeded
                            if (endPage > totalPages) {
                                endPage   = totalPages;
                                startPage = endPage - maxSize + 1;
                            }
                        } else {
                            // Visible pages are paginated with maxSize
                            startPage = ((Math.ceil(currentPage / maxSize) - 1) * maxSize) + 1;

                            // Adjust last page if limit is exceeded
                            endPage = Math.min(startPage + maxSize - 1, totalPages);
                        }
                    }

                    // Add page number links
                    for (var number = startPage; number <= endPage; number++) {
                        var page = makePage(number, number, number === currentPage);
                        pages.push(page);
                    }

                    // Add links to move between page sets
                    if ( isMaxSized && ! rotate ) {
                        if ( startPage > 1 ) {
                            var previousPageSet = makePage(startPage - 1, '...', false);
                            pages.unshift(previousPageSet);
                        }

                        if ( endPage < totalPages ) {
                            var nextPageSet = makePage(endPage + 1, '...', false);
                            pages.push(nextPageSet);
                        }
                    }

                    return pages;
                }

                var originalRender = paginationCtrl.render;
                paginationCtrl.render = function() {
                    originalRender();
                    if (scope.page > 0 && scope.page <= scope.totalPages) {
                        scope.pages = getPages(scope.page, scope.totalPages);
                    }
                };
            }
        };
    }])

    .constant('pagerConfig', {
        itemsPerPage: 10,
        previousText: '« Previous',
        nextText: 'Next »',
        align: true
    })

    .directive('pager', ['pagerConfig', function(pagerConfig) {
        return {
            restrict: 'EA',
            scope: {
                totalItems: '=',
                previousText: '@',
                nextText: '@'
            },
            require: ['pager', '?ngModel'],
            controller: 'PaginationController',
            templateUrl: 'template/pagination/pager.html',
            replace: true,
            link: function(scope, element, attrs, ctrls) {
                var paginationCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                if (!ngModelCtrl) {
                    return; // do nothing if no ng-model
                }

                scope.align = angular.isDefined(attrs.align) ? scope.$parent.$eval(attrs.align) : pagerConfig.align;
                paginationCtrl.init(ngModelCtrl, pagerConfig);
            }
        };
    }]);

/**
 * The following features are still outstanding: animation as a
 * function, placement as a function, inside, support for more triggers than
 * just mouse enter/leave, html tooltips, and selector delegation.
 */
angular.module( 'ui.bootstrap.tooltip', [ 'ui.bootstrap.position', 'ui.bootstrap.bindHtml' ] )

/**
 * The $tooltip service creates tooltip- and popover-like directives as well as
 * houses global options for them.
 */
    .provider( '$tooltip', function () {
        // The default options tooltip and popover.
        var defaultOptions = {
            placement: 'top',
            animation: true,
            popupDelay: 0
        };

        // Default hide triggers for each show trigger
        var triggerMap = {
            'mouseenter': 'mouseleave',
            'click': 'click',
            'focus': 'blur'
        };

        // The options specified to the provider globally.
        var globalOptions = {};

        /**
         * `options({})` allows global configuration of all tooltips in the
         * application.
         *
         *   var app = angular.module( 'App', ['ui.bootstrap.tooltip'], function( $tooltipProvider ) {
   *     // place tooltips left instead of top by default
   *     $tooltipProvider.options( { placement: 'left' } );
   *   });
         */
        this.options = function( value ) {
            angular.extend( globalOptions, value );
        };

        /**
         * This allows you to extend the set of trigger mappings available. E.g.:
         *
         *   $tooltipProvider.setTriggers( 'openTrigger': 'closeTrigger' );
         */
        this.setTriggers = function setTriggers ( triggers ) {
            angular.extend( triggerMap, triggers );
        };

        /**
         * This is a helper function for translating camel-case to snake-case.
         */
        function snake_case(name){
            var regexp = /[A-Z]/g;
            var separator = '-';
            return name.replace(regexp, function(letter, pos) {
                return (pos ? separator : '') + letter.toLowerCase();
            });
        }

        /**
         * Returns the actual instance of the $tooltip service.
         * TODO support multiple triggers
         */
        this.$get = [ '$window', '$compile', '$timeout', '$document', '$position', '$interpolate', function ( $window, $compile, $timeout, $document, $position, $interpolate ) {
            return function $tooltip ( type, prefix, defaultTriggerShow ) {
                var options = angular.extend( {}, defaultOptions, globalOptions );

                /**
                 * Returns an object of show and hide triggers.
                 *
                 * If a trigger is supplied,
                 * it is used to show the tooltip; otherwise, it will use the `trigger`
                 * option passed to the `$tooltipProvider.options` method; else it will
                 * default to the trigger supplied to this directive factory.
                 *
                 * The hide trigger is based on the show trigger. If the `trigger` option
                 * was passed to the `$tooltipProvider.options` method, it will use the
                 * mapped trigger from `triggerMap` or the passed trigger if the map is
                 * undefined; otherwise, it uses the `triggerMap` value of the show
                 * trigger; else it will just use the show trigger.
                 */
                function getTriggers ( trigger ) {
                    var show = trigger || options.trigger || defaultTriggerShow;
                    var hide = triggerMap[show] || show;
                    return {
                        show: show,
                        hide: hide
                    };
                }

                var directiveName = snake_case( type );

                var startSym = $interpolate.startSymbol();
                var endSym = $interpolate.endSymbol();
                var template =
                    '<div '+ directiveName +'-popup '+
                    'title="'+startSym+'title'+endSym+'" '+
                    'content="'+startSym+'content'+endSym+'" '+
                    'placement="'+startSym+'placement'+endSym+'" '+
                    'animation="animation" '+
                    'is-open="isOpen"'+
                    '>'+
                    '</div>';

                return {
                    restrict: 'EA',
                    compile: function (tElem, tAttrs) {
                        var tooltipLinker = $compile( template );

                        return function link ( scope, element, attrs ) {
                            var tooltip;
                            var tooltipLinkedScope;
                            var transitionTimeout;
                            var popupTimeout;
                            var appendToBody = angular.isDefined( options.appendToBody ) ? options.appendToBody : false;
                            var triggers = getTriggers( undefined );
                            var hasEnableExp = angular.isDefined(attrs[prefix+'Enable']);
                            var ttScope = scope.$new(true);

                            var positionTooltip = function () {

                                var ttPosition = $position.positionElements(element, tooltip, ttScope.placement, appendToBody);
                                ttPosition.top += 'px';
                                ttPosition.left += 'px';

                                // Now set the calculated positioning.
                                tooltip.css( ttPosition );
                            };

                            // By default, the tooltip is not open.
                            // TODO add ability to start tooltip opened
                            ttScope.isOpen = false;

                            function toggleTooltipBind () {
                                if ( ! ttScope.isOpen ) {
                                    showTooltipBind();
                                } else {
                                    hideTooltipBind();
                                }
                            }

                            // Show the tooltip with delay if specified, otherwise show it immediately
                            function showTooltipBind() {
                                if(hasEnableExp && !scope.$eval(attrs[prefix+'Enable'])) {
                                    return;
                                }

                                prepareTooltip();

                                if ( ttScope.popupDelay ) {
                                    // Do nothing if the tooltip was already scheduled to pop-up.
                                    // This happens if show is triggered multiple times before any hide is triggered.
                                    if (!popupTimeout) {
                                        popupTimeout = $timeout( show, ttScope.popupDelay, false );
                                        popupTimeout.then(function(reposition){reposition();});
                                    }
                                } else {
                                    show()();
                                }
                            }

                            function hideTooltipBind () {
                                scope.$apply(function () {
                                    hide();
                                });
                            }

                            // Show the tooltip popup element.
                            function show() {

                                popupTimeout = null;

                                // If there is a pending remove transition, we must cancel it, lest the
                                // tooltip be mysteriously removed.
                                if ( transitionTimeout ) {
                                    $timeout.cancel( transitionTimeout );
                                    transitionTimeout = null;
                                }

                                // Don't show empty tooltips.
                                if ( ! ttScope.content ) {
                                    return angular.noop;
                                }

                                createTooltip();

                                // Set the initial positioning.
                                tooltip.css({ top: 0, left: 0, display: 'block' });
                                ttScope.$digest();

                                positionTooltip();

                                // And show the tooltip.
                                ttScope.isOpen = true;
                                ttScope.$digest(); // digest required as $apply is not called

                                // Return positioning function as promise callback for correct
                                // positioning after draw.
                                return positionTooltip;
                            }

                            // Hide the tooltip popup element.
                            function hide() {
                                // First things first: we don't show it anymore.
                                ttScope.isOpen = false;

                                //if tooltip is going to be shown after delay, we must cancel this
                                $timeout.cancel( popupTimeout );
                                popupTimeout = null;

                                // And now we remove it from the DOM. However, if we have animation, we
                                // need to wait for it to expire beforehand.
                                // FIXME: this is a placeholder for a port of the transitions library.
                                if ( ttScope.animation ) {
                                    if (!transitionTimeout) {
                                        transitionTimeout = $timeout(removeTooltip, 500);
                                    }
                                } else {
                                    removeTooltip();
                                }
                            }

                            function createTooltip() {
                                // There can only be one tooltip element per directive shown at once.
                                if (tooltip) {
                                    removeTooltip();
                                }
                                tooltipLinkedScope = ttScope.$new();
                                tooltip = tooltipLinker(tooltipLinkedScope, function (tooltip) {
                                    if ( appendToBody ) {
                                        $document.find( 'body' ).append( tooltip );
                                    } else {
                                        element.after( tooltip );
                                    }
                                });
                            }

                            function removeTooltip() {
                                transitionTimeout = null;
                                if (tooltip) {
                                    tooltip.remove();
                                    tooltip = null;
                                }
                                if (tooltipLinkedScope) {
                                    tooltipLinkedScope.$destroy();
                                    tooltipLinkedScope = null;
                                }
                            }

                            function prepareTooltip() {
                                prepPlacement();
                                prepPopupDelay();
                            }

                            /**
                             * Observe the relevant attributes.
                             */
                            attrs.$observe( type, function ( val ) {
                                ttScope.content = val;

                                if (!val && ttScope.isOpen ) {
                                    hide();
                                }
                            });

                            attrs.$observe( prefix+'Title', function ( val ) {
                                ttScope.title = val;
                            });

                            function prepPlacement() {
                                var val = attrs[ prefix + 'Placement' ];
                                ttScope.placement = angular.isDefined( val ) ? val : options.placement;
                            }

                            function prepPopupDelay() {
                                var val = attrs[ prefix + 'PopupDelay' ];
                                var delay = parseInt( val, 10 );
                                ttScope.popupDelay = ! isNaN(delay) ? delay : options.popupDelay;
                            }

                            var unregisterTriggers = function () {
                                element.unbind(triggers.show, showTooltipBind);
                                element.unbind(triggers.hide, hideTooltipBind);
                            };

                            function prepTriggers() {
                                var val = attrs[ prefix + 'Trigger' ];
                                unregisterTriggers();

                                triggers = getTriggers( val );

                                if ( triggers.show === triggers.hide ) {
                                    element.bind( triggers.show, toggleTooltipBind );
                                } else {
                                    element.bind( triggers.show, showTooltipBind );
                                    element.bind( triggers.hide, hideTooltipBind );
                                }
                            }
                            prepTriggers();

                            var animation = scope.$eval(attrs[prefix + 'Animation']);
                            ttScope.animation = angular.isDefined(animation) ? !!animation : options.animation;

                            var appendToBodyVal = scope.$eval(attrs[prefix + 'AppendToBody']);
                            appendToBody = angular.isDefined(appendToBodyVal) ? appendToBodyVal : appendToBody;

                            // if a tooltip is attached to <body> we need to remove it on
                            // location change as its parent scope will probably not be destroyed
                            // by the change.
                            if ( appendToBody ) {
                                scope.$on('$locationChangeSuccess', function closeTooltipOnLocationChangeSuccess () {
                                    if ( ttScope.isOpen ) {
                                        hide();
                                    }
                                });
                            }

                            // Make sure tooltip is destroyed and removed.
                            scope.$on('$destroy', function onDestroyTooltip() {
                                $timeout.cancel( transitionTimeout );
                                $timeout.cancel( popupTimeout );
                                unregisterTriggers();
                                removeTooltip();
                                ttScope = null;
                            });
                        };
                    }
                };
            };
        }];
    })

    .directive( 'tooltipPopup', function () {
        return {
            restrict: 'EA',
            replace: true,
            scope: { content: '@', placement: '@', animation: '&', isOpen: '&' },
            templateUrl: 'template/tooltip/tooltip-popup.html'
        };
    })

    .directive( 'tooltip', [ '$tooltip', function ( $tooltip ) {
        return $tooltip( 'tooltip', 'tooltip', 'mouseenter' );
    }])

    .directive( 'tooltipHtmlUnsafePopup', function () {
        return {
            restrict: 'EA',
            replace: true,
            scope: { content: '@', placement: '@', animation: '&', isOpen: '&' },
            templateUrl: 'template/tooltip/tooltip-html-unsafe-popup.html'
        };
    })

    .directive( 'tooltipHtmlUnsafe', [ '$tooltip', function ( $tooltip ) {
        return $tooltip( 'tooltipHtmlUnsafe', 'tooltip', 'mouseenter' );
    }]);

/**
 * The following features are still outstanding: popup delay, animation as a
 * function, placement as a function, inside, support for more triggers than
 * just mouse enter/leave, html popovers, and selector delegatation.
 */
angular.module( 'ui.bootstrap.popover', [ 'ui.bootstrap.tooltip' ] )

    .directive( 'popoverPopup', function () {
        return {
            restrict: 'EA',
            replace: true,
            scope: { title: '@', content: '@', placement: '@', animation: '&', isOpen: '&' },
            templateUrl: 'template/popover/popover.html'
        };
    })

    .directive( 'popover', [ '$tooltip', function ( $tooltip ) {
        return $tooltip( 'popover', 'popover', 'click' );
    }]);

angular.module('ui.bootstrap.progressbar', [])

    .constant('progressConfig', {
        animate: true,
        max: 100
    })

    .controller('ProgressController', ['$scope', '$attrs', 'progressConfig', function($scope, $attrs, progressConfig) {
        var self = this,
            animate = angular.isDefined($attrs.animate) ? $scope.$parent.$eval($attrs.animate) : progressConfig.animate;

        this.bars = [];
        $scope.max = angular.isDefined($attrs.max) ? $scope.$parent.$eval($attrs.max) : progressConfig.max;

        this.addBar = function(bar, element) {
            if ( !animate ) {
                element.css({'transition': 'none'});
            }

            this.bars.push(bar);

            bar.$watch('value', function( value ) {
                bar.percent = +(100 * value / $scope.max).toFixed(2);
            });

            bar.$on('$destroy', function() {
                element = null;
                self.removeBar(bar);
            });
        };

        this.removeBar = function(bar) {
            this.bars.splice(this.bars.indexOf(bar), 1);
        };
    }])

    .directive('progress', function() {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            controller: 'ProgressController',
            require: 'progress',
            scope: {},
            templateUrl: 'template/progressbar/progress.html'
        };
    })

    .directive('bar', function() {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            require: '^progress',
            scope: {
                value: '=',
                type: '@'
            },
            templateUrl: 'template/progressbar/bar.html',
            link: function(scope, element, attrs, progressCtrl) {
                progressCtrl.addBar(scope, element);
            }
        };
    })

    .directive('progressbar', function() {
        return {
            restrict: 'EA',
            replace: true,
            transclude: true,
            controller: 'ProgressController',
            scope: {
                value: '=',
                type: '@'
            },
            templateUrl: 'template/progressbar/progressbar.html',
            link: function(scope, element, attrs, progressCtrl) {
                progressCtrl.addBar(scope, angular.element(element.children()[0]));
            }
        };
    });
angular.module('ui.bootstrap.rating', [])

    .constant('ratingConfig', {
        max: 5,
        stateOn: null,
        stateOff: null
    })

    .controller('RatingController', ['$scope', '$attrs', 'ratingConfig', function($scope, $attrs, ratingConfig) {
        var ngModelCtrl  = { $setViewValue: angular.noop };

        this.init = function(ngModelCtrl_) {
            ngModelCtrl = ngModelCtrl_;
            ngModelCtrl.$render = this.render;

            this.stateOn = angular.isDefined($attrs.stateOn) ? $scope.$parent.$eval($attrs.stateOn) : ratingConfig.stateOn;
            this.stateOff = angular.isDefined($attrs.stateOff) ? $scope.$parent.$eval($attrs.stateOff) : ratingConfig.stateOff;

            var ratingStates = angular.isDefined($attrs.ratingStates) ? $scope.$parent.$eval($attrs.ratingStates) :
                new Array( angular.isDefined($attrs.max) ? $scope.$parent.$eval($attrs.max) : ratingConfig.max );
            $scope.range = this.buildTemplateObjects(ratingStates);
        };

        this.buildTemplateObjects = function(states) {
            for (var i = 0, n = states.length; i < n; i++) {
                states[i] = angular.extend({ index: i }, { stateOn: this.stateOn, stateOff: this.stateOff }, states[i]);
            }
            return states;
        };

        $scope.rate = function(value) {
            if ( !$scope.readonly && value >= 0 && value <= $scope.range.length ) {
                ngModelCtrl.$setViewValue(value);
                ngModelCtrl.$render();
            }
        };

        $scope.enter = function(value) {
            if ( !$scope.readonly ) {
                $scope.value = value;
            }
            $scope.onHover({value: value});
        };

        $scope.reset = function() {
            $scope.value = ngModelCtrl.$viewValue;
            $scope.onLeave();
        };

        $scope.onKeydown = function(evt) {
            if (/(37|38|39|40)/.test(evt.which)) {
                evt.preventDefault();
                evt.stopPropagation();
                $scope.rate( $scope.value + (evt.which === 38 || evt.which === 39 ? 1 : -1) );
            }
        };

        this.render = function() {
            $scope.value = ngModelCtrl.$viewValue;
        };
    }])

    .directive('rating', function() {
        return {
            restrict: 'EA',
            require: ['rating', 'ngModel'],
            scope: {
                readonly: '=?',
                onHover: '&',
                onLeave: '&'
            },
            controller: 'RatingController',
            templateUrl: 'template/rating/rating.html',
            replace: true,
            link: function(scope, element, attrs, ctrls) {
                var ratingCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                if ( ngModelCtrl ) {
                    ratingCtrl.init( ngModelCtrl );
                }
            }
        };
    });

/**
 * @ngdoc overview
 * @name ui.bootstrap.tabs
 *
 * @description
 * AngularJS version of the tabs directive.
 */

angular.module('ui.bootstrap.tabs', [])

    .controller('TabsetController', ['$scope', function TabsetCtrl($scope) {
        var ctrl = this,
            tabs = ctrl.tabs = $scope.tabs = [];

        ctrl.select = function(selectedTab) {
            angular.forEach(tabs, function(tab) {
                if (tab.active && tab !== selectedTab) {
                    tab.active = false;
                    tab.onDeselect();
                }
            });
            selectedTab.active = true;
            selectedTab.onSelect();
        };

        ctrl.addTab = function addTab(tab) {
            tabs.push(tab);
            // we can't run the select function on the first tab
            // since that would select it twice
            if (tabs.length === 1) {
                tab.active = true;
            } else if (tab.active) {
                ctrl.select(tab);
            }
        };

        ctrl.removeTab = function removeTab(tab) {
            var index = tabs.indexOf(tab);
            //Select a new tab if the tab to be removed is selected and not destroyed
            if (tab.active && tabs.length > 1 && !destroyed) {
                //If this is the last tab, select the previous tab. else, the next tab.
                var newActiveIndex = index == tabs.length - 1 ? index - 1 : index + 1;
                ctrl.select(tabs[newActiveIndex]);
            }
            tabs.splice(index, 1);
        };

        var destroyed;
        $scope.$on('$destroy', function() {
            destroyed = true;
        });
    }])

/**
 * @ngdoc directive
 * @name ui.bootstrap.tabs.directive:tabset
 * @restrict EA
 *
 * @description
 * Tabset is the outer container for the tabs directive
 *
 * @param {boolean=} vertical Whether or not to use vertical styling for the tabs.
 * @param {boolean=} justified Whether or not to use justified styling for the tabs.
 *
 * @example
 <example module="ui.bootstrap">
 <file name="index.html">
 <tabset>
 <tab heading="Tab 1"><b>First</b> Content!</tab>
 <tab heading="Tab 2"><i>Second</i> Content!</tab>
 </tabset>
 <hr />
 <tabset vertical="true">
 <tab heading="Vertical Tab 1"><b>First</b> Vertical Content!</tab>
 <tab heading="Vertical Tab 2"><i>Second</i> Vertical Content!</tab>
 </tabset>
 <tabset justified="true">
 <tab heading="Justified Tab 1"><b>First</b> Justified Content!</tab>
 <tab heading="Justified Tab 2"><i>Second</i> Justified Content!</tab>
 </tabset>
 </file>
 </example>
 */
    .directive('tabset', function() {
        return {
            restrict: 'EA',
            transclude: true,
            replace: true,
            scope: {
                type: '@'
            },
            controller: 'TabsetController',
            templateUrl: 'template/tabs/tabset.html',
            link: function(scope, element, attrs) {
                scope.vertical = angular.isDefined(attrs.vertical) ? scope.$parent.$eval(attrs.vertical) : false;
                scope.justified = angular.isDefined(attrs.justified) ? scope.$parent.$eval(attrs.justified) : false;
            }
        };
    })

/**
 * @ngdoc directive
 * @name ui.bootstrap.tabs.directive:tab
 * @restrict EA
 *
 * @param {string=} heading The visible heading, or title, of the tab. Set HTML headings with {@link ui.bootstrap.tabs.directive:tabHeading tabHeading}.
 * @param {string=} select An expression to evaluate when the tab is selected.
 * @param {boolean=} active A binding, telling whether or not this tab is selected.
 * @param {boolean=} disabled A binding, telling whether or not this tab is disabled.
 *
 * @description
 * Creates a tab with a heading and content. Must be placed within a {@link ui.bootstrap.tabs.directive:tabset tabset}.
 *
 * @example
 <example module="ui.bootstrap">
 <file name="index.html">
 <div ng-controller="TabsDemoCtrl">
 <button class="btn btn-small" ng-click="items[0].active = true">
 Select item 1, using active binding
 </button>
 <button class="btn btn-small" ng-click="items[1].disabled = !items[1].disabled">
 Enable/disable item 2, using disabled binding
 </button>
 <br />
 <tabset>
 <tab heading="Tab 1">First Tab</tab>
 <tab select="alertMe()">
 <tab-heading><i class="icon-bell"></i> Alert me!</tab-heading>
 Second Tab, with alert callback and html heading!
 </tab>
 <tab ng-repeat="item in items"
 heading="{{item.title}}"
 disabled="item.disabled"
 active="item.active">
 {{item.content}}
 </tab>
 </tabset>
 </div>
 </file>
 <file name="script.js">
 function TabsDemoCtrl($scope) {
      $scope.items = [
        { title:"Dynamic Title 1", content:"Dynamic Item 0" },
        { title:"Dynamic Title 2", content:"Dynamic Item 1", disabled: true }
      ];

      $scope.alertMe = function() {
        setTimeout(function() {
          alert("You've selected the alert tab!");
        });
      };
    };
 </file>
 </example>
 */

/**
 * @ngdoc directive
 * @name ui.bootstrap.tabs.directive:tabHeading
 * @restrict EA
 *
 * @description
 * Creates an HTML heading for a {@link ui.bootstrap.tabs.directive:tab tab}. Must be placed as a child of a tab element.
 *
 * @example
 <example module="ui.bootstrap">
 <file name="index.html">
 <tabset>
 <tab>
 <tab-heading><b>HTML</b> in my titles?!</tab-heading>
 And some content, too!
 </tab>
 <tab>
 <tab-heading><i class="icon-heart"></i> Icon heading?!?</tab-heading>
 That's right.
 </tab>
 </tabset>
 </file>
 </example>
 */
    .directive('tab', ['$parse', function($parse) {
        return {
            require: '^tabset',
            restrict: 'EA',
            replace: true,
            templateUrl: 'template/tabs/tab.html',
            transclude: true,
            scope: {
                active: '=?',
                heading: '@',
                onSelect: '&select', //This callback is called in contentHeadingTransclude
                //once it inserts the tab's content into the dom
                onDeselect: '&deselect'
            },
            controller: function() {
                //Empty controller so other directives can require being 'under' a tab
            },
            compile: function(elm, attrs, transclude) {
                return function postLink(scope, elm, attrs, tabsetCtrl) {
                    scope.$watch('active', function(active) {
                        if (active) {
                            tabsetCtrl.select(scope);
                        }
                    });

                    scope.disabled = false;
                    if ( attrs.disabled ) {
                        scope.$parent.$watch($parse(attrs.disabled), function(value) {
                            scope.disabled = !! value;
                        });
                    }

                    scope.select = function() {
                        if ( !scope.disabled ) {
                            scope.active = true;
                        }
                    };

                    tabsetCtrl.addTab(scope);
                    scope.$on('$destroy', function() {
                        tabsetCtrl.removeTab(scope);
                    });

                    //We need to transclude later, once the content container is ready.
                    //when this link happens, we're inside a tab heading.
                    scope.$transcludeFn = transclude;
                };
            }
        };
    }])

    .directive('tabHeadingTransclude', [function() {
        return {
            restrict: 'A',
            require: '^tab',
            link: function(scope, elm, attrs, tabCtrl) {
                scope.$watch('headingElement', function updateHeadingElement(heading) {
                    if (heading) {
                        elm.html('');
                        elm.append(heading);
                    }
                });
            }
        };
    }])

    .directive('tabContentTransclude', function() {
        return {
            restrict: 'A',
            require: '^tabset',
            link: function(scope, elm, attrs) {
                var tab = scope.$eval(attrs.tabContentTransclude);

                //Now our tab is ready to be transcluded: both the tab heading area
                //and the tab content area are loaded.  Transclude 'em both.
                tab.$transcludeFn(tab.$parent, function(contents) {
                    angular.forEach(contents, function(node) {
                        if (isTabHeading(node)) {
                            //Let tabHeadingTransclude know.
                            tab.headingElement = node;
                        } else {
                            elm.append(node);
                        }
                    });
                });
            }
        };
        function isTabHeading(node) {
            return node.tagName &&  (
                node.hasAttribute('tab-heading') ||
                node.hasAttribute('data-tab-heading') ||
                node.tagName.toLowerCase() === 'tab-heading' ||
                node.tagName.toLowerCase() === 'data-tab-heading'
                );
        }
    })

;

angular.module('ui.bootstrap.timepicker', [])

    .constant('timepickerConfig', {
        hourStep: 1,
        minuteStep: 1,
        showMeridian: true,
        meridians: null,
        readonlyInput: false,
        mousewheel: true
    })

    .controller('TimepickerController', ['$scope', '$attrs', '$parse', '$log', '$locale', 'timepickerConfig', function($scope, $attrs, $parse, $log, $locale, timepickerConfig) {
        var selected = new Date(),
            ngModelCtrl = { $setViewValue: angular.noop }, // nullModelCtrl
            meridians = angular.isDefined($attrs.meridians) ? $scope.$parent.$eval($attrs.meridians) : timepickerConfig.meridians || $locale.DATETIME_FORMATS.AMPMS;

        this.init = function( ngModelCtrl_, inputs ) {
            ngModelCtrl = ngModelCtrl_;
            ngModelCtrl.$render = this.render;

            var hoursInputEl = inputs.eq(0),
                minutesInputEl = inputs.eq(1);

            var mousewheel = angular.isDefined($attrs.mousewheel) ? $scope.$parent.$eval($attrs.mousewheel) : timepickerConfig.mousewheel;
            if ( mousewheel ) {
                this.setupMousewheelEvents( hoursInputEl, minutesInputEl );
            }

            $scope.readonlyInput = angular.isDefined($attrs.readonlyInput) ? $scope.$parent.$eval($attrs.readonlyInput) : timepickerConfig.readonlyInput;
            this.setupInputEvents( hoursInputEl, minutesInputEl );
        };

        var hourStep = timepickerConfig.hourStep;
        if ($attrs.hourStep) {
            $scope.$parent.$watch($parse($attrs.hourStep), function(value) {
                hourStep = parseInt(value, 10);
            });
        }

        var minuteStep = timepickerConfig.minuteStep;
        if ($attrs.minuteStep) {
            $scope.$parent.$watch($parse($attrs.minuteStep), function(value) {
                minuteStep = parseInt(value, 10);
            });
        }

        // 12H / 24H mode
        $scope.showMeridian = timepickerConfig.showMeridian;
        if ($attrs.showMeridian) {
            $scope.$parent.$watch($parse($attrs.showMeridian), function(value) {
                $scope.showMeridian = !!value;

                if ( ngModelCtrl.$error.time ) {
                    // Evaluate from template
                    var hours = getHoursFromTemplate(), minutes = getMinutesFromTemplate();
                    if (angular.isDefined( hours ) && angular.isDefined( minutes )) {
                        selected.setHours( hours );
                        refresh();
                    }
                } else {
                    updateTemplate();
                }
            });
        }

        // Get $scope.hours in 24H mode if valid
        function getHoursFromTemplate ( ) {
            var hours = parseInt( $scope.hours, 10 );
            var valid = ( $scope.showMeridian ) ? (hours > 0 && hours < 13) : (hours >= 0 && hours < 24);
            if ( !valid ) {
                return undefined;
            }

            if ( $scope.showMeridian ) {
                if ( hours === 12 ) {
                    hours = 0;
                }
                if ( $scope.meridian === meridians[1] ) {
                    hours = hours + 12;
                }
            }
            return hours;
        }

        function getMinutesFromTemplate() {
            var minutes = parseInt($scope.minutes, 10);
            return ( minutes >= 0 && minutes < 60 ) ? minutes : undefined;
        }

        function pad( value ) {
            return ( angular.isDefined(value) && value.toString().length < 2 ) ? '0' + value : value;
        }

        // Respond on mousewheel spin
        this.setupMousewheelEvents = function( hoursInputEl, minutesInputEl ) {
            var isScrollingUp = function(e) {
                if (e.originalEvent) {
                    e = e.originalEvent;
                }
                //pick correct delta variable depending on event
                var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
                return (e.detail || delta > 0);
            };

            hoursInputEl.bind('mousewheel wheel', function(e) {
                $scope.$apply( (isScrollingUp(e)) ? $scope.incrementHours() : $scope.decrementHours() );
                e.preventDefault();
            });

            minutesInputEl.bind('mousewheel wheel', function(e) {
                $scope.$apply( (isScrollingUp(e)) ? $scope.incrementMinutes() : $scope.decrementMinutes() );
                e.preventDefault();
            });

        };

        this.setupInputEvents = function( hoursInputEl, minutesInputEl ) {
            if ( $scope.readonlyInput ) {
                $scope.updateHours = angular.noop;
                $scope.updateMinutes = angular.noop;
                return;
            }

            var invalidate = function(invalidHours, invalidMinutes) {
                ngModelCtrl.$setViewValue( null );
                ngModelCtrl.$setValidity('time', false);
                if (angular.isDefined(invalidHours)) {
                    $scope.invalidHours = invalidHours;
                }
                if (angular.isDefined(invalidMinutes)) {
                    $scope.invalidMinutes = invalidMinutes;
                }
            };

            $scope.updateHours = function() {
                var hours = getHoursFromTemplate();

                if ( angular.isDefined(hours) ) {
                    selected.setHours( hours );
                    refresh( 'h' );
                } else {
                    invalidate(true);
                }
            };

            hoursInputEl.bind('blur', function(e) {
                if ( !$scope.invalidHours && $scope.hours < 10) {
                    $scope.$apply( function() {
                        $scope.hours = pad( $scope.hours );
                    });
                }
            });

            $scope.updateMinutes = function() {
                var minutes = getMinutesFromTemplate();

                if ( angular.isDefined(minutes) ) {
                    selected.setMinutes( minutes );
                    refresh( 'm' );
                } else {
                    invalidate(undefined, true);
                }
            };

            minutesInputEl.bind('blur', function(e) {
                if ( !$scope.invalidMinutes && $scope.minutes < 10 ) {
                    $scope.$apply( function() {
                        $scope.minutes = pad( $scope.minutes );
                    });
                }
            });

        };

        this.render = function() {
            var date = ngModelCtrl.$modelValue ? new Date( ngModelCtrl.$modelValue ) : null;

            if ( isNaN(date) ) {
                ngModelCtrl.$setValidity('time', false);
                $log.error('Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
            } else {
                if ( date ) {
                    selected = date;
                }
                makeValid();
                updateTemplate();
            }
        };

        // Call internally when we know that model is valid.
        function refresh( keyboardChange ) {
            makeValid();
            ngModelCtrl.$setViewValue( new Date(selected) );
            updateTemplate( keyboardChange );
        }

        function makeValid() {
            ngModelCtrl.$setValidity('time', true);
            $scope.invalidHours = false;
            $scope.invalidMinutes = false;
        }

        function updateTemplate( keyboardChange ) {
            var hours = selected.getHours(), minutes = selected.getMinutes();

            if ( $scope.showMeridian ) {
                hours = ( hours === 0 || hours === 12 ) ? 12 : hours % 12; // Convert 24 to 12 hour system
            }

            $scope.hours = keyboardChange === 'h' ? hours : pad(hours);
            $scope.minutes = keyboardChange === 'm' ? minutes : pad(minutes);
            $scope.meridian = selected.getHours() < 12 ? meridians[0] : meridians[1];
        }

        function addMinutes( minutes ) {
            var dt = new Date( selected.getTime() + minutes * 60000 );
            selected.setHours( dt.getHours(), dt.getMinutes() );
            refresh();
        }

        $scope.incrementHours = function() {
            addMinutes( hourStep * 60 );
        };
        $scope.decrementHours = function() {
            addMinutes( - hourStep * 60 );
        };
        $scope.incrementMinutes = function() {
            addMinutes( minuteStep );
        };
        $scope.decrementMinutes = function() {
            addMinutes( - minuteStep );
        };
        $scope.toggleMeridian = function() {
            addMinutes( 12 * 60 * (( selected.getHours() < 12 ) ? 1 : -1) );
        };
    }])

    .directive('timepicker', function () {
        return {
            restrict: 'EA',
            require: ['timepicker', '?^ngModel'],
            controller:'TimepickerController',
            replace: true,
            scope: {},
            templateUrl: 'template/timepicker/timepicker.html',
            link: function(scope, element, attrs, ctrls) {
                var timepickerCtrl = ctrls[0], ngModelCtrl = ctrls[1];

                if ( ngModelCtrl ) {
                    timepickerCtrl.init( ngModelCtrl, element.find('input') );
                }
            }
        };
    });

angular.module('ui.bootstrap.typeahead', ['ui.bootstrap.position', 'ui.bootstrap.bindHtml'])

/**
 * A helper service that can parse typeahead's syntax (string provided by users)
 * Extracted to a separate service for ease of unit testing
 */
    .factory('typeaheadParser', ['$parse', function ($parse) {

        //                      00000111000000000000022200000000000000003333333333333330000000000044000
        var TYPEAHEAD_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+([\s\S]+?)$/;

        return {
            parse:function (input) {

                var match = input.match(TYPEAHEAD_REGEXP);
                if (!match) {
                    throw new Error(
                        'Expected typeahead specification in form of "_modelValue_ (as _label_)? for _item_ in _collection_"' +
                        ' but got "' + input + '".');
                }

                return {
                    itemName:match[3],
                    source:$parse(match[4]),
                    viewMapper:$parse(match[2] || match[1]),
                    modelMapper:$parse(match[1])
                };
            }
        };
    }])

    .directive('typeahead', ['$compile', '$parse', '$q', '$timeout', '$document', '$position', 'typeaheadParser',
        function ($compile, $parse, $q, $timeout, $document, $position, typeaheadParser) {

            var HOT_KEYS = [9, 13, 27, 38, 40];

            return {
                require:'ngModel',
                link:function (originalScope, element, attrs, modelCtrl) {

                    //SUPPORTED ATTRIBUTES (OPTIONS)

                    //minimal no of characters that needs to be entered before typeahead kicks-in
                    var minSearch = originalScope.$eval(attrs.typeaheadMinLength) || 1;

                    //minimal wait time after last character typed before typehead kicks-in
                    var waitTime = originalScope.$eval(attrs.typeaheadWaitMs) || 0;

                    //should it restrict model values to the ones selected from the popup only?
                    var isEditable = originalScope.$eval(attrs.typeaheadEditable) !== false;

                    //binding to a variable that indicates if matches are being retrieved asynchronously
                    var isLoadingSetter = $parse(attrs.typeaheadLoading).assign || angular.noop;

                    //a callback executed when a match is selected
                    var onSelectCallback = $parse(attrs.typeaheadOnSelect);

                    var inputFormatter = attrs.typeaheadInputFormatter ? $parse(attrs.typeaheadInputFormatter) : undefined;

                    var appendToBody =  attrs.typeaheadAppendToBody ? originalScope.$eval(attrs.typeaheadAppendToBody) : false;

                    var focusFirst = originalScope.$eval(attrs.typeaheadFocusFirst) !== false;

                    //INTERNAL VARIABLES

                    //model setter executed upon match selection
                    var $setModelValue = $parse(attrs.ngModel).assign;

                    //expressions used by typeahead
                    var parserResult = typeaheadParser.parse(attrs.typeahead);

                    var hasFocus;

                    //create a child scope for the typeahead directive so we are not polluting original scope
                    //with typeahead-specific data (matches, query etc.)
                    var scope = originalScope.$new();
                    originalScope.$on('$destroy', function(){
                        scope.$destroy();
                    });

                    // WAI-ARIA
                    var popupId = 'typeahead-' + scope.$id + '-' + Math.floor(Math.random() * 10000);
                    element.attr({
                        'aria-autocomplete': 'list',
                        'aria-expanded': false,
                        'aria-owns': popupId
                    });

                    //pop-up element used to display matches
                    var popUpEl = angular.element('<div typeahead-popup></div>');
                    popUpEl.attr({
                        id: popupId,
                        matches: 'matches',
                        active: 'activeIdx',
                        select: 'select(activeIdx)',
                        query: 'query',
                        position: 'position'
                    });
                    //custom item template
                    if (angular.isDefined(attrs.typeaheadTemplateUrl)) {
                        popUpEl.attr('template-url', attrs.typeaheadTemplateUrl);
                    }

                    var resetMatches = function() {
                        scope.matches = [];
                        scope.activeIdx = -1;
                        element.attr('aria-expanded', false);
                    };

                    var getMatchId = function(index) {
                        return popupId + '-option-' + index;
                    };

                    // Indicate that the specified match is the active (pre-selected) item in the list owned by this typeahead.
                    // This attribute is added or removed automatically when the `activeIdx` changes.
                    scope.$watch('activeIdx', function(index) {
                        if (index < 0) {
                            element.removeAttr('aria-activedescendant');
                        } else {
                            element.attr('aria-activedescendant', getMatchId(index));
                        }
                    });

                    var getMatchesAsync = function(inputValue) {

                        var locals = {$viewValue: inputValue};
                        isLoadingSetter(originalScope, true);
                        $q.when(parserResult.source(originalScope, locals)).then(function(matches) {

                            //it might happen that several async queries were in progress if a user were typing fast
                            //but we are interested only in responses that correspond to the current view value
                            var onCurrentRequest = (inputValue === modelCtrl.$viewValue);
                            if (onCurrentRequest && hasFocus) {
                                if (matches.length > 0) {

                                    scope.activeIdx = focusFirst ? 0 : -1;
                                    scope.matches.length = 0;

                                    //transform labels
                                    for(var i=0; i<matches.length; i++) {
                                        locals[parserResult.itemName] = matches[i];
                                        scope.matches.push({
                                            id: getMatchId(i),
                                            label: parserResult.viewMapper(scope, locals),
                                            model: matches[i]
                                        });
                                    }

                                    scope.query = inputValue;
                                    //position pop-up with matches - we need to re-calculate its position each time we are opening a window
                                    //with matches as a pop-up might be absolute-positioned and position of an input might have changed on a page
                                    //due to other elements being rendered
                                    scope.position = appendToBody ? $position.offset(element) : $position.position(element);
                                    scope.position.top = scope.position.top + element.prop('offsetHeight');

                                    element.attr('aria-expanded', true);
                                } else {
                                    resetMatches();
                                }
                            }
                            if (onCurrentRequest) {
                                isLoadingSetter(originalScope, false);
                            }
                        }, function(){
                            resetMatches();
                            isLoadingSetter(originalScope, false);
                        });
                    };

                    resetMatches();

                    //we need to propagate user's query so we can higlight matches
                    scope.query = undefined;

                    //Declare the timeout promise var outside the function scope so that stacked calls can be cancelled later
                    var timeoutPromise;

                    var scheduleSearchWithTimeout = function(inputValue) {
                        timeoutPromise = $timeout(function () {
                            getMatchesAsync(inputValue);
                        }, waitTime);
                    };

                    var cancelPreviousTimeout = function() {
                        if (timeoutPromise) {
                            $timeout.cancel(timeoutPromise);
                        }
                    };

                    //plug into $parsers pipeline to open a typeahead on view changes initiated from DOM
                    //$parsers kick-in on all the changes coming from the view as well as manually triggered by $setViewValue
                    modelCtrl.$parsers.unshift(function (inputValue) {

                        hasFocus = true;

                        if (inputValue && inputValue.length >= minSearch) {
                            if (waitTime > 0) {
                                cancelPreviousTimeout();
                                scheduleSearchWithTimeout(inputValue);
                            } else {
                                getMatchesAsync(inputValue);
                            }
                        } else {
                            isLoadingSetter(originalScope, false);
                            cancelPreviousTimeout();
                            resetMatches();
                        }

                        if (isEditable) {
                            return inputValue;
                        } else {
                            if (!inputValue) {
                                // Reset in case user had typed something previously.
                                modelCtrl.$setValidity('editable', true);
                                return inputValue;
                            } else {
                                modelCtrl.$setValidity('editable', false);
                                return undefined;
                            }
                        }
                    });

                    modelCtrl.$formatters.push(function (modelValue) {

                        var candidateViewValue, emptyViewValue;
                        var locals = {};

                        if (inputFormatter) {

                            locals.$model = modelValue;
                            return inputFormatter(originalScope, locals);

                        } else {

                            //it might happen that we don't have enough info to properly render input value
                            //we need to check for this situation and simply return model value if we can't apply custom formatting
                            locals[parserResult.itemName] = modelValue;
                            candidateViewValue = parserResult.viewMapper(originalScope, locals);
                            locals[parserResult.itemName] = undefined;
                            emptyViewValue = parserResult.viewMapper(originalScope, locals);

                            return candidateViewValue!== emptyViewValue ? candidateViewValue : modelValue;
                        }
                    });

                    scope.select = function (activeIdx) {
                        //called from within the $digest() cycle
                        var locals = {};
                        var model, item;

                        locals[parserResult.itemName] = item = scope.matches[activeIdx].model;
                        model = parserResult.modelMapper(originalScope, locals);
                        $setModelValue(originalScope, model);
                        modelCtrl.$setValidity('editable', true);

                        onSelectCallback(originalScope, {
                            $item: item,
                            $model: model,
                            $label: parserResult.viewMapper(originalScope, locals)
                        });

                        resetMatches();

                        //return focus to the input element if a match was selected via a mouse click event
                        // use timeout to avoid $rootScope:inprog error
                        $timeout(function() { element[0].focus(); }, 0, false);
                    };

                    //bind keyboard events: arrows up(38) / down(40), enter(13) and tab(9), esc(27)
                    element.bind('keydown', function (evt) {

                        //typeahead is open and an "interesting" key was pressed
                        if (scope.matches.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
                            return;
                        }

                        // if there's nothing selected (i.e. focusFirst) and enter is hit, don't do anything
                        if (scope.activeIdx == -1 && (evt.which === 13 || evt.which === 9)) {
                            return;
                        }

                        evt.preventDefault();

                        if (evt.which === 40) {
                            scope.activeIdx = (scope.activeIdx + 1) % scope.matches.length;
                            scope.$digest();

                        } else if (evt.which === 38) {
                            scope.activeIdx = (scope.activeIdx > 0 ? scope.activeIdx : scope.matches.length) - 1;
                            scope.$digest();

                        } else if (evt.which === 13 || evt.which === 9) {
                            scope.$apply(function () {
                                scope.select(scope.activeIdx);
                            });

                        } else if (evt.which === 27) {
                            evt.stopPropagation();

                            resetMatches();
                            scope.$digest();
                        }
                    });

                    element.bind('blur', function (evt) {
                        hasFocus = false;
                    });

                    // Keep reference to click handler to unbind it.
                    var dismissClickHandler = function (evt) {
                        if (element[0] !== evt.target) {
                            resetMatches();
                            scope.$digest();
                        }
                    };

                    $document.bind('click', dismissClickHandler);

                    originalScope.$on('$destroy', function(){
                        $document.unbind('click', dismissClickHandler);
                        if (appendToBody) {
                            $popup.remove();
                        }
                    });

                    var $popup = $compile(popUpEl)(scope);
                    if (appendToBody) {
                        $document.find('body').append($popup);
                    } else {
                        element.after($popup);
                    }
                }
            };

        }])

    .directive('typeaheadPopup', function () {
        return {
            restrict:'EA',
            scope:{
                matches:'=',
                query:'=',
                active:'=',
                position:'=',
                select:'&'
            },
            replace:true,
            templateUrl:'template/typeahead/typeahead-popup.html',
            link:function (scope, element, attrs) {

                scope.templateUrl = attrs.templateUrl;

                scope.isOpen = function () {
                    return scope.matches.length > 0;
                };

                scope.isActive = function (matchIdx) {
                    return scope.active == matchIdx;
                };

                scope.selectActive = function (matchIdx) {
                    scope.active = matchIdx;
                };

                scope.selectMatch = function (activeIdx) {
                    scope.select({activeIdx:activeIdx});
                };
            }
        };
    })

    .directive('typeaheadMatch', ['$http', '$templateCache', '$compile', '$parse', function ($http, $templateCache, $compile, $parse) {
        return {
            restrict:'EA',
            scope:{
                index:'=',
                match:'=',
                query:'='
            },
            link:function (scope, element, attrs) {
                var tplUrl = $parse(attrs.templateUrl)(scope.$parent) || 'template/typeahead/typeahead-match.html';
                $http.get(tplUrl, {cache: $templateCache}).success(function(tplContent){
                    element.replaceWith($compile(tplContent.trim())(scope));
                });
            }
        };
    }])

    .filter('typeaheadHighlight', function() {

        function escapeRegexp(queryToEscape) {
            return queryToEscape.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
        }

        return function(matchItem, query) {
            return query ? ('' + matchItem).replace(new RegExp(escapeRegexp(query), 'gi'), '<strong>$&</strong>') : matchItem;
        };
    });

angular.module("template/accordion/accordion-group.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/accordion/accordion-group.html",
        "<div class=\"panel panel-default\">\n" +
        "  <div class=\"panel-heading\">\n" +
        "    <h4 class=\"panel-title\">\n" +
        "      <a href class=\"accordion-toggle\" ng-click=\"toggleOpen()\" accordion-transclude=\"heading\"><span ng-class=\"{'text-muted': isDisabled}\">{{heading}}</span></a>\n" +
        "    </h4>\n" +
        "  </div>\n" +
        "  <div class=\"panel-collapse\" collapse=\"!isOpen\">\n" +
        "	  <div class=\"panel-body\" ng-transclude></div>\n" +
        "  </div>\n" +
        "</div>\n" +
        "");
}]);

angular.module("template/accordion/accordion.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/accordion/accordion.html",
        "<div class=\"panel-group\" ng-transclude></div>");
}]);

angular.module("template/alert/alert.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/alert/alert.html",
        "<div class=\"alert\" ng-class=\"['alert-' + (type || 'warning'), closeable ? 'alert-dismissable' : null]\" role=\"alert\">\n" +
        "    <button ng-show=\"closeable\" type=\"button\" class=\"close\" ng-click=\"close()\">\n" +
        "        <span aria-hidden=\"true\">&times;</span>\n" +
        "        <span class=\"sr-only\">Close</span>\n" +
        "    </button>\n" +
        "    <div ng-transclude></div>\n" +
        "</div>\n" +
        "");
}]);

angular.module("template/carousel/carousel.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/carousel/carousel.html",
        "<div ng-mouseenter=\"pause()\" ng-mouseleave=\"play()\" class=\"carousel\" ng-swipe-right=\"prev()\" ng-swipe-left=\"next()\">\n" +
        "    <ol class=\"carousel-indicators\" ng-show=\"slides.length > 1\">\n" +
        "        <li ng-repeat=\"slide in slides track by $index\" ng-class=\"{active: isActive(slide)}\" ng-click=\"select(slide)\"></li>\n" +
        "    </ol>\n" +
        "    <div class=\"carousel-inner\" ng-transclude></div>\n" +
        "    <a class=\"left carousel-control\" ng-click=\"prev()\" ng-show=\"slides.length > 1\"><span class=\"glyphicon glyphicon-chevron-left\"></span></a>\n" +
        "    <a class=\"right carousel-control\" ng-click=\"next()\" ng-show=\"slides.length > 1\"><span class=\"glyphicon glyphicon-chevron-right\"></span></a>\n" +
        "</div>\n" +
        "");
}]);

angular.module("template/carousel/slide.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/carousel/slide.html",
        "<div ng-class=\"{\n" +
        "    'active': leaving || (active && !entering),\n" +
        "    'prev': (next || active) && direction=='prev',\n" +
        "    'next': (next || active) && direction=='next',\n" +
        "    'right': direction=='prev',\n" +
        "    'left': direction=='next'\n" +
        "  }\" class=\"item text-center\" ng-transclude></div>\n" +
        "");
}]);

angular.module("template/datepicker/datepicker.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/datepicker/datepicker.html",
        "<div ng-switch=\"datepickerMode\" role=\"application\" ng-keydown=\"keydown($event)\">\n" +
        "  <daypicker ng-switch-when=\"day\" tabindex=\"0\"></daypicker>\n" +
        "  <monthpicker ng-switch-when=\"month\" tabindex=\"0\"></monthpicker>\n" +
        "  <yearpicker ng-switch-when=\"year\" tabindex=\"0\"></yearpicker>\n" +
        "</div>");
}]);

angular.module("template/datepicker/day.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/datepicker/day.html",
        "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
        "  <thead>\n" +
        "    <tr>\n" +
        "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
        "      <th colspan=\"{{5 + showWeeks}}\"><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
        "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
        "    </tr>\n" +
        "    <tr>\n" +
        "      <th ng-show=\"showWeeks\" class=\"text-center\"></th>\n" +
        "      <th ng-repeat=\"label in labels track by $index\" class=\"text-center\"><small aria-label=\"{{label.full}}\">{{label.abbr}}</small></th>\n" +
        "    </tr>\n" +
        "  </thead>\n" +
        "  <tbody>\n" +
        "    <tr ng-repeat=\"row in rows track by $index\">\n" +
        "      <td ng-show=\"showWeeks\" class=\"text-center h6\"><em>{{ weekNumbers[$index] }}</em></td>\n" +
        "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
        "        <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default btn-sm\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'text-muted': dt.secondary, 'text-info': dt.current}\">{{dt.label}}</span></button>\n" +
        "      </td>\n" +
        "    </tr>\n" +
        "  </tbody>\n" +
        "</table>\n" +
        "");
}]);

angular.module("template/datepicker/month.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/datepicker/month.html",
        "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
        "  <thead>\n" +
        "    <tr>\n" +
        "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
        "      <th><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
        "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
        "    </tr>\n" +
        "  </thead>\n" +
        "  <tbody>\n" +
        "    <tr ng-repeat=\"row in rows track by $index\">\n" +
        "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
        "        <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'text-info': dt.current}\">{{dt.label}}</span></button>\n" +
        "      </td>\n" +
        "    </tr>\n" +
        "  </tbody>\n" +
        "</table>\n" +
        "");
}]);

angular.module("template/datepicker/popup.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/datepicker/popup.html",
        "<ul class=\"dropdown-menu\" ng-style=\"{display: (isOpen && 'block') || 'none', top: position.top+'px', left: position.left+'px'}\" ng-keydown=\"keydown($event)\">\n" +
        "	<li ng-transclude></li>\n" +
        "	<li ng-if=\"showButtonBar\" style=\"padding:10px 9px 2px\">\n" +
        "		<span class=\"btn-group pull-left\">\n" +
        "			<button type=\"button\" class=\"btn btn-sm btn-info\" ng-click=\"select('today')\">{{ getText('current') }}</button>\n" +
        "			<button type=\"button\" class=\"btn btn-sm btn-danger\" ng-click=\"select(null)\">{{ getText('clear') }}</button>\n" +
        "		</span>\n" +
        "		<button type=\"button\" class=\"btn btn-sm btn-success pull-right\" ng-click=\"close()\">{{ getText('close') }}</button>\n" +
        "	</li>\n" +
        "</ul>\n" +
        "");
}]);

angular.module("template/datepicker/year.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/datepicker/year.html",
        "<table role=\"grid\" aria-labelledby=\"{{uniqueId}}-title\" aria-activedescendant=\"{{activeDateId}}\">\n" +
        "  <thead>\n" +
        "    <tr>\n" +
        "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-left\" ng-click=\"move(-1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-left\"></i></button></th>\n" +
        "      <th colspan=\"3\"><button id=\"{{uniqueId}}-title\" role=\"heading\" aria-live=\"assertive\" aria-atomic=\"true\" type=\"button\" class=\"btn btn-default btn-sm\" ng-click=\"toggleMode()\" tabindex=\"-1\" style=\"width:100%;\"><strong>{{title}}</strong></button></th>\n" +
        "      <th><button type=\"button\" class=\"btn btn-default btn-sm pull-right\" ng-click=\"move(1)\" tabindex=\"-1\"><i class=\"glyphicon glyphicon-chevron-right\"></i></button></th>\n" +
        "    </tr>\n" +
        "  </thead>\n" +
        "  <tbody>\n" +
        "    <tr ng-repeat=\"row in rows track by $index\">\n" +
        "      <td ng-repeat=\"dt in row track by dt.date\" class=\"text-center\" role=\"gridcell\" id=\"{{dt.uid}}\" aria-disabled=\"{{!!dt.disabled}}\">\n" +
        "        <button type=\"button\" style=\"width:100%;\" class=\"btn btn-default\" ng-class=\"{'btn-info': dt.selected, active: isActive(dt)}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\" tabindex=\"-1\"><span ng-class=\"{'text-info': dt.current}\">{{dt.label}}</span></button>\n" +
        "      </td>\n" +
        "    </tr>\n" +
        "  </tbody>\n" +
        "</table>\n" +
        "");
}]);

angular.module("template/modal/backdrop.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/modal/backdrop.html",
        "<div class=\"modal-backdrop fade {{ backdropClass }}\"\n" +
        "     ng-class=\"{in: animate}\"\n" +
        "     ng-style=\"{'z-index': 1040 + (index && 1 || 0) + index*10}\"\n" +
        "></div>\n" +
        "");
}]);

angular.module("template/modal/window.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/modal/window.html",
        "<div tabindex=\"-1\" role=\"dialog\" class=\"modal fade\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1050 + index*10, display: 'block'}\" ng-click=\"close($event)\">\n" +
        "    <div class=\"modal-dialog\" ng-class=\"{'modal-sm': size == 'sm', 'modal-lg': size == 'lg'}\"><div class=\"modal-content\" modal-transclude></div></div>\n" +
        "</div>");
}]);

angular.module("template/pagination/pager.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/pagination/pager.html",
        "<ul class=\"pager\">\n" +
        "  <li ng-class=\"{disabled: noPrevious(), previous: align}\"><a href ng-click=\"selectPage(page - 1)\">{{getText('previous')}}</a></li>\n" +
        "  <li ng-class=\"{disabled: noNext(), next: align}\"><a href ng-click=\"selectPage(page + 1)\">{{getText('next')}}</a></li>\n" +
        "</ul>");
}]);

angular.module("template/pagination/pagination.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/pagination/pagination.html",
        "<ul class=\"pagination\">\n" +
        "  <li ng-if=\"boundaryLinks\" ng-class=\"{disabled: noPrevious()}\"><a href ng-click=\"selectPage(1)\">{{getText('first')}}</a></li>\n" +
        "  <li ng-if=\"directionLinks\" ng-class=\"{disabled: noPrevious()}\"><a href ng-click=\"selectPage(page - 1)\">{{getText('previous')}}</a></li>\n" +
        "  <li ng-repeat=\"page in pages track by $index\" ng-class=\"{active: page.active}\"><a href ng-click=\"selectPage(page.number)\">{{page.text}}</a></li>\n" +
        "  <li ng-if=\"directionLinks\" ng-class=\"{disabled: noNext()}\"><a href ng-click=\"selectPage(page + 1)\">{{getText('next')}}</a></li>\n" +
        "  <li ng-if=\"boundaryLinks\" ng-class=\"{disabled: noNext()}\"><a href ng-click=\"selectPage(totalPages)\">{{getText('last')}}</a></li>\n" +
        "</ul>");
}]);

angular.module("template/tooltip/tooltip-html-unsafe-popup.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/tooltip/tooltip-html-unsafe-popup.html",
        "<div class=\"tooltip {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
        "  <div class=\"tooltip-arrow\"></div>\n" +
        "  <div class=\"tooltip-inner\" bind-html-unsafe=\"content\"></div>\n" +
        "</div>\n" +
        "");
}]);

angular.module("template/tooltip/tooltip-popup.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/tooltip/tooltip-popup.html",
        "<div class=\"tooltip {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
        "  <div class=\"tooltip-arrow\"></div>\n" +
        "  <div class=\"tooltip-inner\" ng-bind=\"content\"></div>\n" +
        "</div>\n" +
        "");
}]);

angular.module("template/popover/popover.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/popover/popover.html",
        "<div class=\"popover {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
        "  <div class=\"arrow\"></div>\n" +
        "\n" +
        "  <div class=\"popover-inner\">\n" +
        "      <h3 class=\"popover-title\" ng-bind=\"title\" ng-show=\"title\"></h3>\n" +
        "      <div class=\"popover-content\" ng-bind=\"content\"></div>\n" +
        "  </div>\n" +
        "</div>\n" +
        "");
}]);

angular.module("template/progressbar/bar.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/progressbar/bar.html",
        "<div class=\"progress-bar\" ng-class=\"type && 'progress-bar-' + type\" role=\"progressbar\" aria-valuenow=\"{{value}}\" aria-valuemin=\"0\" aria-valuemax=\"{{max}}\" ng-style=\"{width: percent + '%'}\" aria-valuetext=\"{{percent | number:0}}%\" ng-transclude></div>");
}]);

angular.module("template/progressbar/progress.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/progressbar/progress.html",
        "<div class=\"progress\" ng-transclude></div>");
}]);

angular.module("template/progressbar/progressbar.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/progressbar/progressbar.html",
        "<div class=\"progress\">\n" +
        "  <div class=\"progress-bar\" ng-class=\"type && 'progress-bar-' + type\" role=\"progressbar\" aria-valuenow=\"{{value}}\" aria-valuemin=\"0\" aria-valuemax=\"{{max}}\" ng-style=\"{width: percent + '%'}\" aria-valuetext=\"{{percent | number:0}}%\" ng-transclude></div>\n" +
        "</div>");
}]);

angular.module("template/rating/rating.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/rating/rating.html",
        "<span ng-mouseleave=\"reset()\" ng-keydown=\"onKeydown($event)\" tabindex=\"0\" role=\"slider\" aria-valuemin=\"0\" aria-valuemax=\"{{range.length}}\" aria-valuenow=\"{{value}}\">\n" +
        "    <i ng-repeat=\"r in range track by $index\" ng-mouseenter=\"enter($index + 1)\" ng-click=\"rate($index + 1)\" class=\"glyphicon\" ng-class=\"$index < value && (r.stateOn || 'glyphicon-star') || (r.stateOff || 'glyphicon-star-empty')\">\n" +
        "        <span class=\"sr-only\">({{ $index < value ? '*' : ' ' }})</span>\n" +
        "    </i>\n" +
        "</span>");
}]);

angular.module("template/tabs/tab.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/tabs/tab.html",
        "<li ng-class=\"{active: active, disabled: disabled}\">\n" +
        "  <a href ng-click=\"select()\" tab-heading-transclude>{{heading}}</a>\n" +
        "</li>\n" +
        "");
}]);

angular.module("template/tabs/tabset.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/tabs/tabset.html",
        "<div>\n" +
        "  <ul class=\"nav nav-{{type || 'tabs'}}\" ng-class=\"{'nav-stacked': vertical, 'nav-justified': justified}\" ng-transclude></ul>\n" +
        "  <div class=\"tab-content\">\n" +
        "    <div class=\"tab-pane\" \n" +
        "         ng-repeat=\"tab in tabs\" \n" +
        "         ng-class=\"{active: tab.active}\"\n" +
        "         tab-content-transclude=\"tab\">\n" +
        "    </div>\n" +
        "  </div>\n" +
        "</div>\n" +
        "");
}]);

angular.module("template/timepicker/timepicker.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/timepicker/timepicker.html",
        "<table>\n" +
        "	<tbody>\n" +
        "		<tr class=\"text-center\">\n" +
        "			<td><a ng-click=\"incrementHours()\" class=\"btn btn-link\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a></td>\n" +
        "			<td>&nbsp;</td>\n" +
        "			<td><a ng-click=\"incrementMinutes()\" class=\"btn btn-link\"><span class=\"glyphicon glyphicon-chevron-up\"></span></a></td>\n" +
        "			<td ng-show=\"showMeridian\"></td>\n" +
        "		</tr>\n" +
        "		<tr>\n" +
        "			<td style=\"width:50px;\" class=\"form-group\" ng-class=\"{'has-error': invalidHours}\">\n" +
        "				<input type=\"text\" ng-model=\"hours\" ng-change=\"updateHours()\" class=\"form-control text-center\" ng-mousewheel=\"incrementHours()\" ng-readonly=\"readonlyInput\" maxlength=\"2\">\n" +
        "			</td>\n" +
        "			<td>:</td>\n" +
        "			<td style=\"width:50px;\" class=\"form-group\" ng-class=\"{'has-error': invalidMinutes}\">\n" +
        "				<input type=\"text\" ng-model=\"minutes\" ng-change=\"updateMinutes()\" class=\"form-control text-center\" ng-readonly=\"readonlyInput\" maxlength=\"2\">\n" +
        "			</td>\n" +
        "			<td ng-show=\"showMeridian\"><button type=\"button\" class=\"btn btn-default text-center\" ng-click=\"toggleMeridian()\">{{meridian}}</button></td>\n" +
        "		</tr>\n" +
        "		<tr class=\"text-center\">\n" +
        "			<td><a ng-click=\"decrementHours()\" class=\"btn btn-link\"><span class=\"glyphicon glyphicon-chevron-down\"></span></a></td>\n" +
        "			<td>&nbsp;</td>\n" +
        "			<td><a ng-click=\"decrementMinutes()\" class=\"btn btn-link\"><span class=\"glyphicon glyphicon-chevron-down\"></span></a></td>\n" +
        "			<td ng-show=\"showMeridian\"></td>\n" +
        "		</tr>\n" +
        "	</tbody>\n" +
        "</table>\n" +
        "");
}]);

angular.module("template/typeahead/typeahead-match.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/typeahead/typeahead-match.html",
        "<a tabindex=\"-1\" bind-html-unsafe=\"match.label | typeaheadHighlight:query\"></a>");
}]);

angular.module("template/typeahead/typeahead-popup.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/typeahead/typeahead-popup.html",
        "<ul class=\"dropdown-menu\" ng-show=\"isOpen()\" ng-style=\"{top: position.top+'px', left: position.left+'px'}\" style=\"display: block;\" role=\"listbox\" aria-hidden=\"{{!isOpen()}}\">\n" +
        "    <li ng-repeat=\"match in matches track by $index\" ng-class=\"{active: isActive($index) }\" ng-mouseenter=\"selectActive($index)\" ng-click=\"selectMatch($index)\" role=\"option\" id=\"{{match.id}}\">\n" +
        "        <div typeahead-match index=\"$index\" match=\"match\" query=\"query\" template-url=\"templateUrl\"></div>\n" +
        "    </li>\n" +
        "</ul>\n" +
        "");
}]);

