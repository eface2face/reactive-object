module.exports = function(Meteor) {
var Tracker = Meteor.Tracker

require('object.observe')

var robserve = require('robserve')


function ReactiveObject(object)
{
	// called without `new`
	if (!(this instanceof ReactiveObject))
		return new ReactiveObject(object)

	object = object || {}

	var dep      = new Tracker.Dependency
	var observer = dep.changed.bind(dep)

	new robserve(object, observer)


	// Entries

	this.get = function(path)
	{
		if(Tracker.active) dep.depend()

		var result = object

		if(path == undefined)       path = []
		if(typeof path == 'string') path = path.split('.')

		path.forEach(function(key)
		{
			result = result[key]
		})

		return result
	}

	this.set = function(path, value)
	{
		if(arguments.length < 2)
		{
			value = path
			path = undefined
		}

		if(path == undefined)       path = []
		if(typeof path == 'string') path = path.split('.')

		var key = path.pop()

		var aux = object
		path.forEach(function(key)
		{
			aux = aux[key]
		})

		aux[key] = value
	}
}


Object.defineProperty(ReactiveObject, 'length', {enumerable: true, value: 1})


return ReactiveObject
}
