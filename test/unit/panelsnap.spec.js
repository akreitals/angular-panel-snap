describe('angular-panel-snap', function () {
	var $scope;

	beforeEach(module('akreitals.panel-snap'));

	beforeEach(inject(function ($rootScope) {
		$scope = $rootScope.$new();
	}));

	/*
	 * PanelGroupController
	 */
	describe('PanelGroupController', function () {
		var ctrl, $element, $attrs;
		beforeEach(inject(function ($controller) {
			$attrs = {};
			$element = {};
			ctrl = $controller('PanelGroupController', { $scope: $scope, $element: $element, $attrs: $attrs });
		}));

		it('should add the specified panel to the panel group', function () {
			var panel1, panel2;
			ctrl.addPanel(group1 = $scope.$new());
			ctrl.addPanel(group2 = $scope.$new());
			expect(ctrl.panels.length).toBe(2);
			expect(ctrl.panels[0]).toBe(group1);
			expect(ctrl.panels[1]).toBe(group2);
		});

		it('should allow snapping to be enabled and disabled', function () {
			expect(ctrl.enabled).toBe(true);
			$scope.disableSnap();
			expect(ctrl.enabled).toBe(false);
			$scope.enableSnap();
			expect(ctrl.enabled).toBe(true);
			$scope.toggleSnap();
			expect(ctrl.enabled).toBe(false);
			$scope.toggleSnap();
			expect(ctrl.enabled).toBe(true);
		});
	});

	/*
	 * akPanelGroup directive
	 */
	describe('panel-group', function () {
		var scope, $compile;
		var element, panels;

		beforeEach(inject(function (_$rootScope_, _$compile_, _$timeout_) {
			scope = _$rootScope_;
			$compile = _$compile_;
			$timeout = _$timeout_;

			var tpl = 	'<ak-panel-group style="height: 100px; width: 100px; overflow: auto">' +
							'<ak-panel>First Panel</ak-panel>' +
							'<ak-panel>Second Panel</ak-panel>' +
							'<ak-panel>Third Panel</ak-panel>' +
						'</ak-panel-group>';
			element = angular.element(tpl);
			element = $compile(element)(scope);
			scope.$digest();
			panels = element.find('.ak-panel');
		}));

		afterEach(function () {
			element = panels = scope = $compile = undefined;
		});

		it('should create panels with transcluded content', function () {
			expect(panels.length).toBe(3);
			expect(panels.eq(0).text()).toEqual('First Panel');
			expect(panels.eq(1).text()).toEqual('Second Panel');
			expect(panels.eq(2).text()).toEqual('Third Panel');
		});

		it('should mark first panel as active', function () {
			expect(panels.eq(0).hasClass('active')).toBe(true);
			expect(panels.eq(1).hasClass('active')).toBe(false);
			expect(panels.eq(2).hasClass('active')).toBe(false);
		});

		/* TODO: test scrolling, cannot get scrollTop to work with karma, also
		 		 elements all have 0 height when using tests for some reason so
		 		 cannot be tested */
		// it('should scroll to the next element', function () {
		// 	element.scrollTop(100);
		// 	element.trigger('scroll');
		// 	$timeout.flush();
		// 	expect(panels.eq(0).hasClass('active')).toBe(false);
		// 	expect(panels.eq(1).hasClass('active')).toBe(true);
		// });
	});
});