(function() {
'use strict';

/*
 * angular-panel-snap main module definition
 */
angular.module('akreitals.panel-snap', []);

})();

(function() {
'use strict';

/*
 * ak-panel-group-menu directive
 *
 * Creates a menu for the referenced ak-panel-group container
 *
 * @attribute for (required) String: name attribute of the ak-panel-group the menu is to reference
 */
angular
	.module('akreitals.panel-snap')
	.directive('akPanelGroupMenu', akPanelGroupMenu);

/* @ngInject */
function akPanelGroupMenu ($rootScope, $log) {
	return {
		restrict: 'EA',
		template: '<ul class="ak-menu"><li ng-repeat="panel in panels" ng-class="{active: panel.active}" ng-click="select(panel.id)"><a href>{{panel.name}}</a></li></ul>',
		scope: {
			for: '@'
		},
		link: function (scope) {
			if (!angular.isDefined(scope.for)) {
				$log.error("PanelGroupMenu: no 'for' attribute provided");
				return;
			}

			scope.panels = [];

			/*
			 * listen for addedPanel event, if group name matches then add
			 * it to the menu
			 */
			$rootScope.$on('panelsnap:addedPanel', function (event, data) {
				if (scope.for === data.group) {
					event.stopPropagation();
					var panel = {
						id: data.id,
						name: data.name,
						active: false
					};
					scope.panels.push(panel);
				}
			});

			/*
			 * listen for activatePanel event, if group name matches then set
			 * active flag target menu element
			 */
			$rootScope.$on('panelsnap:activatePanel', function (event, data) {
				if (scope.for === data.group) {
					event.stopPropagation();
					angular.forEach(scope.panels, function (panel) {
						panel.active = false;
					});
					scope.panels[data.id].active = true;
				}
			});

			/*
			 * emit event to tell ak-panel-group directive to select the target panel
			 */
			scope.select = function (id) {
				$rootScope.$emit('panelsnap:selectPanel', {group: scope.for, id: id});
			};
		}
	};
}
akPanelGroupMenu.$inject = ["$rootScope", "$log"];

})();

(function() {
'use strict';

/*
 * ak-panel-group directive
 *
 * Container for set of 'ak-panel' directives that maintains the panels state and all interactions with the group
 *
 * @attribute name (optional) String: name of the group, to be referenced in ak-panel-group-menu's 'for' attribute
 * @attribute speed (optional) Number: duration in milliseconds to snap to the desired panel, defaults to 400ms
 * @attribute threshold (optional) Number: amount of pixels required to scroll before snapping to the next panel, defults to 50px 
 * @attribute fullWindow (optional) Boolean: true if the panels are to fill the full browser window
 * @attribute keyboard (optional) Boolean: true if key presses can be used to navigate panels
 * @attribute prevKey (optional) Number: keyCode of key to navigate to previous panel, defaults to 38 (up arrow)
 * @attribute nextKey (optional) Number: keyCode of key to navigate to next panel, defaults to 40 (down arrow)
 */
angular
	.module('akreitals.panel-snap')
	.directive('akPanelGroup', akPanelGroup)
	.controller('PanelGroupController', panelGroupController);

/* @ngInject */
function akPanelGroup () {
	return {
		restrict: 'EA',
		replace: true,
		controller: 'PanelGroupController',
		scope: {
			name: '@',
			speed: '=',
			threshold: '=',
			fullWindow: '=',
			keyboard: '=',
			prevKey: '=',
			nextKey: '='
		},
		link: function (scope) {
			// Call init after child panels have registered with the controller
			scope.init();
		}
	};
}

/* @ngInject */
function panelGroupController ($scope, $element, $attrs, $window, $timeout, $document, $rootScope) {
	var ctrl = this;

	var resizeTimeout;
	var scrollTimeout;

	ctrl.panels = [];

	ctrl.currentPanel = 0;
	ctrl.scrollInterval = 0;
	ctrl.scrollOffset = 0;
	ctrl.isSnapping = false;
	ctrl.enabled = true;

	ctrl.speed = 400;		// default snap animation duration in milliseconds
	ctrl.threshold = 50;	// default pixel threshold for snap to occur in pixels
	ctrl.prevKey = 38;		// default prevKey key code - up arrow
	ctrl.nextKey = 40;		// default nextKey key code - down arrow

	/*
	 * add a panels scope to the panels array
	 * - attached to `this` so it can be called from child panel directives
	 */
	ctrl.addPanel = function (panelScope) {
		var panelName = angular.isDefined(panelScope.name) ? panelScope.name : 'Panel ' + (ctrl.panels.length + 1);
		ctrl.panels.push(panelScope);
		if (angular.isDefined($scope.name)) {
			$rootScope.$emit('panelsnap:addedPanel', { group: $scope.name, name: panelName, id: ctrl.panels.length-1 });
		}
	};

	/*
	 * enable snapping
	 */
	ctrl.enableSnap = function () {
		// TODO: should this snap to closest panel when enabled?
		ctrl.enabled = true;
	};

	/*
	 * disable snapping
	 */
	ctrl.disableSnap = function () {
		ctrl.enabled = false;
	};

	/*
	 * toggle snapping
	 */
	ctrl.toggleSnap = function () {
		ctrl.enabled = !ctrl.enabled;
	};

	/*
	 * initialise the controller state
	 * - called from the directive link function. This ensures it is called after any child panels
	 *  link function has called addPanel and therefore the panels array is filled and valid.
	 */
	$scope.init = function () {
		ctrl.container = $element;
		ctrl.eventContainer = ctrl.container;
		ctrl.snapContainer = ctrl.container;

		// if full window, bind and snap using document instead of element
		if ($scope.fullWindow) {
			ctrl.container = angular.element($document[0].documentElement);
			ctrl.eventContainer = ctrl.snapContainer = $document;
		}

		// set options / variables
		ctrl.scrollInterval = isNaN(ctrl.container[0].innerHeight) ? ctrl.container[0].clientHeight : ctrl.container[0].innerHeight;
		ctrl.speed = angular.isDefined($scope.speed) ? $scope.speed : ctrl.speed;
		ctrl.threshold = angular.isDefined($scope.threshold) ? $scope.threshold : ctrl.threshold;
		ctrl.prevKey = angular.isDefined($scope.prevKey) ? $scope.prevKey : ctrl.prevKey;
		ctrl.nextKey = angular.isDefined($scope.nextKey) ? $scope.nextKey : ctrl.nextKey;

		bind();
		activatePanel(ctrl.currentPanel);
	};

	/*
	 * listen for selectPanel event, if group name matches then snap
	 * to the target panel
	 */
	$rootScope.$on('panelsnap:selectPanel', function (event, data) {
		if ($scope.name === data.group) {
			event.stopPropagation();
			snapToPanel(data.id);
		}
	});

	function bind() {
		// bind scrolling events
		ctrl.eventContainer.on('mousewheel scroll touchmove', scrollFn);

		// bind resize event
		angular.element($window).on('resize', resize);

		// bind keyboard events
		if ($scope.keyboard) {
			angular.element($window).on('keydown', keydown);
		}
	}

	function keydown(e) {
		if (!ctrl.enabled) {
			return;
		}

		// prevent any keypress events while snapping
		if (ctrl.isSnapping) {
			if (e.which === ctrl.prevKey || e.which === ctrl.nextKey) {
				e.preventDefault();
				return false;
			}
			return;
		}

		switch (e.which) {
			case ctrl.prevKey:
				e.preventDefault();
				snapToPanel(ctrl.currentPanel - 1);
				break;
			case ctrl.nextKey:
				e.preventDefault();
				snapToPanel(ctrl.currentPanel + 1);
				break;
		}
	}

	function scrollFn(e) {
		var threshold = 50;
		$timeout.cancel(scrollTimeout);
		scrollTimeout = $timeout(function () {
			scrollStop(e);
		}, threshold);
	}

	function resize() {
		var threshold = 150;
		$timeout.cancel(resizeTimeout);
		resizeTimeout = $timeout(function () {
			ctrl.scrollInterval = isNaN(ctrl.container[0].innerHeight) ? ctrl.container[0].clientHeight : ctrl.container[0].innerHeight;
			
			if (!ctrl.enabled) {
				return;
			}

			// snap back to current panel after resizing
			snapToPanel(ctrl.currentPanel);
		}, threshold);
	}

	function scrollStop(e) {
		e.stopPropagation();

		// if (ctrl.isMouseDown) {
		// 	return;
		// }

		if (ctrl.isSnapping) {
			return;
		}

		var target;
		var offset = ctrl.snapContainer.scrollTop();

		if (!ctrl.enabled) {
			// still want to activate the correct panel even if snapping is disabled
			target = Math.max(0, Math.min(Math.round(offset / ctrl.scrollInterval), ctrl.panels.length - 1));
			if (target !== ctrl.currentPanel) {
				activatePanel(target);
			}
			return;
		}

		var scrollDifference = offset - ctrl.scrollOffset;
		var maxOffset = ctrl.container[0].scrollHeight - ctrl.scrollInterval;

		// determine target panel
		if (scrollDifference < -ctrl.threshold && scrollDifference > -ctrl.scrollInterval) {
			target = Math.floor(offset / ctrl.scrollInterval);
		} else if (scrollDifference > ctrl.threshold && scrollDifference < ctrl.scrollInterval) {
			target = Math.ceil(offset / ctrl.scrollInterval);
		} else {
			target = Math.round(offset / ctrl.scrollInterval);
		}

		// ensure target is within panel array bounds
		target = Math.max(0, Math.min(target, ctrl.panels.length - 1));

		if (scrollDifference === 0) {
			// Do nothing
		} else if (offset <= 0 || offset >= maxOffset) {
			// only activate to prevent stuttering
			activatePanel(target);
			// set a scrollOffset to a sane number for next scroll
			ctrl.scrollOffset = offset <= 0 ? 0 : maxOffset;
		} else {
			snapToPanel(target);
		}
	}

	function snapToPanel(target) {
		if (isNaN(target) || target < 0 || target >= ctrl.panels.length) {
			return;
		}

		ctrl.isSnapping = true;

		$rootScope.$broadcast('panelsnap:start', { group: $scope.name });
		ctrl.panels[ctrl.currentPanel].onLeave();

		var scrollTarget = ctrl.scrollInterval * target;
		ctrl.snapContainer.scrollTo(0, scrollTarget, ctrl.speed).then(function () {
			ctrl.scrollOffset = scrollTarget;
			ctrl.isSnapping = false;

			$rootScope.$broadcast('panelsnap:finish', { group: $scope.name });
			ctrl.panels[target].onEnter();

			activatePanel(target);
		});
	}

	function activatePanel(target) {
		// if no panels, or panels have not yet loaded (within ng-repeat) return
		if (!ctrl.panels || ctrl.panels.length < 1) { 
			return;
		}

		angular.forEach(ctrl.panels, function (panel) {
			panel.setActive(false);
		});
		ctrl.panels[target].setActive(true);
		ctrl.currentPanel = target;

		// TODO: call onActivate function for target
		$rootScope.$broadcast('panelsnap:activate', {group: $scope.name });
		$rootScope.$emit('panelsnap:activatePanel', { group: $scope.name, id: target });
	}
}
panelGroupController.$inject = ["$scope", "$element", "$attrs", "$window", "$timeout", "$document", "$rootScope"];


})();

(function() {
'use strict';

/*
 * ak-panel directive
 *
 * Creates a panel inside an ak-panel-group directive. Must be a child of an ak-panel-group element.
 *
 * @attribute name (optional) String: name of panel, will form text of nav element in any ak-panel-group-menu's assocaited with the containing group
 * @attribute onEnter (optional) Function: function to be called when panel is snapped into
 * @attribute onLeave (optional) Function: function to be called when panel is snapped out of
 */
angular
	.module('akreitals.panel-snap')
	.directive('akPanel', akPanel);

/* @ngInject */
function akPanel () {
	return {
		restrict: 'EA',
		require: '^akPanelGroup',
		replace: true,
		transclude: true,
		scope: {
			name: '@',
			onEnter: '&',
			onLeave: '&'
		},
		template: '<div class="ak-panel" ng-class="{active: active}" ng-transclude></div>',
		link: function (scope, element, attrs, ctrl) {

			// add to parent ak-panel-group
			ctrl.addPanel(scope);

			// default panel styles
			element.css({
				'width': '100%',
				'height': '100%',
				'position': 'relative',
				'overflow': 'hidden'
			});

			// attach enable/disable scroll methods to scope - need be accessed by $parent due to transclude scope
			scope.enableSnap = ctrl.enableSnap;
			scope.disableSnap = ctrl.disableSnap;
			scope.toggleSnap = ctrl.toggleSnap;

			// active flag and getter function, to set class .active on panel
			scope.active = false;
			scope.setActive = function (active) {
				scope.active = active;
			};
		}
	};
}

})();

(function() {
'use strict';

/*
 * Scroll methods - removes the need for external jQuery or GreenSock libraries
 *
 * Adapted from durated's Angular Scroll module
 * https://github.com/durated/angular-scroll
 */
angular
	.module('akreitals.panel-snap')
	.value('scrollEasing', scrollEasing)
	.run(runFn)
	.factory('polyfill', polyfill)
	.factory('requestAnimation', requestAnimation)
	.factory('cancelAnimation', cancelAnimation);

function scrollEasing (x) {
	if(x < 0.5) {
		return Math.pow(x*2, 2)/2;
	}
	return 1-Math.pow((1-x)*2, 2)/2;
}

/* @ngInject */
function runFn ($window, $q, cancelAnimation, requestAnimation, scrollEasing) {
	var proto = angular.element.prototype;

	var isDocument = function(el) {
		return (typeof HTMLDocument !== 'undefined' && el instanceof HTMLDocument) || (el.nodeType && el.nodeType === el.DOCUMENT_NODE);
	};

	var isElement = function(el) {
		return (typeof HTMLElement !== 'undefined' && el instanceof HTMLElement) || (el.nodeType && el.nodeType === el.ELEMENT_NODE);
	};

	var unwrap = function(el) {
		return isElement(el) || isDocument(el) ? el : el[0];
	};

	proto.scrollTo = function(left, top, duration) {
		var aliasFn;
		if(angular.isElement(left)) {
			aliasFn = this.scrollToElement;
		} else if(duration) {
			aliasFn = this.scrollToAnimated;
		}
		if(aliasFn) {
			return aliasFn.apply(this, arguments);
		}
		var el = unwrap(this);
		if(isDocument(el)) {
			return $window.scrollTo(left, top);
		}
		el.scrollLeft = left;
		el.scrollTop = top;
	};

	proto.scrollToAnimated = function(left, top, duration, easing) {
		var scrollAnimation, deferred;
		if(duration && !easing) {
			easing = scrollEasing;
		}
		var startLeft = this.scrollLeft(),
			startTop = this.scrollTop(),
			deltaLeft = Math.round(left - startLeft),
			deltaTop = Math.round(top - startTop);

		var startTime = null;
		var el = this;

		var cancelOnEvents = 'scroll mousedown mousewheel touchmove keydown';
		var cancelScrollAnimation = function($event) {
			if (!$event || $event.which > 0) {
				el.unbind(cancelOnEvents, cancelScrollAnimation);
				cancelAnimation(scrollAnimation);
				deferred.reject();
				scrollAnimation = null;
			}
		};

		if(scrollAnimation) {
			cancelScrollAnimation();
		}
		deferred = $q.defer();

		if(!deltaLeft && !deltaTop) {
			deferred.resolve();
			return deferred.promise;
		}

		var animationStep = function(timestamp) {
			if (startTime === null) {
				startTime = timestamp;
			}

			var progress = timestamp - startTime;
			var percent = (progress >= duration ? 1 : easing(progress/duration));

			el.scrollTo(
				startLeft + Math.ceil(deltaLeft * percent),
				startTop + Math.ceil(deltaTop * percent)
			);
			if(percent < 1) {
				scrollAnimation = requestAnimation(animationStep);
			} else {
				el.unbind(cancelOnEvents, cancelScrollAnimation);
				scrollAnimation = null;
				deferred.resolve();
			}
		};

		//Fix random mobile safari bug when scrolling to top by hitting status bar
		el.scrollTo(startLeft, startTop);

		// el.bind(cancelOnEvents, cancelScrollAnimation);

		scrollAnimation = requestAnimation(animationStep);
		return deferred.promise;
	};

	proto.scrollToElement = function(target, offset, duration, easing) {
		var el = unwrap(this);
		var top = this.scrollTop() + unwrap(target).getBoundingClientRect().top - (offset || 0);
		if(isElement(el)) {
			top -= el.getBoundingClientRect().top;
		}
		return this.scrollTo(0, top, duration, easing);
	};

	var overloaders = {
		scrollLeft: function(value, duration, easing) {
			if(angular.isNumber(value)) {
				return this.scrollTo(value, this.scrollTop(), duration, easing);
			}
			var el = unwrap(this);
			if(isDocument(el)) {
				return $window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft;
			}
			return el.scrollLeft;
		},
		scrollTop: function(value, duration, easing) {
			if(angular.isNumber(value)) {
				return this.scrollTo(this.scrollTop(), value, duration, easing);
			}
			var el = unwrap(this);
			if(isDocument(el)) {
				return $window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
			}
			return el.scrollTop;
		}
	};

	//Add duration and easing functionality to existing jQuery getter/setters
	var overloadScrollPos = function(superFn, overloadFn) {
		return function(value, duration) {
			if(duration) {
				return overloadFn.apply(this, arguments);
			}
			return superFn.apply(this, arguments);
		};
	};

	for(var methodName in overloaders) {
		proto[methodName] = (proto[methodName] ? overloadScrollPos(proto[methodName], overloaders[methodName]) : overloaders[methodName]);
	}
}
runFn.$inject = ["$window", "$q", "cancelAnimation", "requestAnimation", "scrollEasing"];

/* @ngInject */
function polyfill ($window) {
	var vendors = ['webkit', 'moz', 'o', 'ms'];

	return function(fnName, fallback) {
		if($window[fnName]) {
			return $window[fnName];
		}
		var suffix = fnName.substr(0, 1).toUpperCase() + fnName.substr(1);
		for(var key, i = 0; i < vendors.length; i++) {
			key = vendors[i]+suffix;
			if($window[key]) {
				return $window[key];
			}
		}
		return fallback;
	};
}
polyfill.$inject = ["$window"];

/* @ngInject */
function requestAnimation (polyfill, $timeout) {
	var lastTime = 0;
	var fallback = function(callback) {
		var currTime = new Date().getTime();
		var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		var id = $timeout(function() {
			callback(currTime + timeToCall);
		}, timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};

	return polyfill('requestAnimationFrame', fallback);
}
requestAnimation.$inject = ["polyfill", "$timeout"];

/* @ngInject */
function cancelAnimation (polyfill, $timeout) {
	var fallback = function(promise) {
		$timeout.cancel(promise);
	};

	return polyfill('cancelAnimationFrame', fallback);
}
cancelAnimation.$inject = ["polyfill", "$timeout"];

})();
