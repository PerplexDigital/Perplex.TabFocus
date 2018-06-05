# Perplex.TabFocus

> Work in progress, subject to change. Will likely be published as a package on NuGet / Our.Umbraco at some point in June 2018. When properly tested it can be submitted as a PR to Umbraco. The PR will use the Umbraco event app.tabChange rather than MutationObserver. This version does not, as that event was added only recently (in 7.7.10). This current version should work for most Umbraco 7 versions rather than only >= 7.7.10.

Umbraco BackOffice directives to execute some Angular expression or function when the tab containing the directive is focused.
When the directive is placed on a property on the first tab it will immediately be executed, of course.

The following directives are provided:

-   `tab-focus`
    Runs every time the tab containing this directive is focused
-   `tab-focus-once`
    Runs only the first time the tab containing this directive is focused
-   `tab-refocus`
    Runs every time except the first time when the tab containing this directive is focused

Every directive expects some function or expression to be evaluated. Some examples:

-   `tab-focus="vm.state.x = vm.state.x + 1"`
-   `tab-focus-once="vm.fn.init()"`
-   `tab-refocus="vm.fn.run(vm.state.x)"`

## Example: Lazily Load a Custom Property Editor

The most obvious use case for these directives is to lazily load a custom property editor.
That is, delay some "init" function until it is actually needed, i.e. until the tab the property is on is focused by the user.

Assuming we have some custom property editor named Perplex.Editor with the following HTML template:

```html
<div ng-controller="Perplex.Editor.Controller as vm">
    <h1 ng-bind="vm.someData"></h1>
</div>
```

And a controller similar to this:

```javascript
angular.module("umbraco").controller("Perplex.Editor.Controller", function() {
    var vm = this;

    vm.init = function() {
        // Slow API call to retrieve data ...
        // vm.someData = ...
    };

    vm.init();
});
```

If we want to defer the call to `vm.init()` until the tab becomes active, we simply change the HTML and JS to this:

```html
<div ng-controller="Perplex.Editor.Controller as vm"
     tab-focus-once="vm.init()">
    <h1 ng-bind="vm.someData"></h1>
</div>
```

```javascript
angular.module("umbraco").controller("Perplex.Editor.Controller", function() {
    var vm = this;

    vm.init = function() {
        // Slow API call to retrieve data ...
        // vm.someData = ...
    };

    // vm.init() is removed
});
```

That is, `vm.init()` is removed from the controller and put in the template as `tab-focus-once="vm.init()"`, which will be automatically executed when the tab is focused for the first time.
