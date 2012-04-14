define(function(require, exports, module) {
	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var events = require('./events');
	var EventEmitter = events.EventEmitter;
	
	var inherits = function(ctor, superCtor) {
	  ctor.super_ = superCtor;
	  ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
		  value: ctor,
		  enumerable: false,
		  writable: true,
		  configurable: true
		}
	  });
	};

	/*function Stream() {
	  events.EventEmitter.call(this);
	}
	inherits(Stream, events.EventEmitter);
	module.exports = Stream;
	// Backwards-compat with node 0.4.x
	Stream.Stream = Stream;

	Stream.prototype.pipe = function(dest, options) {
	  var source = this;

	  function ondata(chunk) {
		if (dest.writable) {
		  if (false === dest.write(chunk) && source.pause) {
		    source.pause();
		  }
		}
	  }

	  source.on('data', ondata);

	  function ondrain() {
		if (source.readable && source.resume) {
		  source.resume();
		}
	  }

	  dest.on('drain', ondrain);

	  // If the 'end' option is not supplied, dest.end() will be called when
	  // source gets the 'end' or 'close' events.  Only dest.end() once.
	  if (!dest._isStdio && (!options || options.end !== false)) {
		source.on('end', onend);
		source.on('close', onclose);
	  }

	  var didOnEnd = false;
	  function onend() {
		if (didOnEnd) return;
		didOnEnd = true;

		// remove the listeners
		cleanup();

		dest.end();
	  }


	  function onclose() {
		if (didOnEnd) return;
		didOnEnd = true;

		// remove the listeners
		cleanup();

		dest.destroy();
	  }

	  // don't leave dangling pipes when there are errors.
	  function onerror(er) {
		cleanup();
		if (this.listeners('error').length === 0) {
		  throw er; // Unhandled stream error in pipe.
		}
	  }

	  source.on('error', onerror);
	  dest.on('error', onerror);

	  // remove all the event listeners that were added.
	  function cleanup() {
		source.removeListener('data', ondata);
		dest.removeListener('drain', ondrain);

		source.removeListener('end', onend);
		source.removeListener('close', onclose);

		source.removeListener('error', onerror);
		dest.removeListener('error', onerror);

		source.removeListener('end', cleanup);
		source.removeListener('close', cleanup);

		dest.removeListener('end', cleanup);
		dest.removeListener('close', cleanup);
	  }

	  source.on('end', cleanup);
	  source.on('close', cleanup);

	  dest.on('end', cleanup);
	  dest.on('close', cleanup);

	  dest.emit('pipe', source);

	  // Allow for unix-like usage: A.pipe(B).pipe(C)
	  return dest;
	};*/
	
	// New implementation
	var Stream = module.exports.Stream = module.exports = (function() {
		function Stream(options) {
			EventEmitter.call(this);
			
			this.options = options || {};
			this.paused = !!this.options.paused || false;
		}
		inherits(Stream, EventEmitter);
		
		Stream.prototype.pipe = function pipe(dest) {
			var source = this;
			
			function onData(data) {
				dest.write(data);
			}
			
			source.on('data', onData);
			
			function onClose() {
				source.removeListener('data', onData);
				
				dest.removeListener('close', onClose);
				dest.removeListener('pause', onPause);
				dest.removeListener('unpause', onUnpause);
			}
			
			dest.on('close', onClose);
			
			function onUnpause() {
				source.unpause();
			}
			
			function onPause() {
				source.pause();
			}
			
			dest.on('unpause', onUnpause);
			dest.on('pause', onPause);
			
			return dest;
		};
		
		Stream.prototype.write = function write(data) {
			if(!this.paused) this.emit('data', data);
			
			return this;
		};
		
		Stream.prototype.unpause = function unpause() {
			this.paused = false;
			
			this.emit('unpause');
			
			return this;
		};
		
		Stream.prototype.pause = function pause() {
			this.paused = true;
			
			this.emit('pause');
			
			return this;
		};
		
		Stream.prototype.toglePause = function togglePause() {
			this.paused = !this.paused;
			
			this.emit(this.paused ? 'pause' : 'unpause');
			
			return this;
		};
		
		return Stream;
	})();
});
