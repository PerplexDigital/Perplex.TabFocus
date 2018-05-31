# Perplex.TabFocus

## Will be published at some point in June 2018

Umbraco BackOffice directives to run functions upon tab focus

The following directives are provided:

*   `tab-focus`
    Runs every time the tab containing this directive is focused
*   `tab-focus-once`
    Runs only the first time the tab containing this directive is focused
*   `tab-refocus`
    Runs every time except the first time when the tab containing this directive is focused

Every directive expects some function or expression to be evaluated. Some examples:

*   `tab-focus="vm.state.x = vm.state.x + 1"`
*   `tab-focus-once="vm.fn.init()"`
*   `tab-refocus="vm.fn.run(vm.state.x)"`
