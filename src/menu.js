/*
 * ak-panel-group-menu directive
 *
 * Creates a menu for the referenced ak-panel-group container
 *
 * @attribute for (required) String: name attribute of the ak-panel-group the menu is to reference
 */
angular
  .module('panel-snap')
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
