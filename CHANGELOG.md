# Change Log

## [0.2.0](https://github.com/akreitals/angular-panel-snap/tree/0.2.0) (2015-05-17)
### Bug Fixes
* removed manual transclusion with specified scope ([#2](https://github.com/akreitals/angular-panel-snap/issues/2))
* updated for Angular 1.3.x

### Breaking Changes
* `enableSnap`, `disableSnap` and `toggleSnap` must now be referenced on `ak-panel`'s parent scope. Example:

	```
		<button ng-click="$parent.disableSnap()">Disable Snap</button>
	```

* `ng-controller` directive cannot be added alongside `ak-panel`, Angular 1.3 `ng-transclude` changes will create competing isolate scopes and produce [multidir](https://docs.angularjs.org/error/$compile/multidir) error.