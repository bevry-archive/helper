/* eslint no-console:0 */
'use strict'

// Import
const extendr = require('extendr')
const urlUtil = require('url')

// App
module.exports = class Server {
	// log
	// connect
	// server

	static create (...args) {
		return new this(...args)
	}

	constructor (opts) {
		if ( !opts.log )  throw new Error('No log option was passed to the server constructor')
		this.log = opts.log
	}

	start (opts, next) {
		// Prepare
		const _opts = require('extract-opts')(opts, next)
		opts = _opts[0]
		next = _opts[1]

		// Initialise libraries
		const connect = require('connect')()
		this.connect = connect

		// Server Options
		const hostenv = require('hostenv')
		opts.port = opts.port || hostenv.PORT || 8000
		opts.hostname = opts.hostname || hostenv.HOSTNAME || '0.0.0.0'
		opts.limit = opts.limit || '200kb'

		// Create our server
		connect.use(this.corsMiddleware)
		connect.use(require('body-parser').json({limit: opts.limit}))
		connect.use((req, res, complete) => {
			req.query = req.query || urlUtil.parse(req.url, true).query
			res.sendResponse = res.sendResponse || this.sendResponse.bind(this, req, res)
			res.sendError = res.sendError || this.sendError.bind(this, req, res)
			res.sendSuccess = res.sendSuccess || this.sendSuccess.bind(this, req, res)
			res.log = res.log || this.log
			complete()
		})

		// Add middlewares
		if ( opts.middleware ) {
			connect.use(opts.middleware)
		}
		if ( Array.isArray(opts.middlewares) ) {
			opts.middlewares.forEach(function (middleware) {
				connect.use(function (req, res, next) {
					try {
						middleware.call(this, req, res, next)
					}
					catch ( err ) {
						res.sendError(err)
					}
				})
			})
		}

		// 404
		connect.use(function (req, res) {
			res.sendError('404 Not Found', null, 404)
		})

		// Start our server
		const server = connect.listen(opts.port, opts.hostname, () => {
			this.log('info', 'Opened server on', opts.port, opts.hostname)
			if ( next )  return next(null, connect, server)
		})
		this.server = server

		// Chain
		return this
	}

	destroy (opts, next) {
		this.server.close(next)
		return this
	}

	// Send Response Helper
	sendResponse (req, res, data, code) {
		// Prepare
		code = code || 200

		// Send code
		res.writeHead(code, {
			'Content-Type': 'application/json'
		})

		// Prepare response
		const str =
			req.query.callback
			? `${req.query.callback}(${JSON.stringify(data)})`
			: JSON.stringify(data)

		// Log
		const level = code === 200 ? 'info' : 'warning'
		this.log(level, `${code} response:`, str)

		// Flush
		res.write(str)
		res.end()
	}

	// Send Error Helper
	sendError (req, res, err, data, code) {
		// Prepare
		code = code || 400

		// Prepare error
		const responseData = extendr.extend({
			success: false,
			error: err.message || err
		}, data || {})

		// Send error
		this.log('warn', 'error details:', err.stack)
		return res.sendResponse(responseData, code)
	}

	// Send Success Helper
	sendSuccess (req, res, data, code) {
		// Prepare
		code = code || 200

		// Prepare error
		const responseData = extendr.extend({
			success: true
		}, data || {})

		// Send response
		return res.sendResponse(responseData, code)
	}

	// CORS Middleware
	corsMiddleware (req, res, next) {
		// CORS
		res.setHeader('Access-Control-Allow-Origin', '*')
		res.setHeader('Access-Control-Request-Method', '*')
		res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET')
		res.setHeader('Access-Control-Allow-Headers', '*')
		if ( req.method === 'OPTIONS' ) {
			res.writeHead(200)
			res.end()
		}
		else {
			next()
		}
	}
}
