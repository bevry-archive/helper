'use strict'

// Imports
const Person = require('./person')
const semver = require('semver')
const env = require('./env')
const state = require('./state')

// Middleware
module.exports = function middleware (req, res, next) {
	// Prepare
	const log = res.log
	const ipAddress = req.headers['X-Forwarded-For'] || req.connection.remoteAddress
	const sendError = res.sendError
	const sendSuccess = res.sendSuccess
	// const sendResponse = res.sendResponse

	// Helpers
	function logError (err) {
		if ( err )  log('err', 'docpad:', err.stack || err.message || err)
	}

	// Log
	log('info', 'docpad: received request:', req.url, req.query, req.body)

	// Alias http://helper.docpad.org/exchange.blah?version=6.32.0 to http://helper.docpad.org/?method=exchange&version=6.32.0
	if ( req.url.indexOf('exchange') !== -1 ) {
		req.query.method = req.query.method || 'exchange'
	}

	// Alias http://helper.docpad.org/latest.json to http://helper.docpad.org/?method=latest
	else if ( req.url.indexOf('latest') !== -1 ) {
		req.query.method = req.query.method || 'latest'
	}

	// Method Request
	if ( req.query.method ) {
		let branch, extension, url, version, clerkOptions

		// Add Subscriber
		switch ( req.query.method ) {
			// Exchange
			case 'skeletons':
			case 'exchange':
				version = req.query.version || ''
				if ( semver.satisfies(version, '5') ) {
					if ( semver.satisfies(version, '5.3') ) {
						branch = 'docpad-5.3.x'
						extension = 'json'
					}
					else {
						branch = 'docpad-5.x'
						extension = 'json'
					}
				}
				else if ( semver.satisfies(version, '6') ) {
					if ( semver.satisfies(version, '<6.73.6') ) {
						branch = '4c4605558e551be8dc35775e48424ecb06f625fd'
						extension = 'json'
					}
					else {
						branch = 'docpad-6.x'
						extension = 'cson'
					}
				}
				else {
					return sendError('Unknown DocPad version', {version: version})
				}

				url = `http://raw.githubusercontent.com/bevry/docpad-extras/${branch}/exchange.${extension}`
				log('debug', `Redirecting skeletons for ${req.query.version} to ${url}`)
				res.writeHead(state.docpad.codeRedirectPermanent, {Location: url})
				res.end()
				break

			// Plugin
			case 'plugin':
				clerkOptions = {
					name: req.body.name || req.query.name,
					dependencies: req.body.dependencies
				}
				state.docpad.pluginClerk.fetchPlugin(clerkOptions, function (err, result) {
					if ( err )  return sendError(err, clerkOptions)
					res.sendSuccess(result)
				})
				break

			// Plugins
			case 'plugins':
				clerkOptions = {
					dependencies: req.body.dependencies
				}
				state.docpad.pluginClerk.fetchPlugins(clerkOptions, function (err, result) {
					if ( err )  return sendError(err, clerkOptions)
					res.sendSuccess(result)
				})
				break

			// Latest
			case 'latest':
				url = 'http://raw.githubusercontent.com/bevry/docpad/master/package.json'
				res.writeHead(state.docpad.codeRedirectPermanent, {Location: url})
				res.end()
				break

			// Ping
			case 'ping':
				return sendSuccess()

			// Create the subscriber
			case 'add-subscriber':
				const person = Person.ensure({
					email: req.query.email || req.body.email,
					profileName: req.query.name || req.body.name || null // ,
					// username: req.query.username || req.body.username || null
				})
				const opts = {
					campaignMonitorListId: env.docpad.campaignMonitorListId
				}
				person.subscribe(opts, function (err, result) {
					// Error
					const email = result || null
					if ( err )  return sendError(err.message, {email})

					// Send response back to client
					return sendSuccess({email})
				})
				break

			// Analytics
			case 'analytics':
				// Check body
				if ( Object.keys(req.body).length === 0 ) {
					return sendError('missing body', req.body)
				}

				// No user
				if ( !req.body.userId ) {
					req.body.userId = 'undefined'
					log('warn', 'docpad: no user on track:', req.url, req.query, req.body)
				}

				// Check user
				else if ( state.docpad.spamUsers.indexOf(req.body.userId) !== -1 ) {
					return sendError('spam user')
				}

				// Adjust params
				req.body.context = req.body.context || {}
				req.body.context.ip = req.body.context.ip || ipAddress

				// Action
				switch ( req.query.action ) {
					case 'identify':
						state.docpad.analytics.identify(req.body, logError)
						break

					case 'track':
						state.docpad.analytics.track(req.body, logError)
						break

					default:
						return sendError('unknown action')
				}

				// Send response back to client
				return sendSuccess()

			// Unknown method, continue
			default:
				return sendError('unknown method')
		}
	}

	// No method at all, so 404 by continuing with the helper
	else {
		return next()
	}
}
