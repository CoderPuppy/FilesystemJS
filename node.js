var r = require('r');

var Filesystem = r('./index').Filesystem;

var fs = new Filesystem();

console.log(fs.files('**/..'));

var BootLoader = r('./bootloader').BootLoader;

var bootLoader = new BootLoader(fs = new Filesystem({
	root: {
		files: {
			boot: {
				files: {
					"main.js": {
						contents: "define(function(require, exports, module) { console.log('hi'); });"
					}
				}
			}
		}
	}
}));
