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

/* @ngInject */
function cancelAnimation (polyfill, $timeout) {
	var fallback = function(promise) {
		$timeout.cancel(promise);
	};

	return polyfill('cancelAnimationFrame', fallback);
}