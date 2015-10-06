var fs = require('fs');
var os = require('os');
var util = require('util');
var path = require('path');
var test = require('tape');
var tar = require('tar-stream');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var pump = require('pump');

var extract = require('../');

var f = util.format;
var deployDirectory = path.join(os.tmpdir(), 'taco-deploy-extract-test');

var setup = function(callback) {
	rimraf(deployDirectory, function(err) {
		if(err) return callback(err);
		mkdirp(deployDirectory, callback);
	});
};

test('deploy', function(t) {
	setup(function(err) {
		t.error(err);

		var pack = tar.pack();
		pack.entry({ name: 'package.json' }, JSON.stringify({ name: 'my-service', version: '1.0.0' }));
		pack.finalize();

		var stream = extract({ path: deployDirectory });

		pump(pack, stream, function(err) {
			t.error(err);

			var deployDirectoryContent = fs.readdirSync(deployDirectory);

			t.deepEquals(deployDirectoryContent, ['deploys', 'versions']);

			var deploysContent = fs.readdirSync(path.join(deployDirectory, 'deploys'));
			var versionsContent = fs.readdirSync(path.join(deployDirectory, 'versions'));

			t.deepEquals(deploysContent, ['my-service']);
			t.equals(versionsContent.length, 1);
			t.ok(/^my-service-\d+$/.test(versionsContent[0]), f('"%s" should match pattern', versionsContent[0]));

			var linkContent = fs.readlinkSync(path.join(deployDirectory, 'deploys', 'my-service'));

			t.equals('../versions/' + versionsContent[0], linkContent);

			pack = tar.pack();
			pack.entry({ name: 'package.json' }, JSON.stringify({ name: 'my-service', version: '2.0.0' }));
			pack.finalize();

			stream = extract({ path: deployDirectory });

			pump(pack, stream, function(err) {
				t.error(err);

				var updatedDeploysContent = fs.readdirSync(path.join(deployDirectory, 'deploys'));
				var updatedVersionsContent = fs.readdirSync(path.join(deployDirectory, 'versions'));
				var oldVersionIndex = updatedVersionsContent.indexOf(versionsContent[0]);
				var newVersionIndex = 1 - oldVersionIndex;

				t.deepEquals(updatedDeploysContent, ['my-service']);
				t.equals(updatedVersionsContent.length, 2);
				t.ok(oldVersionIndex >= 0, 'should contain old version');
				t.ok(/^my-service-\d+$/.test(updatedVersionsContent[newVersionIndex]), f('"%s" should match pattern', updatedVersionsContent[newVersionIndex]));

				var updatedLinkContent = fs.readlinkSync(path.join(deployDirectory, 'deploys', 'my-service'));

				t.equals('../versions/' + updatedVersionsContent[newVersionIndex], updatedLinkContent);
				t.end();
			});
		});
	});
});
