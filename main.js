/**
 * @license
 * Copyright (C) 2016 Steven Berry (http://www.sberry.me/deferred-ap)
 * Licensed: MIT (http://opensource.org/licenses/mit-license.php)
 *
 * Steven Berry
 * www.sberry.me
 * steven@sberry.me
 */

(function(root, factory) {
	if (typeof module === 'object' && module && typeof module.exports === 'object') {
		module.exports = factory.call(root);
	}
	else if (typeof define === 'function' && define.amd) {
		define(function() {
			return factory.apply(root, arguments);
		});
	}
	else if (typeof root === 'object' && root && typeof root.document === 'object') {
		root.Deferred = factory.call(root);
	}
})(this, function() {
	function normalize(str) {
		return str
			.replace(/[\/]+/g, '/')
			.replace(/\/\?/g, '?')
			.replace(/\/\#/g, '#')
			.replace(/\:\//g, '://');
	}


	function join(arr) {
		var joined;

		if (Array.isArray(arr)) {
			joined = arr.join('/');
		}
		else {
			joined = Array.prototype.slice.call(arguments).join('/');
		}

		return normalize(joined);
	}


	function StaticExtension(path) {
		this.tags = ['static'];

		this.parse = function(parser, nodes) {
			var args, token;

			token = parser.nextToken();
			args = parser.parseSignature(null, true);

			parser.advanceAfterBlockEnd(token.value);

			return new nodes.CallExtension(this, 'run', args);
		};

		this.run = function(context, file) {
			if (arguments.length > 2) {
				throw new Error('The static tag only accepts one path argument');
			}

			if (file == null) {
				file = '';
			}

			return join(path, file);
		};
	}

	StaticExtension.install = function(env, path) {
		env.addExtension('StaticExtension', new StaticExtension(path));
	};


	function configure(directory, options) {
		var i, path;

		if (typeof directory === 'object' && options == null) {
			options = directory;
			directory = 'static';
		}

		if (!options.nunjucks) {
			throw new Error('Invalid options: nunjucks environment must be specified.');
		}

		if (options.path == null) {
			throw new Error('Invalid options: static files path must be specified.');
		}

		if (directory == null) {
			directory = 'static';
		}

		path = String(options.path);

		if (!/^[a-z]+:\/\//i.test(path) && typeof options.express === 'function') {
			if (Array.isArray(directory)) {
				for (i = 0; i < directory.length; i++) {
					options.express.use(path, options.staticMiddleware(String(directory[i])));
				}
			}
			else {
				options.express.use(path, options.staticMiddleware(String(directory)));
			}
		}

		StaticExtension.install(options.nunjucks, path);
	}


	return {
		Extension: StaticExtension,

		configure: configure
	};
});
