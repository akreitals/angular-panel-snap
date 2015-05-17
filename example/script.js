angular.module('app', ['akreitals.panel-snap'])

.controller('MainCtrl', function ($rootScope) {
	var vm = this;

	// initialise log for event handlers
	vm.textLog = "\n";

	vm.enterFn = function () {
		vm.show = true;
		vm.textLog += "* Events Panel Entered\n";
	};
	vm.leaveFn = function () {
		vm.show = false;
		vm.textLog += "* Events Panel Left\n";
	};

	$rootScope.$on('panelsnap:start', function (event, data) {
		if (data.group === "eventPanelGroup") 
		{
			vm.textLog += " - Subgroup start snapping\n";
		}
	});

	$rootScope.$on('panelsnap:finish', function (event, data) {
		if (data.group === "eventPanelGroup") 
		{
			vm.textLog += " - Subgroup finish snapping\n";
		}
	});

	$rootScope.$on('panelsnap:activate', function (event, data) {
		if (data.group === "eventPanelGroup") 
		{
			vm.textLog += " - Subgroup panel activated\n";
		}
	});
});