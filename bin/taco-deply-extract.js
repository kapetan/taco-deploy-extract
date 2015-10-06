#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var minimist = require('minimist');

var extract = require('../');

var argv = minimist(process.argv.slice(2));

var target = argv._[0];

if(!target) {
	var usage = fs.readFileSync(path.join(__dirname, 'usage.txt'), 'utf-8');
	console.log(usage);
	process.exit(1);
}

var stream = extract({ path: target })
	.on('finish', function() {
		console.error('Finished deploying');
	})
	.on('error', function(err) {
		console.error(err.message);
		process.exit(1);
	});

process.stdin.pipe(stream);
