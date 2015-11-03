var fs = require('fs');
var os = require('os');
var path = require('path');
var tar = require('tar-fs');
var mkdirp = require('mkdirp');
var cuid = require('cuid');
var series = require('run-series');
var duplexify = require('duplexify');

module.exports = function(options) {
	options = options || {};

	options.path = options.path || process.cwd();
	options.tmpdir = options.tmpdir || path.join(os.tmpdir(), 'taco-deploy-extract-' + cuid());

	var onfinish = function(callback) {
		var name = options.name;

		if(!name) {
			try {
				var pkg = require(path.join(options.tmpdir, 'package.json'));
				name = pkg.name;
			} catch(err) {
				return callback(err);
			}
		}
		
		var versionName = name + '-' + Date.now();
		var versionDirectory = path.join(options.path, 'versions');
		var versionPath = path.join(versionDirectory, versionName);
		var deployDirectory = path.join(options.path, 'deploys');
		var deployPath = path.join(deployDirectory, name);

		stream.name = name;
		stream.path = deployPath;

		series([
			function(next) {
				mkdirp(versionDirectory, next);
			},
			function(next) {
				mkdirp(deployDirectory, next);
			},
			function(next) {
				fs.rename(options.tmpdir, versionPath, next);
			},
			function(next) {
				fs.unlink(deployPath, function() {
					next();
				});
			},
			function(next) {
				var link = path.join('..', 'versions', versionName);
				fs.symlink(link, deployPath, next);
			}
		], callback);
	};

	var extract = tar.extract(options.tmpdir);
	var stream = duplexify();

	stream.setWritable(extract);
	stream.setReadable(null);

	stream.on('prefinish', function() {
		stream.cork();

		onfinish(function(err) {
			if(err) return stream.destroy(err);
			stream.uncork();
		});
	});

	return stream;
};
