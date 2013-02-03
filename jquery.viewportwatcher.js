/*
*	jQuery.ViewportWatcher.js
*	Copyright 2013 Naokazu Shimabukuro
*/

;(function($, window, undefined) {

	var $window = $(window);
	var namespace = {};
	var _every = Array.prototype.every || function(fn, scope) {
		var len = this.length;

		if(typeof fn !== "function") { throw new TypeError(); }

		for(var i=0; i<len; i++) {
			if(i in this && !fn.call(scope, this[i], i, this)) {
				return false;
			}
		}

		return true;
	};


	(function() {

		var TypeWidthRule = {};
		TypeWidthRule.containBetween = function(min, max) {
			var w = parseInt($window.width());

			return (min <= w && w <= max);
		};

		var TypeHeightRule = {};
		TypeHeightRule.containBetween = function(min, max) {
			var h = parseInt($window.height());

			return (min <= h && h <= max);
		};

		namespace.rules = {};
		namespace.rules.TypeWidthRule = TypeWidthRule;
		namespace.rules.TypeHeightRule = TypeHeightRule;
		namespace.rules.getRule = function(type) {
			if(type === "width") {
				return TypeWidthRule;
			} else if(type === "height"){
				return TypeHeightRule;
			}
		};

	})();

	(function(){

		var WatcherManager = function() {
			this._init.apply(this, arguments);
		};

		WatcherManager.prototype._init = function() {

			this._currentViewportWH = {
				width: parseInt($window.width()),
				height: parseInt($window.height())
			};
			this._watchers = {};
			this._contains = [];

			this._setEvents();
		};

		WatcherManager.prototype._setEvents = function() {
			$window.on('resize', $.proxy(this._handleViewportResize, this));
		};

		WatcherManager.prototype._handleViewportResize = function(evt) {

			var prevContains = this._contains;
			var currentContains = [];
			var prevViewportWH = this._currentViewportWH;
			var currentViewportWH = {
				width: parseInt($window.width()),
				height: parseInt($window.height())
			};
			var watchers = this._watchers;
			var key;

			for (key in watchers) {

				var watcher = watchers[key].watcher;
				var rule = watchers[key].rule;
				var wasMatch = !_every.call(prevContains, function(value, index, arr) {
					return key !== value;
				});

				if(rule.containBetween(watcher.range.min, watcher.range.max)) {

					if(!wasMatch) {
						watcher.dispatchEvent('inbound', {
							prev: prevViewportWH,
							current: currentViewportWH
						});
					}

					currentContains.push(key);

				} else {
					if(wasMatch) {
						watcher.dispatchEvent('outbound', {
							prev: prevViewportWH,
							current: currentViewportWH
						});
					}
				}

			}

			this._contains = currentContains;
			this._currentViewportWH = currentViewportWH;
		};

		WatcherManager.prototype.addWatcher = function(watcher, rule) {
			this._watchers[watcher.name] = {
				watcher: watcher,
				rule: rule
			};
		};

		WatcherManager.prototype.removeWatcher = function(watcher) {
			this._watchers[watcher.name] = null;
			delete this._watchers[watcher.name];
		};

		namespace.manager = new WatcherManager();
	})();

	(function() {

		var ViewportWatcher = function() {
			this._init.apply(this, arguments);
		};

		ViewportWatcher.prototype._init = function(name, options) {

			this.name = name;
			this.type = options.type;
			this.range = {min: options.min, max: options.max};
			this._dispatcher = $(this);

		};

		ViewportWatcher.prototype.on = function(eventName, listener) {
			this._dispatcher.on(eventName, listener);
		};

		ViewportWatcher.prototype.off = function(eventName, listener) {
			this._dispatcher.off(eventName, listener);
		};

		ViewportWatcher.prototype.dispatchEvent = function(eventName, data) {
			this._dispatcher.trigger(eventName, data);
		};


		ViewportWatcher.prototype.destroy = function() {
			namespace.manager.removeWatcher(this);

			this.name = null;
			this._dispatcher = null;
		};

		namespace.ViewportWatcher = ViewportWatcher;

	})();


	//facade
	$.ViewportWatcher = function(name, options) {
		var watcher = new namespace.ViewportWatcher(name, options);
		namespace.manager.addWatcher(watcher, namespace.rules.getRule(options.type));
		return watcher;
	};

})(jQuery, window);