angular.module("umbraco").service("tabFocusService", [
    "$rootScope",
    "$timeout",
    function($rootScope, $timeout) {
        // Format: { tabId => { callbacks: Array<Function>, observer: <MutationObserver> } }
        var callbacksByTab = {};

        // Unique tabId counter
        var nextTabId = 0;

        // Data attribute used to attach tabId to DOM element.
        var tabIdAttr = "data-tab-focus-tab-id";

        /**
         * Subscribes to tab focus events for the given $element
         * @param {*} $element jQuery element
         * @param {(unsubscribe:Function) => *} callback Callback function
         * @returns {Function}
         */
        function subscribe($element, callback) {
            var tab = getTab($element);
            var tabId = getTabId(tab);
            if (tab == null || tabId == null || !supportsMutationObserver()) {
                callback(noop);
                // No need to unsubscribe here, as we did not subcribe
                return noop;
            }

            addCallback(tab, tabId, callback);

            function unsubscribe() {
                removeCallback(tabId, callback);
            }

            $timeout(function () {
                // Check if tab is active after next digest
                // to allow Angular to act on ng-show / ng-if etc.
                if (tabIsActive(tab)) {
                    // Tab was already active
                    // Run callback and provide the unsubscribe
                    // immediately as this function has not returned it yet.
                    callback(unsubscribe);
                }
            });

            return unsubscribe;
        }

        /**
         * Returns whether the current browser supports MutationObserver
         * @returns {boolean}
         */
        function supportsMutationObserver() {
            return typeof window.MutationObserver === "function";
        }

        /**
         * Configures a MutationObserver to start watching the tab and call the
         * provided callback function when it becomes active.
         * @param {Element} tab The tab to observe
         * @param {Function} callback Callback to run when the tab becomes active
         * @returns {MutationObserver}
         */
        function createObserver(tab, callback) {
            var observer = new MutationObserver(function onMutation(mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var mutation = mutations[i];

                    if (tabWasActivated(mutation)) {
                        callback();
                    }
                }
            });

            // Start observing
            observer.observe(tab, {
                attributes: true,
                // Only look at changes to the "class" attribute
                attributeFilter: ["class"],
                // We need the old value to check if the tab was already active before the mutation
                attributeOldValue: true
            });

            return observer;
        }

        /**
         * Returns true if the tab is currently active
         * @param {Element} tab The tab to check
         * @returns {boolean}
         */
        function tabIsActive(tab) {
            return !tab.classList.contains("ng-hide");
        }

        /**
         * Returns true if the tab was activated, based on information in the given MutationRecord
         * @param {MutationRecord} mutation A MutationRecord for the tab
         * @returns {boolean}
         */
        function tabWasActivated(mutation) {
            if (!tabIsActive(mutation.target)) {
                return false;
            }

            var tabWasActive = !/(^| )ng-hide( |$)/.test(mutation.oldValue);
            return !tabWasActive;
        }

        function noop() {}

        /**
         * Returns the tab id
         * @param {Element} tab The tab to get the id of
         * @returns {string}
         */
        function getTabId(tab) {
            if (tab == null) {
                return null;
            }

            var tabId = tab.getAttribute(tabIdAttr);

            if (tabId == null) {
                tabId = setTabId(tab);
            }

            return tabId;
        }

        function setTabId(tab) {
            tab.setAttribute(tabIdAttr, nextTabId);
            return nextTabId++;
        }

        /**
         * Returns the nearest tab to the given element
         * @param {*} $element jQuery Lite element
         * @returns {Element}
         */
        function getTab($element) {
            // Content Tab: .umb-group-panel__content
            // Content App: .umb-editor-sub-view__content
            return $element.closest(".umb-group-panel__content,.umb-editor-sub-view__content")[0];
        }

        /**
         * Adds a callback for the given tab and tab id
         * @param {Element} tab The tab
         * @param {string} tabId Tab id
         * @param {Function} callback Callback function
         */
        function addCallback(tab, tabId, callback) {
            var data = callbacksByTab[tabId];
            if (data == null) {
                var observer = createObserver(tab, function observerCallback() {
                    runCallbacks(tabId);
                });

                data = callbacksByTab[tabId] = {
                    callbacks: [],
                    observer: observer
                };
            }

            data.callbacks.push(callback);
        }

        /**
         * Removes a callback for the given tab id
         * @param {string} tabId Tab id
         * @param {Function} callback Callback to remove
         */
        function removeCallback(tabId, callback) {
            var data = callbacksByTab[tabId];
            if (data != null) {
                var callbacks = data.callbacks;
                if (callbacks != null) {
                    var idx = callbacks.indexOf(callback);
                    if (idx > -1) {
                        callbacks.splice(idx, 1);

                        if (callbacks.length === 0) {
                            data.observer.disconnect();
                            delete callbacksByTab[tabId];
                        }
                    }
                }
            }
        }

        /**
         * Runs all callbacks for the given tab id
         * @param {string} tabId Tab id
         */
        function runCallbacks(tabId) {
            var data = callbacksByTab[tabId];
            if (data != null) {
                var callbacks = data.callbacks;
                if (callbacks != null) {
                    var i = callbacks.length;
                    while (i--) {
                        callbacks[i]();
                    }

                    // Make sure Angular picks up the changes
                    $rootScope.$digest();
                }
            }
        }

        // Public API
        this.subscribe = subscribe;
    }
]);
