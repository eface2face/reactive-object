//Enable debug
process.env.DEBUG = "*";
var debug = require('debug')('test');
var test = require('tape');
var Meteor = {
	Tracker : {
		active: false,
		//Placehoder
		changed: function() {},
		Dependency : function() {
			this.changed = Meteor.Tracker.changed;
		}
	}
};
var ReactiveObject = require('./index.js')(Meteor);

test('Observe simple object', function (t) {
	Meteor.Tracker.changed = function() {
		debug('Meteor.Tracker.changed'); 
		t.ok(true,"Changed");
	};
	//Only one expected
	t.plan(1);
	//Object
	var o = { a: 1 };
	//Create reactive object
	var r = new ReactiveObject(o);
	//Change property
	o.a = 2;
});

test('Observe nested object', function (t) {
	Meteor.Tracker.changed = function() {
		debug('Meteor.Tracker.changed'); 
		t.ok(true,"Changed");
	};
	//Only one expected
	t.plan(1);
	//Object
	var o = { a: { b: 1 } };
	//Create reactive object
	var r = new ReactiveObject(o);
	//Change property
	o.a.b = 2;
});

test('Observe nested array', function (t) {
	Meteor.Tracker.changed = function() {
		debug('Meteor.Tracker.changed'); 
		t.ok(true,"Changed");
	};
	//Only one expected
	t.plan(1);
	//Object
	var o = { a: [ 1 ] };
	//Create reactive object
	var r = new ReactiveObject(o);
	//Change property
	o.a.push(2);
});

test('Observe added nested object', function (t) {
	Meteor.Tracker.changed = function() {
		debug('Meteor.Tracker.changed'); 
		t.ok(true,"Changed");
	};
	//Only one expected
	t.plan(2);
	//Object
	var o = { a: null };
	//Create reactive object
	var r = new ReactiveObject(o);
	//Add nested object
	debug('Add nested object');
	o.a = { b : 1};
	//Change it
	setTimeout (function() {
		debug('Changed nested object');
		o.a.b = 2;
	},1);
});


test('Observe nested object delete', function (t) {
	Meteor.Tracker.changed = function() {
		debug('Meteor.Tracker.changed'); 
		t.ok(true,"Changed");
	};
	//Only two expected
	t.plan(2);
	var a = { b: 1 }
	//Object
	var o = { a:  a};
	//Create reactive object
	var r = new ReactiveObject(o);
	//Change property
	a.b = 2;
	//Delete it
	setTimeout (function() {
		debug('Delete nested object');
		delete o.a;
	},1);
	
	//Change it later
	setTimeout (function() {
		debug('Changed nested object');
		a = 2;
	},1);
});

test('Setter', function (t) {
	Meteor.Tracker.changed = function() {
		debug('Meteor.Tracker.changed'); 
	};
	//Only one expected
	t.plan(1);
	var a = { b: 1 };
	//Create reactive object
	var r = new ReactiveObject(a);
	//Set it
	r.set('b', 2);
	//Check values
	t.ok(a.b==2);
});

test('Observe simple object, start empty', function (t) {
	Meteor.Tracker.changed = function() {
		debug('Meteor.Tracker.changed'); 
		t.ok(true,"Changed");
	};
	//Only one expected
	t.plan(2);
	//Object
	var o = { a: 1 };
	//Create reactive object
	var r = new ReactiveObject();
	//Set it
	r.set(o);
	
	//Change it later
	setTimeout (function() {
		debug('Changed nested object');
		o.a = 2;
	},1);
});


test('Observe array delete', function (t) {
	Meteor.Tracker.changed = function() {
		debug('Meteor.Tracker.changed'); 
		t.ok(true,"Changed");
	};
	//Only one expected
	t.plan(2);
	//Object
	var o = { a: [{id: 1},{id:2}] };
	//Create reactive object
	var r = new ReactiveObject(o);
	//delete first 
	o.a.splice(0,1);
	
	//Change it later
	setTimeout (function() {
		debug('Changed nested object');
		o.a[0].id = 3;
	},1);
});


test('Observe array add', function (t) {
	Meteor.Tracker.changed = function() {
		debug('Meteor.Tracker.changed'); 
		t.ok(true,"Changed");
	};
	//Only one expected
	t.plan(2);
	//Object
	var o = { a: [{id: 1},{id:2}] };
	//Create reactive object
	var r = new ReactiveObject(o);
	//delete first 
	o.a.push({id:3});
	
	//Change it later
	setTimeout (function() {
		debug('Changed nested object');
		o.a[2].id = 4;
	},1);
});


//TODO: Add tests for keys(),values(),entries(),has()
test('Setter simple object', function (t) {
	Meteor.Tracker.changed = function() {
	};
	//Two expected
	t.plan(5);
	//Object
	var o = { a: 1 };
	//Create reactive object
	var r = new ReactiveObject();
	//Set empty
	r.set({});
	//Add value
	r.set("1",o);
	//Check
	t.ok(r.get("1")===o, "Checking setter");
	//Get values
	t.ok(r.keys().length===1 ,"Checking keys length");
	t.ok(r.keys()[0]==="1", "Checking keys value");
	t.ok(r.values().length===1, "Checking values length");
	t.ok(r.values()[0] === o, "Checking values value");
});