var expect = require("expect.js");

var TestServer = require("./lib/server");
var helper = require("../lib/control-helper");

var SERVER_HOST = "localhost";
var CLIENT_HOST = "192.168.0.2";
var CLIENT_NAME = "mac-mini";

var PlexControl = require("..").PlexControl;

describe("API Facade", function() {
	var control;
	var extHelper;
	var server = new TestServer();

	before(function(done) {
		control = new PlexControl(SERVER_HOST, CLIENT_NAME);
		extHelper = helper.extensionHelper(control);
		server.start(done);
	});

	after(function(done) {
		server.stop(done);
	});

	describe("extensionHelper()", function() {
		it("exists", function() {
			expect(helper.extensionHelper).to.be.a('function');
		});

		it("requires control instance as first parameter", function() {
			expect(function() {
				helper.extensionHelper();
			}).to.throwException("TypeError");
		});

		describe("performOnClient()", function() {
			it("should wait for client to be resolved before performing any API-command", function(done) {
				extHelper.performOnClient('/navigation/moveUp').done(function() {
					expect(isUriRequested('/navigation/moveUp')).to.be(true);
					done();
				});

				setImmediate(function(){
					expect(isUriRequested('/navigation/moveUp')).to.be(false);

					control.emit("resolved", control.client);
				});
			});
		});

		describe("actionPrefix()", function() {
			it("should return a function wrapping performOnClient() which takes action name as parameter", function() {
				var actionPrefixFn = extHelper.actionPrefix("/navigation");

				return actionPrefixFn("moveUp")().then(function() {
					expect(isUriRequested('/navigation/moveUp')).to.be(true);
				});
			});
		});

		describe("createApiFromActions()", function() {
			it("should map array of strings into object with each string as key", function() {
				var noop = function() {};

				var createdApi = extHelper.createApiFromActions(noop, ["moveUp", "moveDown"]);

				expect(createdApi).to.be.an('object');
				expect(Object.keys(createdApi).length).to.be(2);
			});

			it("should create object with values created by function given as first argument", function() {
				var returnsActionName = function(action) { return action; };

				var createdApi = extHelper.createApiFromActions(returnsActionName, ["moveUp", "moveDown"]);

				expect(createdApi["moveUp"]).to.be("moveUp");
				expect(createdApi["moveDown"]).to.be("moveDown");
			});
		});
	});

	function isUriRequested(relativeUri) {
		return server.uri("/system/players/" + CLIENT_HOST + relativeUri).requested;
	}

});