#angular-panel-snap
An AngularJS module that provides scroll snapping functionality and menu's to sets of panels within a page.

Only dependent on AngularJS (no jQuery or additional animation libraries required). Based on [jQuery.panelSnap](https://github.com/guidobouman/jquery-panelsnap).

----

##Demo
Check out the live [demo](http://akreitals.github.io/angular-panel-snap)

##Installation
Download [angular-panel-snap.js](https://raw.github.com/akreitals/master/angular-panel-snap.js)([minified version](https://raw.github.com/akreitals/master/angular-panel-snap.js)) and place it with your other scripts. Alternatively you can use Bower:

	$ bower install angular-panel-snap

Include the script in your application:

	<script src="bower_components/angular-panel-snap/angular-panel-snap.min.js"></script>

And remember to add angular-panel-snap as a dependency to your application module:

	angular.module('myApplicationModule', ['akreitals.panel-snap']);

##Usage
###Basic usage
A simple group of panels:
```html
<ak-panel-group full-window="true">
	<ak-panel>
    	<h1>First Panel</h1>
        <p>First panel content</p>
    </ak-panel>
    
    <ak-panel>
    	<h1>Second Panel</h1>
        <p>Second panel content</p>
    </ak-panel>
    
    <ak-panel>
    	<h1>Third Panel</h1>
        <p>Third panel content</p>
    </ak-panel>
</ak-panel-group>
```
To include full page (full browser window) panels, like the main panel group in the [demo](http://akreitals.github.io/angular-panel-snap), the `full-window` attribute must be set to true. This ensures that the scroll bindings listen to events on the `document` object instead of the parent container element.

Please note in order for panels to correctly display the width and height of a containing element must be defined. 

For full window panels you should ensure your stylesheet contains something similar to the following:

```css
html, body {
	margin: 0;
    width: 100%;
    height: 100%
}
```

###Nested panel groups
Panel groups can be nested:
```html
<ak-panel-group full-window="true">
	<ak-panel>
    	<h1>First Panel</h1>
        <p>First panel content</p>
    </ak-panel>
    
    <ak-panel>
    	<h1>Second panel</h1>
        <p>Second panel content</p>
        
    	<ak-panel-group>
        	<panel>
            	<h2>Nested panel one</h2>
            </panel>
            
            <panel>
            	<h2>Nested panel two</h2>
            </panel>
        </ak-panel-group>
    </ak-panel>
</ak-panel-group>
```

###Panel group menu
A dynamic navigation menu can be easily added to any panel group provided it's `name` attribute is set:
```html
<ak-panel-group-menu for="myPanelGroup"></ak-panel-group-menu>
<ak-panel-group name="myPanelGroup">
	<ak-panel>
    	<h1>First Panel</h1>
        <p>First panel content</p>
    </ak-panel>
    
    <ak-panel>
    	<h1>Second Panel</h1>
        <p>Second panel content</p>
    </ak-panel>
    
    <ak-panel>
    	<h1>Third Panel</h1>
        <p>Third panel content</p>
    </ak-panel>
</ak-panel-group>
```

##Directives
All the options for the various directives are summarised in the tables below.
### ak-panel-group
Container for set of `ak-panel` directives that maintains the panels state and all interactions with the group.

| Attr | Type | Details |
| ---- | ---- | ------- |
| name (optional) | String | name of the group, to be referenced in ak-panel-group-menu's 'for' attribute |
| speed (optional) | Number | duration in milliseconds to snap to the desired panel, defaults to 400ms |
| threshold (optional) | Number | amount of pixels required to scroll before snapping to the next panel, defults to 50px |
| fullWindow (optional) | Boolean | true if the panels are to fill the full browser window |
| keyboard (optional) | Boolean | true if key presses can be used to navigate panels |
| prevKey (optional) | Number | keyCode of key to navigate to previous panel, defaults to 38 (up arrow) |
| nextKey (optional) | Number | keyCode of key to navigate to next panel, defaults to 40 (down arrow) |

### ak-panel
Creates a panel inside an `ak-panel-group` directive. Must be a child of an `ak-panel-group` element.

| Attr | Type | Details |
| ---- | ---- | ------- |
| name (optional) | String | name of panel, will form text of nav element in any ak-panel-group-menu's assocaited with the containing group |
| onEnter (optional) | Function | function to be called when panel is snapped into |
| onLeave (optional) | Function | function to be called when panel is snapped out of |

### ak-panel-menu
Creates a menu for the referenced `ak-panel-group` container.

| Attr | Type | Details |
| ---- | ---- | ------- |
| for (required) | String | name attribute of the ak-panel-group the menu is to reference |



