var r = require('r');

var Filesystem = r('../index').Filesystem;
var BootLoader = r('../bootloader').BootLoader;

exports.fs = new Filesystem({ root: { name: 'FILESYSTEM_ROOT_/', files: {} } });
exports.bootLoader = new BootLoader(exports.fs, function() {
	console.log('api:', arguments);
}, {
	baseUrl: 'filesystem'
}, function(main) {
	console.log('main:', main);
});
