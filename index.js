var debug = require('debug')('reactive-object');


module.exports = function(Meteor) {

	var Tracker = Meteor.Tracker;

	function ReactiveObject(object)
	{
		// called without `new`
		if (!(this instanceof ReactiveObject))
			return new ReactiveObject(object);

		//Store the object we are observing
		var root = object;

		//Tracker dependencies
		var dep  = new Tracker.Dependency;

		var observer = function (changes) {
			//debug('changes observed: %o', changes);

			//For each change
			changes.forEach(function(change) {
				//The properties of these change objects are:
				// name: The name of the property which was changed.
				// object: The changed object after the change was made.
				// type: A string indicating the type of change taking place. One of "add", "update", or "delete".
				// oldValue: Only for "update" and "delete" types. The value before the change.
				// index: Only for the "splice" type. The index at which the change occurred.
				// removed: Only for the "splice" type. An array of the removed elements.
				// addedCount: Only for the "splice" type. The number of elements added.
				//Depending the type of change
				switch(change.type) {
					case "add":
						//Observe object recursivelly
						observe(change.object[change.name]);
						break;
					case "update":
						//Unobserve oldvalue recursielly
						unobserve (change.oldValue);
						//Observe calue recursivelly
						observe(change.object[change.name]);
						break;
					case "delete":
						//Unobserve it
						unobserve(change.oldValue);
						break;
					case "splice":
						//Tthe removed items
						for(var i=0;i<change.removed.length;i++)
							//Unobserve it
							unobserve(change.removed[i]);
						//Check the added ones
						for (var i=0,j=change.index;i<change.addedCount;i++)
							//Observe them
							observe(change.object[j]);
				}
			});
			//And fire dependency
			dep.changed();
		};

		//The recursive unobserve function
		var unobserve = function(object) {
			//Ensure it is an object and not falsey
			if (object && typeof object === 'object') {
				//Check type of observerd object
				if (Array.isArray(object)) {
					//debug('unobserving array: %o', object);

					//Observe object first
					Object.unobserve(object,observer);
					//Now observe  values recursively
					object.forEach(function(value) {
						//recursivelly observe it alseo
						unobserve(value);
					});
				} else {
					//debug('unobserving object: %o', object);

					//Observe object first
					Object.unobserve(object,observer);
					//Now observe  properties recursively
					for (var key in object) {
						if (object.hasOwnProperty(key)) {
							//get the property
							var value = object[key];
							//recursivelly observe it alseo
							unobserve(value);
						}
					}
				}
			}
		};

		//The recursive observer function
		var observe = function(object) {
			//Ensure it is an object and not falsey
			if (object && typeof object === 'object')
			{
				//Check type of observerd object
				if (Array.isArray(object)) {
					//debug('observing array: %o', object);

					//Observe array for splice
					Array.observe(object,observer,["add", "update", "delete","splice"]);
					//Now observe  values recursively
					object.forEach(function(value) {
						//recursivelly observe it alseo
						observe(value);
					});
				} else {
					//debug('observing object: %o', object);

					//Observe object first
					Object.observe(object,observer,["add", "update", "delete"]);
					//Now observe  properties recursively
					for (var key in object) {
						if (object.hasOwnProperty(key)) {
							//get the property
							var value = object[key];
							//recursivelly observe it alseo
							observe(value);
						}
					}
				}
			}
		};

		//Observe object recursivelly
		observe(root);

		// Gettter for root object or a property in it
		this.get = function(key) {
			//If running inside a an active Tracker computation
			if(Tracker.active)
				//Add a dependency
				dep.depend();

			if (!root)
				return;

			if (key) {
				return root[key];
			} else {
				return root;
			}
		};

		// Settter for root object and properties
		this.set = function()
		{
			//If only called with one argument
			if(arguments.length === 1)
			{
				//Unobserve object
				unobserve(root);
				//Set root object
				root = arguments[0];
				//Observe new one
				observe(root);
				//And fire dependency
				dep.changed();
			} else if (root) {
				//Get path, value and corresponding object
				var key = arguments[0];
				var value = arguments[1];
				var object = root[key];

				//Unobserve object
				unobserve(object);
				//Set property
				root[key] = value;

				//Observe new one
				observe(value);
			}
		};
		
		this.has = function(key) {
			//If running inside a an active Tracker computation
			if(Tracker.active)
				//Add a dependency
				dep.depend();

			if (!root)
				return;

			//Check if it has the key
			return root.hasOwnProperty (key)
		};
		
		this.keys = function() {
			//If running inside a an active Tracker computation
			if(Tracker.active)
				//Add a dependency
				dep.depend();

			if (!root)
				return [];

			//Return object keys
			return Object.keys(root);
		};
		
		this.values = function() {
			var values = [];
			//If running inside a an active Tracker computation
			if(Tracker.active)
				//Add a dependency
				dep.depend();

			if (!root)
				return [];

			//For each key in object
			for (var key in root)
				if (root.hasOwnProperty (key))
					//Add to values
					values.push(root[key]);

			//REturn keys
			return values;
		};
		
		this.entries = function() {
			var entries = [];
			//If running inside a an active Tracker computation
			if(Tracker.active)
				//Add a dependency
				dep.depend();

			if (!root)
				return [];

			//For each key in object
			for (var key in root)
				if (root.hasOwnProperty (key))
					//Add to values
					entries.push([key,root[key]]);
			//REturn keys
			return entries;
		};

		this.delete = function(key) {
			if (!root)
				return;

			if (!root.hasOwnProperty(key))
				return;

			//Get corresponding object
			var object = root[key];

			// Remove from root object
			delete root[key];
			//Unobserve object
			unobserve(object);
		};
	}

	return ReactiveObject;
};
