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
 * @attribute snap (optional) Boolean: enable or disable the snapping on initialization
 */
angular
  .module('panel-snap')
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
      nextKey: '=',
      snap: '='
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

  ctrl.speed = 400;   // default snap animation duration in milliseconds
  ctrl.threshold = 50;  // default pixel threshold for snap to occur in pixels
  ctrl.prevKey = 38;    // default prevKey key code - up arrow
  ctrl.nextKey = 40;    // default nextKey key code - down arrow

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
    // TODO: should this snap to closest panel when enabled? (yes)
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
   * toggle snapping
   */
  ctrl.snapTo = function (id) {
    snapToPanel(id);
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
    ctrl.enabled = angular.isDefined($scope.snap) ? $scope.snap : ctrl.enabled;

    bind();
    $timeout(function() {
      activatePanel(ctrl.currentPanel);
    },0);
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

  $scope.$on('$destroy',function(){
    angular.element(document).unbind('.panelsnap');
  });

  function bind() {
    // bind scrolling events
    ctrl.eventContainer.on('scroll.panelsnap', scrollFn);

    // bind scrolling events
    if(ctrl.enabled) {
      ctrl.eventContainer.on('mousewheel.panelsnap touchmove.panelsnap DOMMouseScroll.panelsnap', function(e) {
        e.preventDefault();
        if(ctrl.isSnapping) return false;
        if(e.type==='mousewheel'||e.type==='DOMMouseScroll') {
          var delta = Math.max(-1, Math.min(1, (e.originalEvent.wheelDelta || -e.originalEvent.detail)));
          if(delta && delta >0) snapToPanel(ctrl.currentPanel - 1);
          else if(delta) snapToPanel(ctrl.currentPanel + 1);
        }
      });
    }

    // bind resize event
    angular.element($window).on('resize.panelSnap', resize);

    // bind keyboard events
    if ($scope.keyboard) {
      angular.element($window).on('keydown.panelSnap', keydown);
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
    //  return;
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

    $rootScope.$broadcast('panelsnap:start', { group: $scope.name, id: target });
    $timeout(function() { // lets the broadcast get processed before continuing
      ctrl.panels[ctrl.currentPanel].onLeave();

      var scrollTarget = ctrl.scrollInterval * target;
      ctrl.snapContainer.scrollTo(0, scrollTarget, ctrl.speed).then(function () {
        ctrl.scrollOffset = scrollTarget;
        $timeout(function(){
          ctrl.isSnapping = false;
        },300);


        $rootScope.$broadcast('panelsnap:finish', { group: $scope.name, id: target });
        ctrl.panels[target].onEnter();

        activatePanel(target);
      });
    },0);
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
    $rootScope.$broadcast('panelsnap:activate', {group: $scope.name, id: target });
    $rootScope.$emit('panelsnap:activatePanel', { group: $scope.name, id: target });
  }
}
