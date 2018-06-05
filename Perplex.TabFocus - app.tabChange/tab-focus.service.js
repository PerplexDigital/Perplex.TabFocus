angular.module("umbraco").service("tabFocusService", [
    "eventsService",
    function(eventsService) {
        // Format: { <tab id> => [callbacks] }
        var callbacksPerTab = {};

        // Total amount of subscribers
        var subscribers = 0;

        // Unsubscribe function to stop listening to app.tabChange event.
        var unsubscribeFromTabChangeFn;

        function subscribe($element, callback) {
            var $tab = getTab($element);
            var tabId = getTabId($tab);
            if (tabId == null) {
                callback(noop);
                // No need to unsubscribe here
                return noop;
            }

            addCallback(tabId, callback);

            function unsubscribe() {
                removeCallback(tabId, callback);
            }

            if (tabIsActive($tab)) {
                // Tab was already active
                // Run callback and provide the unsubscribe
                // immediately as this function has not returned it yet.
                callback(unsubscribe);
            }

            return unsubscribe;
        }

        function noop() {}

        function getTabId($tab) {
            return $tab.attr("rel");
        }

        function getTab($element) {
            return $element.closest(".umb-tab-pane");
        }

        function tabIsActive($tab) {
            return $tab.hasClass("active");
        }

        function addCallback(tabId, callback) {
            var callbacks = callbacksPerTab[tabId];
            if (callbacks == null) {
                callbacks = callbacksPerTab[tabId] = [];
            }

            callbacks.push(callback);
            subscribers++;

            if (subscribers === 1) {
                subscribeToTabChanges();
            }
        }

        function removeCallback(tabId, callback) {
            var callbacks = callbacksPerTab[tabId];
            if (callbacks != null) {
                var idx = callbacks.indexOf(callback);
                if (idx > -1) {
                    callbacks.splice(idx, 1);

                    if (callbacks.length === 0) {
                        delete callbacksPerTab[tabId];
                    }

                    if (--subscribers === 0) {
                        unsubscribeFromTabChanges();
                    }
                }
            }
        }

        function runCallbacks(tabId) {
            var callbacks = callbacksPerTab[tabId];
            if (callbacks != null) {
                var i = callbacks.length;
                while (i--) {
                    callbacks[i]();
                }
            }
        }

        function subscribeToTabChanges() {
            unsubscribeFromTabChangeFn = eventsService.on("app.tabChange", function onTabChange(evt, args) {
                var tabId = args.id;
                runCallbacks(tabId);
            });
        }

        function unsubscribeFromTabChanges() {
            if (typeof unsubscribeFromTabChangeFn === "function") {
                unsubscribeFromTabChangeFn();
            }
        }

        // Public API
        this.subscribe = subscribe;
    }
]);
