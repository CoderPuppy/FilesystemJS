define(['require', 'exports'], function(require, exports) {
	var fs = exports.data = {
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
	
	var currentDir = exports.currentDir = fs.root;

	exports.getFile = function getFile(path, curDir) {
			var tmpDir, pathArr;
			
			if(!curDir) curDir = exports.currentDir;
			if(!path || path.length == 0) return curDir;
			if(path.length > 0 && path[0] == '/') curDir = fs.root;
			
			tmpDir = curDir;
			pathArr = path.split('/');
			
			pathArr.forEach(function(part) {
				if(part) {
					if(part == '..') {
						tmpDir = tmpDir.parent || tmpDir;
					} else if(part == '.') {
						return;
					} else if(exports.isDir(tmpDir)) {
						if(exports.hasFile(tmpDir, part)) tmpDir = tmpDir.files[part];
						else throw new Error("FileNotFoundError: Can not find file: '" +
							part +
							"' in directory: '" +
							exports.pathTo(tmpDir));
						if(exports.isSymlink(tmpDir)) {
							tmpDir = exports.getSymlink(tmpDir);
						}
					} else {
						return false;
					}
				}
			});
			
			return tmpDir;
	};

	exports.pathTo = function pathTo(file, /* internal */ isNested) {
		if(!isNested && file.name == fs.root.name) return '/';
		if(!!file === false || (!!file && !!file.name && file.name == fs.root.name)) {
			return "";
		}
		
		return exports.pathTo(file.parent, true) + '/' + file.name;
	};

	exports.changeDir = function changeDir(dir) {
		if(dir && exports.isDir(dir)) currentDir = exports.currentDir = dir;

		return dir;
	}

	exports.createFile = function createFile(fileName, curDir) {
		var split, dir;
		
		if(!curDir) curDir = exports.currentDir;

		split = fileName.split('/');
		dir = exports.getFile(split.slice(0, split.length - 2).join('/'), curDir);
		
		console.log('dir:', dir);

		if(!exports.hasFile(dir, split[split.length - 1])) {
			return dir.files[split[split.length - 1]] = {
				name: split[split.length - 1]
			};
		}
	};

	exports.getSymlink = function getSymlink(file) {
		if(exports.isSymlink(file)) return exports.getFile(file.symlink);

		return file;
	}

	exports.writeData = function writeData(file, data) {
		if(file && data) file.contents = data;

		return file;
	};

	exports.initDir = function initDir(file) {
		if(file && !file.files) file.files = {};

		return file;
	};

	exports.symlink = function symlink(file, where) {
		file.symlink = where;

		return file;
	};

	exports.readFile = function readFile(file) {
		if(!file) return undefined;
		
		file = exports.getSymlink(file);

		if(file && exports.isFile(file)) return file.contents;
	}

	exports.listFiles = function listFiles(dir) {
		dir = dir || currentDir;
		
		if(!exports.isDir(dir)) return undefined;

		return Object.keys(dir.files).map(function(name) {
			return dir.files[name];
		});
	}

	exports.hasFile = function hasFile(dir, name) {
		return dir && dir.files && dir.files[name];
	};

	exports.isDir = function isDir(file) {
		return file && file.files;
	};

	exports.isFile = function isFile(file) {
		return file && file.contents !== null && file.contents !== undefined;
	};

	exports.isSymlink = function isSymlink(file) {
		return file && file.symlink;
	}

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
