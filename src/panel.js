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