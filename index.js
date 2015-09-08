var debug = require('debug')('reactive-object');

module.exports = function(Meteor) {
	
	var Tracker = Meteor.Tracker;
	
	function ReactiveObject(object)
	{
		// called without `new`
		if (!(this instanceof ReactiveObject))
			return new ReactiveObject(object);

		//Store the object we are observing
		var root = object || {};

		//Tracker dependencies
		var dep  = new Tracker.Dependency;
		
		var observer = function (changes) {
			//Debug
			debug('Changes observed',changes)
			//For each change
			changes.forEach(function(change) {
				//The properties of these change objects are:
				// name: The name of the property which was changed.
				// object: The changed object after the change was made.
				// type: A string indicating the type of change taking place. One of "add", "update", or "delete".
				// oldValue: Only for "update" and "delete" types. The value before the change.
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
				}
			});
			//And fire dependency
			dep.changed();
		};
		
		//The recursive unobserve function
		var unobserve = function(object) {
			//Ensure it is an object and not falsey
			if (object && typeof object === 'object') {
				//Debug
				debug('Unobserving object ',object)
				//Observe object first
				Object.unobserve(object,observer);
				//Check type of observerd object
				if (Array.isArray(object)) {
					//Now observe  values recursively
					object.forEach(function(value) {
						//recursivelly observe it alseo
						unobserve(value);
					});
				} else {
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
				//Debug
				debug('Observing object ',object)
				//Observe object first
				Object.observe(object,observer,["add", "update", "delete"]);
				//Check type of observerd object
				if (Array.isArray(object)) {
					//Now observe  values recursively
					object.forEach(function(value) {
						//recursivelly observe it alseo
						observe(value);
					});
				} else {
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

		// Gettter for root object and properties
		this.get = function(path) {
			
			//If running inside a an active Tracker computation
			if(Tracker.active)
				//Add a dependency
				dep.depend();

			//Start searching from root object
			var object = root;

			//Sanetize path inputs
			path = path || [];
			if(typeof path === 'string') path = path.split('.');

			//Walk path
			path.forEach(function(key) {
				//Get child property
				object = object[key];
			});

			return object;
		}

		// Settter for root object and properties
		this.set = function()
		{
			//If only called with one argument
			if(arguments.length < 2)
			{
				//Unobserve object
				unobserve(root);
				//Set root object
				root = arguments[0];
				//Observe new one
				observe(root);
			} else {
				//Get path and value
				var path = arguments[0] || [];
				var value = arguments[1];

				if(typeof path == 'string')
					path = path.split('.');

				//Remove root
				var object = root;
				
				//Walk path to find the required value
				path.forEach(function(key) {
					//Get child property
					object = object[key];
				});
				//Unobserve object
				unobserve(object);
				//Set property
				object = value;
				//Observe new one
				observe(root);
			}
		}
	}

	return ReactiveObject;
};
