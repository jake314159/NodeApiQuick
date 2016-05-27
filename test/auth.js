var should = require('should');

var api = require('../lib/ApiQuick');
api.init(8080, {consoleLog: 'ERROR'});

// Add some packages we can use to test
// 1. A package with no auth that will use the global auth function
api.addPackage('p1', 
	{
		'f1': function(req, cb) {
			cb(null, {});
		}
	}
);

// 2. A package with it's own auth function
api.addPackage('p2', 
	{
		'f2': function(req, cb) {
			cb(null, {});
		}
	}, {
		'auth': function(user, pass) {
			return user == 'user3' && pass == 'key1'
		}
	}
);

// 3. A package with auth disabled
api.addPackage('p3',
	{
		'f2': function(req, cb) {
			cb(null, {});
		}
	}, {
		'auth': false
	}
);

describe('authByJsonFunction()', function () {

	it('Single api key for a user', function (done) {
		var checkFunction = api.authByJsonFunction({
			'user': 'key843298'
		});

		should.exist(checkFunction);

		checkFunction('user', 'key843298').should.equal(true);
		checkFunction('user', 'other_key').should.equal(false);
		done();
	});

	it('Multiple api keys for a user', function (done) {
		var checkFunction = api.authByJsonFunction({
			'user': ['key1', 'key2']
		});

		should.exist(checkFunction);

		checkFunction('user', 'key0').should.equal(false);
		checkFunction('user', 'key1').should.equal(true);
		checkFunction('user', 'other_key').should.equal(false);
		checkFunction('user', 'key2').should.equal(true);
		done();
	});

	it('Multiple users', function (done) {
		var checkFunction = api.authByJsonFunction({
			'user1': ['key1'],
			'user2': ['key2']
		});

		should.exist(checkFunction);

		checkFunction('user1', 'key0').should.equal(false);
		checkFunction('user1', 'key1').should.equal(true);
		checkFunction('user1', 'other_key').should.equal(false);
		checkFunction('user1', 'key2').should.equal(false);

		checkFunction('user2', 'key0').should.equal(false);
		checkFunction('user2', 'key1').should.equal(false);
		checkFunction('user2', 'other_key').should.equal(false);
		checkFunction('user2', 'key2').should.equal(true);

		checkFunction('user3', 'key0').should.equal(false);
		checkFunction('user3', 'key1').should.equal(false);
		checkFunction('user3', 'other_key').should.equal(false);
		checkFunction('user3', 'key2').should.equal(false);

		done();
	});

	it('No users', function (done) {
		var checkFunction = api.authByJsonFunction({});

		should.exist(checkFunction);

		checkFunction('user', 'key1').should.equal(false);
		checkFunction('user', 'key2').should.equal(false);
		done();
	});

	it('Undefined credentials', function (done) {
		var checkFunction = api.authByJsonFunction();

		should.exist(checkFunction);

		checkFunction('user', 'key1').should.equal(false);
		checkFunction('user', 'key2').should.equal(false);
		done();
	});
});

/* TODO: How this function works has changed!!
describe('checkAuthDetails()', function () {

	it('Global json auth', function (done) {
		credentials = {'user1': 'key1', 'user2':['key2', 'key3']}
		api.authByJson(credentials);

		api.checkAuthDetails('p1', 'f1', undefined, {'user': 'user1', 'pass': 'key1'}).should.equal(true);
		api.checkAuthDetails('p1', 'f1', undefined, {'user': 'user1', 'pass': 'key2'}).should.equal(false);
		api.checkAuthDetails('p1', 'f1', undefined, {'user': 'user2', 'pass': 'key1'}).should.equal(false);
		api.checkAuthDetails('p1', 'f1', undefined, {'user': 'user2', 'pass': 'key2'}).should.equal(true);
		done();
	});

	it('Package specific json auth', function (done) {
		api.checkAuthDetails('p2', 'f2', undefined, {'user': 'user3', 'pass': 'key1'}).should.equal(true);
		api.checkAuthDetails('p2', 'f2', undefined, {'user': 'user3', 'pass': 'key2'}).should.equal(false);
		api.checkAuthDetails('p2', 'f2', undefined, {'user': 'user2', 'pass': 'key1'}).should.equal(false);
		api.checkAuthDetails('p2', 'f2', undefined, {'user': 'user2', 'pass': 'key2'}).should.equal(false);
		done();
	});

	it('Disable auth for a specific package with auth=false', function (done) {
		api.auth(function(){return false;}); // Globally reject
		api.checkAuthDetails('p1', 'f1', undefined, {'user': 'user3', 'pass': 'key1'}).should.equal(false);
		api.checkAuthDetails('p1', 'f1', undefined, {'user': 'user3', 'pass': 'key2'}).should.equal(false);
		api.checkAuthDetails('p1', 'f1', undefined, {'user': 'user2', 'pass': 'key1'}).should.equal(false);
		api.checkAuthDetails('p1', 'f1', undefined, {'user': 'user2', 'pass': 'key2'}).should.equal(false);

		// Auth siabled for p3
		api.checkAuthDetails('p3', 'f1', undefined, {'user': 'user3', 'pass': 'key1'}).should.equal(false);
		api.checkAuthDetails('p3', 'f1', undefined, {'user': 'user3', 'pass': 'key2'}).should.equal(false);
		api.checkAuthDetails('p3', 'f1', undefined, {'user': 'user2', 'pass': 'key1'}).should.equal(false);
		api.checkAuthDetails('p3', 'f1', undefined, {'user': 'user2', 'pass': 'key2'}).should.equal(false);

		done();
	});
});
*/
describe('decodeAuthDetails()', function () {

	it('Simple basic auth (capital B)', function (done) {
		var input = 'Basic dXNlcjE6a2V5MQ==';
		var data = api.decodeAuthDetails(input);

		should.exist(data);
		should.exist(data.user);
		should.exist(data.pass);
		data.user.should.equal('user1');
		data.pass.should.equal('key1');
		done();
	});

	it('Simple basic auth (lower b)', function (done) {
		var input = 'basic dXNlcjE6a2V5MQ==';
		var data = api.decodeAuthDetails(input);

		should.exist(data);
		should.exist(data.user);
		should.exist(data.pass);
		data.user.should.equal('user1');
		data.pass.should.equal('key1');
		done();
	});

	it('Long username and password', function (done) {
		var input = 'basic YV92ZXJ5X3ZlcnlfbG9uZ191c2VybmFtZV90aGF0X2Rqc2FrbGRqc2Fsa2RqaW9zamRpb2FmZHNpZmhkaXN1aGZ1aXNkYWhmaXVkc2hmaXVkaHNhaXVmaGRzdWloZml1ZHNhaGZzaXVzamRvaWpzYWlvZGpzYWlvOmFuZF9hX3ZlcnlfdmVyeV9sb25nX3Bhc3N3b3JkX2Zkb2lzZmpkc29pZmppb2RzamZkc2prZmlzZGZoaXVhaGZpdWhzZGl1ZmhkaXVzaGZpdWRzaGZ1aXNoYWlmaW9zZGppb2o=';
		var data = api.decodeAuthDetails(input);

		var user = 'a_very_very_long_username_that_djsakldjsalkdjiosjdioafdsifhdisuhfuisdahfiudshfiudhsaiufhdsuihfiudsahfsiusjdoijsaiodjsaio';
		var pass = 'and_a_very_very_long_password_fdoisfjdsoifjiodsjfdsjkfisdfhiuahfiuhsdiufhdiushfiudshfuishaifiosdjioj';

		should.exist(data);
		should.exist(data.user);
		should.exist(data.pass);
		data.user.should.equal(user);
		data.pass.should.equal(pass);
		done();
	});

	it('Without a :', function (done) {
		var input = 'basic dXNlcl93aXRob3V0X2tleQ==';
		var data = api.decodeAuthDetails(input);

		should.exist(data);
		should.not.exist(data.user);
		should.not.exist(data.pass);
		done();
	});

	it('No base64', function (done) {
		var input = 'basic ';
		var data = api.decodeAuthDetails(input);

		should.exist(data);
		should.not.exist(data.user);
		should.not.exist(data.pass);
		done();
	});

	it('Invalid base64', function (done) {
		var input = 'basic <><><>';
		var data = api.decodeAuthDetails(input);

		should.exist(data);
		should.not.exist(data.user);
		should.not.exist(data.pass);
		done();
	});

	it('Empty string input', function (done) {
		var input = '';
		var data = api.decodeAuthDetails(input);

		should.exist(data);
		should.not.exist(data.user);
		should.not.exist(data.pass);
		done();
	});

	it('undefined input', function (done) {
		var input = undefined;
		var data = api.decodeAuthDetails(input);

		should.exist(data);
		should.not.exist(data.user);
		should.not.exist(data.pass);
		done();
	});
});
