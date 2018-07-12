'use strict'

// Imports
const PluginClerk = require('pluginclerk')
const semver = require('semver')
const env = require('../env')

// Prepare
const HTTP_REDIRECT_PERMANENT = 301
// const HTTP_REDIRECT_TEMPORARY = 302

// Init
function initDocPad () {
	const { state, log } = this

	// clerk
	log('info', 'init docpad plugin clerk')
	state.docpad.pluginClerk = new PluginClerk({
		log,
		keyword: 'docpad-plugin',
		prefix: 'docpad-plugin-'
	})

	// ready
	state.docpad.ready = true
	this.emit('docpad-ready')
}

// Middleware
function middleware (req, res, next) {
	// Prepare
	const { state } = this
	const log = res.log
	const ipAddress = req.headers['X-Forwarded-For'] || req.connection.remoteAddress

	// Waiting
	if (state.docpad.ready === false) {
		log('info', 'docpad: waiting for ready for request:', req.url, req.query, req.body)
		this.on('docpad-ready', () => middleware.call(this, req, res, next))
		return
	}

	// Log
	log('info', 'docpad: processing request:', req.url, req.query, req.body)

	// Alias http://helper.docpad.org/exchange.blah?version=6.32.0 to http://helper.docpad.org/?method=exchange&version=6.32.0
	if (req.url.indexOf('exchange') !== -1) {
		req.query.method = req.query.method || 'exchange'
	}

	// Alias http://helper.docpad.org/latest.json to http://helper.docpad.org/?method=latest
	else if (req.url.indexOf('latest') !== -1) {
		req.query.method = req.query.method || 'latest'
	}

	// Method Request
	if (req.query.method) {
		let clerkOptions, url, branch, extension, version

		// Add Subscriber
		switch (req.query.method) {
			// Exchange
			case 'skeletons':
			case 'exchange':
				extension = 'json'
				version = req.query.version || ''
				if (semver.satisfies(version, '5')) {
					if (semver.satisfies(version, '5.3')) {
						branch = 'docpad-5.3.x'
					}
					else {
						branch = 'docpad-5.x'
					}
				}
				else if (semver.satisfies(version, '6')) {
					if (semver.satisfies(version, '<6.73.6')) {
						branch = '4c4605558e551be8dc35775e48424ecb06f625fd'
					}
					else {
						branch = 'docpad-6.x'
					}
				}
				else {
					return res.sendError(new Error('unknown DocPad version'), { version })
				}

				url = `http://raw.githubusercontent.com/bevry/docpad-extras/${branch}/exchange.${extension}`
				log('debug', `Redirecting skeletons for ${req.query.version} to ${url}`)
				res.writeHead(HTTP_REDIRECT_PERMANENT, { Location: url })
				res.end()
				break

			// Plugin
			case 'plugin':
				clerkOptions = {
					name: req.body.name || req.query.name,
					dependencies: req.body.dependencies
				}

				// Ready
				log('debug', 'fetching docpad plugin...')
				state.docpad.pluginClerk.fetchPlugin(clerkOptions)
					.catch((err) => res.sendError(err, clerkOptions))
					.then(function (result) {
						log('debug', 'fetched docpad plugin')
						res.sendSuccess(result)
					})
				break

			// Plugins
			case 'plugins':
				clerkOptions = {
					dependencies: req.body.dependencies
				}

				// Ready
				log('debug', 'fetching docpad plugins...')
				state.docpad.pluginClerk.fetchPlugins(clerkOptions)
					.catch((err) => res.sendError(err, clerkOptions))
					.then(function (result) {
						log('debug', 'fetched docpad plugins')
						res.sendSuccess(result)
					})
				break

			// Latest
			case 'latest':
				url = 'http://raw.githubusercontent.com/bevry/docpad/master/package.json'
				res.writeHead(HTTP_REDIRECT_PERMANENT, { Location: url })
				res.end()
				break

			// Ping
			case 'ping':
				res.sendSuccess()
				break

			default:
				// Forward onto the next helper
				next()
				break
		}
	}

	// No method
	else {
		// Forward onto the next helper
		next()
	}
}

// Register
module.exports = function () {
	this.state.docpad = {
		ready: false
	}
	this.on('init', initDocPad)
	this.on('register-middleware', ({ middlewares }) => {
		middlewares.push(middleware.bind(this))
	})
}
