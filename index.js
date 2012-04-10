define(['require', 'exports'], function(require, exports) {
	var defaultData = exports.defaultData = {
		root: parentify(nameify({
			name: 'FILESYSTEM_ROOT_/',
			files: {
				home: {
					files: {
						user: {
							files: {
								'README.md': {
									contents: ''
								}
							}
						}
					}
				}
			}
		}))
	};
	
	function clone(o) {
		function O() {}
		O.prototype = o;
		return new O;
	}
	
	var Filesystem = exports.Filesystem = (function() {
		function Filesystem(data) {
			this.data = nameify(parentify(data || clone(defaultData)));
			this.currentDir = this.data.root;
		}
	
		//var currentDir = exports.currentDir = fs.root;

		Filesystem.prototype.getFile = function getFile(path, curDir) {
				var tmpDir, pathArr;
			
				if(!curDir) curDir = this.currentDir;
				if(!path || path.length == 0) return curDir;
				if(path.length > 0 && path[0] == '/') curDir = this.data.root;
			
				tmpDir = curDir;
				pathArr = path.split('/');
			
				pathArr.forEach(function(part) {
					if(part) {
						if(part == '..') {
							tmpDir = tmpDir.parent || tmpDir;
						} else if(part == '.') {
							return;
						} else if(this.isDir(tmpDir)) {
							if(this.hasFile(tmpDir, part)) tmpDir = tmpDir.files[part];
							else throw new Error("FileNotFoundError: Can not find file: '" +
								part +
								"' in directory: '" +
								this.pathTo(tmpDir));
							if(this.isSymlink(tmpDir)) {
								tmpDir = this.getSymlink(tmpDir);
							}
						} else {
							return false;
						}
					}
				});
			
				return tmpDir;
		};

		Filesystem.prototype.pathTo = function pathTo(file, /* internal */ isNested) {
			if(!isNested && file.name == this.data.root.name) return '/';
			if(!!file === false || (!!file && !!file.name && file.name == fs.root.name)) {
				return "";
			}
		
			return this.pathTo(file.parent, true) + '/' + file.name;
		};

		Filesystem.prototype.changeDir = function changeDir(dir) {
			if(dir && this.isDir(dir)) this.currentDir = dir;

			return dir;
		}

		Filesystem.prototype.createFile = function createFile(fileName, curDir) {
			var split, dir;
		
			if(!curDir) curDir = this.currentDir;

			split = fileName.split('/');
			dir = this.getFile(split.slice(0, split.length - 2).join('/'), curDir);
		
			console.log('dir:', dir);

			if(!this.hasFile(dir, split[split.length - 1])) {
				return dir.files[split[split.length - 1]] = {
					name: split[split.length - 1]
				};
			}
		};

		Filesystem.prototype.getSymlink = function getSymlink(file, curDir) {
			if(this.isSymlink(file)) return this.getFile(file.symlink, curDir);

			return file;
		}

		Filesystem.prototype.writeData = function writeData(file, data) {
			if(file && data) file.contents = data;

			return file;
		};

		Filesystem.prototype.initDir = function initDir(file) {
			if(file && !file.files) file.files = {};

			return file;
		};

		Filesystem.prototype.symlink = function symlink(file, where) {
			file.symlink = where;

			return file;
		};

		Filesystem.prototype.readFile = function readFile(file) {
			if(!file) return undefined;
		
			file = this.getSymlink(file);

			if(file && this.isFile(file)) return file.contents;
		}

		Filesystem.prototype.listFiles = function listFiles(dir) {
			dir = dir || this.currentDir;
		
			if(!this.isDir(dir)) return undefined;

			return Object.keys(dir.files).map(function(name) {
				return dir.files[name];
			});
		}

		Filesystem.prototype.hasFile = function hasFile(dir, name) {
			return dir && dir.files && dir.files[name];
		};

		Filesystem.prototype.isDir = function isDir(file) {
			return file && file.files;
		};

		Filesystem.prototype.isFile = function isFile(file) {
			return file && file.contents !== null && file.contents !== undefined;
		};

		Filesystem.prototype.isSymlink = function isSymlink(file) {
			return file && file.symlink;
		}
		
		return Filesystem;
	})();

	function parentify(data) {
		for(var key in data.files) {
			data.files[key].parent = data;
			
			if(data.files[key].files) data.files[key] = parentify(data.files[key]);
		}

		return data;
	}

	function nameify(data) {
		for(var key in data.files) {
			data.files[key].name = key;

			if(data.files[key].files) data.files[key] = nameify(data.files[key]);
		}

		return data;
	}
});
