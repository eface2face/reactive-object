var _       = require('lodash')
var Tracker = require('meteor-tracker')

require("object.observe")


function ReactiveObjectMap(map)
{
	// called without `new`
	if (!(this instanceof ReactiveObjectMap))
		return new ReactiveObjectMap(map);

	this._map = map || {};
	this._dep = new Tracker.Dependency;


	var observer = this._dep.changed.bind(this._dep)

	if(map)
		Object.keys(map).forEach(function(key)
		{
			Object.observe(map[key], observer)
		})


	function setMap(value)
	{
		var map = this._map
		Object.keys(map).forEach(function(key)
		{
			Object.unobserve(map[key], observer)
		})

		this._map = value
		this._dep.changed()
	}


	// Entries (globally)

	this.assign = function(collection, iteratee)
	{
		setMap(_.indexBy(collection, iteratee))

		collection.forEach(function(item)
		{
			Object.observe(item, observer)
		})
	};

	this.clear = setMap.bind(this, {})


	// Entries

	this.set = function(key, item) {
		if(this._map[key] !== item)
		{
			this._map[key] = item

			Object.observe(item, observer)

			this._dep.changed()
		}
	};

	this.delete = function(key)
	{
		Object.unobserve(this._map[key], observer)

		delete this._map[key]

		this._dep.changed()
	};
};


ReactiveObjectMap.prototype.size = function() {
	return this.keys().length;
};

ReactiveObjectMap.prototype.toString = function() {
	return 'ReactiveObjectMap{' + this.get() + '}';
};

ReactiveObjectMap.prototype._numListeners = function() {
	// Tests want to know.
	// Accesses a private field of Tracker.Dependency.
	return Object.keys(this._dep._dependentsById).length
};


// Entries

ReactiveObjectMap.prototype.get = function(key) {
	if (Tracker.active) this._dep.depend();

	return this._map[key];
};

ReactiveObjectMap.prototype.has = function(key) {
	if (Tracker.active) this._dep.depend();

	return this.hasOwnProperty(key);
};


// Entries attributes

ReactiveObjectMap.prototype.setAttribute = function(key, attr, value) {
	var item = this._map[key]
	if(item[attr] !== value)
		 item[attr] = value
};

ReactiveObjectMap.prototype.getAttribute = function(key, attr) {
	return this.get(key)[attr];
};


// Access functions

['filter', 'keys', 'map', 'sortBy', 'values'].forEach(function(methodName)
{
	ReactiveObjectMap.prototype[methodName] = function(value) {
		if (Tracker.active) this._dep.depend();

		return _[methodName](this._map, value);
	};
})


module.exports = ReactiveObjectMap