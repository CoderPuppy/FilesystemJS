define(['require', 'exports', './stream'], function(require, exports, Stream) {
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
	
	var pathSplitRe = /(^|\\\\|[^\\])\//g;
	
	function clone(o) {
		function cloned() {}
		cloned.prototype = o;
		return new cloned;
	}
	
	function merge(dest, source) {
		for(key in source) {
			dest[key] = source[key];
		}
		
		return dest;
	}
	
	function execRe(re, str) {
		var matches = [], curMatch;
		
		while(curMatch = re.exec(str)) { matches.push(curMatch) }
		
		return matches;
	}
	
	Object.values = function values(obj) {
		return Object.keys(obj).map(function(key) {
			return obj[key];
		});
	};
	
	Array.prototype.unique = function unique() {
		var a = [];
		var l = this.length;
		
		for(var i=0; i<l; i++) {
			for(var j=i+1; j<l; j++) {
		    	// If this[i] is found later in the array
				if (this[i] === this[j])
					j = ++i;
			}
			
			a.push(this[i]);
		}
		
		return a;
	};
	
	var Filesystem = exports.Filesystem = (function() {
		function Filesystem(data) {
			this.data = data || clone(defaultData);
			this.currentDir = this.data.root;
			
			this.data.root = nameify(parentify(this.data.root));
		}

		Filesystem.prototype.getFile = function getFile(path, curDir) {
				var tmpDir, pathArr, self;
			
				if(!curDir) curDir = this.currentDir;
				if(!path || path.length == 0) return curDir;
				if(path.length > 0 && path[0] == '/') curDir = this.data.root;
				
				self = this
				tmpDir = curDir;
				pathArr = path.split('/');
			
				pathArr.forEach(function(part) {
					if(part) {
						if(part == '..') {
							tmpDir = tmpDir.parent || tmpDir;
						} else if(part == '.') {
							return;
						} else if(self.isDir(tmpDir)) {
							if(self.hasFile(tmpDir, part)) tmpDir = tmpDir.files[part];
							else throw new Error("FileNotFoundError: Can not find file: '" +
								part +
								"' in directory: '" +
								self.pathTo(tmpDir));
							if(self.isSymlink(tmpDir)) {
								tmpDir = self.getSymlink(tmpDir);
							}
						} else {
							return false;
						}
					}
				});
			
				return tmpDir;
		};

		Filesystem.prototype.pathTo = function pathTo(file, dir, /* internal */ isNested) {
			if(!file || (!!file && !!file.name && file.name == this.data.root.name)) {
				return '';
			}
			
			if(file.name == this.data.root.name) {
				if(!isNested) return '/';
				else return '';
			}
		
			return ( file.parent == dir ? '' : this.pathTo(file.parent, dir, true) + '/' ) + file.name;
		};

		Filesystem.prototype.changeDir = function changeDir(dir) {
			if(dir && this.isDir(dir)) this.currentDir = dir;

			return dir;
		}
		
		Filesystem.prototype.openStream = function openStream(file, options) {
			var stream = new Stream(), self = this;
			
			if(options && options.dir == 'in' && this.isFile(file)) {
				stream.pause().on('unpause', function() {
					stream.write(self.readFile(file));
				});
			} else {
				if(!options || !options.appending) this.writeData(file, '');
				
				stream.on('data', function(d) {
					self.writeData(file, d, { appending: true });
				});
			}
			
			return stream;
		};

		Filesystem.prototype.createFile = function createFile(fileName, curDir) {
			var split, dir;
		
			if(!curDir) curDir = this.currentDir;

			split = fileName.split(/(^|\\\\|[^\\])\//);
			dir = this.getFile(split.slice(0, split.length - 2).join('/'), curDir);

			if(!this.hasFile(dir, split[split.length - 1])) {
				return dir.files[split[split.length - 1]] = {
					name: split[split.length - 1],
					parent: dir
				};
			}
		};

		Filesystem.prototype.getSymlink = function getSymlink(file, curDir) {
			if(this.isSymlink(file)) return this.getFile(file.symlink, curDir);

			return file;
		}

		Filesystem.prototype.writeData = function writeData(file, data, options) {
			if(file && typeof(data) != 'undefined') file.contents = (options && options.appending ? file.contents : '') + data;

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
		};
		
		Filesystem.prototype.setAsExec = function setAsExec(file) {
			if(file && !this.isDir(file)) file.executable = true;
			
			return file;
		};

		Filesystem.prototype.hasFile = function hasFile(dir, name) {
			var good = false;
			
			var nameSplit = name.split(/(^|\\\\|[^\\])\//), tmpDir = dir || this.currentDir;
			
			tmpDir = this.getFile(nameSplit.slice(0, nameSplit.length - 1).join('/'), tmpDir);
			
			good = !!(tmpDir && tmpDir.files && tmpDir.files[nameSplit[nameSplit.length - 1]]);
			
			return good;
		};
		
		Filesystem.prototype.contentType = function contentType(file) {
			var contentType = 'file/empty';
			
			if(file && file.contentType) {
				contentType = file.contentType;
			} else if(this.isDir(file)) {
				contentType = 'file/folder';
			} else if(file && file.command) {
				contentType = 'application/command';
			}
			
			return contentType;
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
		
		Filesystem.prototype.isExec = function isExec(file) {
			return file && file.executable;
		};
		
		// New easier API
		
		// START HIDDEN
		
		function splitPath(path) {
			var parts = [],
				splits = execRe(pathSplitRe, path),
				lastIndex = 0;
			
			for(var i = 0; i < splits.length; i++) {
				parts.push(path.slice(lastIndex, min(splits[i].index + splits[i][1].length, 0)).replace(/\\([\\\/])/g, '$1').replace(/\\([\\\/])/g, '$1'));
				
				parts[parts.length - 1].before = splits[i][1];
				
				lastIndex = splits[i].index + splits[i][1].length + 1;
			}
			
			parts.push(path.slice(lastIndex + ( splits.length > i ? 1 : 0 )).replace(/\\([\\\/])/g, '$1').replace(/\\([\\\/])/g, '$1'));
				
			parts[parts.length - 1].before = splits.length > i ? splits[i - 1][1] : '';
			
			return parts;
		}
		
		function joinPath(parts) {
			var joined = '';
			
			if(parts.length > 0) {
				joined += parts[0].replace(/(^|\\\\|[^\\])(\\|\/)([^\/\\]|$)/g, function($A, $1, $2, $3) {
					return $1 + '\\' + $2 + $3;
				})//.replace(/(^|\\\\|[^\\])([\\\/])/g, '$1\\$2');
			
				for(var i = 1; i < parts.length; i++) {
					joined += '/' + parts[i].replace(/(^|\\\\|[^\\])(\\|\/)([^\/\\]|$)/g, function($A, $1, $2, $3) {
						return $1 + '\\' + $2 + $3;
					})//.replace(/(^|\\\\|[^\\])([\\\/])/g, '$1\\$2');
				}
			}
			
			return joined;
		}
		
		function slicePath(parts, start, end) {
			return parts.slice(start, end).map(function(v, i) {
				return merge(v, {
					before: parts[i].before
				});
			});
		}
		
		function min(val, min) {
			return val < min ? min : val;
		}
		
		function createFileRe(part) {
			return new RegExp('^' + part.replace(/[\.\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.?').replace(/[-[\]{}()+,^$|#\s]/g, "\\$&") + '$');
		}
		
		Filesystem.prototype._getFiles = function _getFiles(where, options, nested) {
			options = options || {};
			
			var files = [],
				path = splitPath(typeof(where) == 'string' ? where : this.pathTo(where, options.dir || this.currentDir))/*.split(/(^|\\\\|[^\\])\//)*/,
				searchFiles = [],
				oriLen = path.length,
				self = this,
				dir = options.dir || this.currentDir,
				newFiles = [],
				folders = [],
				wildcards = !!options.wildcards,
				part;
			
			if(path[0].trim().length === 0 && path.length >= 2) {
				dir = this.data.root;
				path.splice(0, 1);
				
				if(path[0].trim().length === 0) {
					path.splice(0, 1);
				}
			}
			if(path[0] && path[0].trim() === '.') {
				dir = options.dir || this.currentDir;
				path.splice(0, 1);
			}
			
			if(oriLen < 1) {
				return [ dir ];
			}
			
			part = path[0];
			
			searchFiles = Object.values(dir.files);
			
			if(part === '**' && wildcards) {
				files = searchFiles;
			} else if(/\*|\?/g.test(part) && wildcards) {
				files = searchFiles.filter(function(file) {
					return createFileRe(part).test(self.pathTo(file, dir));
				}); 
			} else if(part == '..') {
				files.push(dir.parent || dir);
			} else if(dir.files[part]) {
				files.push(dir.files[part]);
			} else if(options.create == exports.ALL || ( options.create == exports.FINAL && path.length <= 1 ) || !!options.create){
				files.push(this.createFile(part, dir));
				
				if(path.length > 1) {
					files[0].files = {};
				}
			}
			
			if(options.resolveSymlinks === exports.ALL ||
				( options.resolveSymlinks === exports.FINAL && path.length <= 1 ) ||
				( options.resolveSymlinks === exports.BEGIN && !nested )) {
				files = files.map(function(file) {
					return self.getSymlink(file, file.parent);
				});
			}
			
			if(part === '**' && wildcards) {
				newFiles = newFiles.concat(this._getFiles(joinPath(slicePath(path, 1)) || '*', merge(clone(options), { dir: dir }), true));
				
				folders = files.filter(function(file) {
					return typeof(file) == 'object' && typeof(file.files) == 'object';
				});
				
				folders.forEach(function(folder) {
					newFiles = newFiles.concat(self._getFiles(joinPath(path), merge(clone(options), { dir: folder }), true));
				});
				
				files = newFiles;
			} else if(path.length > 1) {
				folders = files.filter(function(file) {
					return typeof(file) == 'object' && typeof(file.files) == 'object';
				});
				folders.forEach(function(folder) {
					newFiles = newFiles.concat(self._getFiles(joinPath(slicePath(path, 1)), merge(clone(options), { dir: folder }), true));
				});
				
				files = newFiles;
			}
			
			return files.unique();
		};
		
		// END HIDDEN
		
		/*Filesystem.prototype.file = function file(fileName, options) {
			options = options || {};
			
			var createMode = options.create || exports.NONE,
				tmpDir = ( typeof(options.dir) == 'string' ? this.folder(options.dir) : options.dir ) || this.currentDir,
				type = options.type || exports.BOTH,
				symlinkMode = options.resolveSymlink || exports.ALL,
				pathArr, self;
			
			if(!fileName || fileName.length == 0) return tmpDir;
			if(fileName.length > 0 && fileName[0] == '/') tmpDir = this.data.root;
			
			self = this
			pathArr = fileName.split(/(^|\\\\|[^\\])\//);
		
			pathArr.forEach(function(part, index) {
				if(part) {
					if(part == '..') {
						tmpDir = tmpDir.parent || tmpDir;
					} else if(part == '.') {
						return;
					} else {
						if(self.isDir(tmpDir)) {
							if(self.hasFile(tmpDir, part)) {
								tmpDir = tmpDir.files[part];
							} else if(createMode === exports.ALL || ( createMode === exports.FINAL && i === pathArr.length - 1 )) {
								tmpDir = self.createFile(part, tmpDir);
								
								if(i === pathArr.length - 1) {
									if(typeof(options.symlink) == 'string') {
										tmpDir.symlink = options.symlink;
									} else {
										if(type === exports.FILE) {
											tmpDir.contents = '';
										} else if(type === exports.FOLDER) {
											tmpDir.files = {};
										}
									}
								} else {
									tmpDir.files = {};
								}
							}
						} else {
							return false;
						}
						
						if(symlinkMode === exports.ALl ||
							(symlinkMode === exports.BEGIN && i === 0) ||
							(symlinkMode === exports.FINAL && i === pathArr.length - 1)) {
							
							tmpDir = self.getSymlink(tmpDir, tmpDir.parent);
						}
					}
				}
			});
			
			if(type == exports.FOLDER && !this.isDir(tmpDir)) tmpDir = undefined;
			if(type == exports.FILE && this.isDir(tmpDir)) tmpDir = undefined;
		
			return tmpDir;
		};*/
		
		Filesystem.prototype.file = function file(fileName, options) {
			options = merge({
				resolveSymlinks: exports.ALL,
				wildcards: true
			}, options || {});
			
			var files = this._getFiles(fileName, options);
			
			if(options.create === exports.ALL || options.create === exports.FINAl || !!options.create) {
				files.forEach(function(file) {
					if(typeof(file.files) === 'undefined' && typeof(file.contents) === 'undefined' && typeof(file.symlink) === 'undefined') {
						if(options.type === exports.FOLDER) file.files = {};
						else if(options.type === exports.FILE) file.contents = '';
						else if(typeof(options.symlink) == 'string') file.symlink = options.symlink;
					}
				});
			} else if(options.type === exports.FILE || options.type === exports.FOLDER) {
				files = files.filter(function(file) {
					if(!file) return false;
					
					if(options.type === exports.FILE) return typeof(file.contents) !== 'undefined';
					else if(options.type === exports.FOLDER) return typeof(file.files) === 'object';
					else if(options.symlink) return typeof(file.symlink) === 'string';
				});
			}
			
			if(options.multiple) return files;
			
			return files[0];
		};
		
		Filesystem.prototype.files = function files(fileName, options) {
			return this.file(fileName, merge(clone(options), {
				multiple: true
			}));
		};
		
		Filesystem.prototype.folder = function folder(folderName, options) {
			return this.file(folderName, merge(clone(options), {
				type: exports.FOLDER
			}));
		};
		
		Filesystem.prototype.folders = function folders(folderName, options) {
			return this.folder(folderName, merge(clone(options), {
				multiple: true
			}));
		};
		
		// End easier API
		
		return Filesystem;
	})();
	
	// New easier API
	
	exports.ALL    = 'all';
	exports.BEGIN  = 'begin';
	exports.BOTH   = 'both';
	exports.FINAL  = 'final';
	exports.FILE   = 'file';
	exports.FOLDER = 'folder';
	exports.NONE   = 'none';
	
	// End easier API

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
