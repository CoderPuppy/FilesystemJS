define(function(require, exports, module) {
	var fs = require('FS');
	var api = require('API');
	
	console.log(fs, api);
	
	exports.something = 'something else';
	
	api();
});
