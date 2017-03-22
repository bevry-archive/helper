'use strict'

// Imports
const Analytics = require('analytics-node')
const PluginClerk = require('pluginclerk')
const semver = require('semver')
const env = require('../env')

// Prepare
const HTTP_REDIRECT_PERMANENT = 301
// const HTTP_REDIRECT_TEMPORARY = 302

// Init
function initDocPad () {
	const {state, log} = this

	// analytics
	log('info', 'init docpad analytics')
	state.docpad.analytics = new Analytics(env.docpad.segmentKey)

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
	const {state} = this
	const log = res.log
	const ipAddress = req.headers['X-Forwarded-For'] || req.connection.remoteAddress

	// Waiting
	if ( state.docpad.ready === false ) {
		log('info', 'docpad: waiting for ready for request:', req.url, req.query, req.body)
		this.on('docpad-ready', () => middleware.call(this, req, res, next))
		return
	}

	// Log
	log('info', 'docpad: processing request:', req.url, req.query, req.body)

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
						extension = 'json'
					}
				}
				else {
					return res.sendError(new Error('unknown DocPad version'), {version})
				}

				url = `http://raw.githubusercontent.com/bevry/docpad-extras/${branch}/exchange.${extension}`
				log('debug', `Redirecting skeletons for ${req.query.version} to ${url}`)
				res.writeHead(HTTP_REDIRECT_PERMANENT, {Location: url})
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
				state.docpad.pluginClerk.fetchPlugin(clerkOptions, function (err, result) {
					log('debug', 'fetched docpad plugin')
					if ( err )  return res.sendError(err, clerkOptions)
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
				state.docpad.pluginClerk.fetchPlugins(clerkOptions, function (err, result) {
					log('debug', 'fetched docpad plugins')
					if ( err )  return res.sendError(err, clerkOptions)
					res.sendSuccess(result)
				})
				break

			// Latest
			case 'latest':
				url = 'http://raw.githubusercontent.com/bevry/docpad/master/package.json'
				res.writeHead(HTTP_REDIRECT_PERMANENT, {Location: url})
				res.end()
				break

			// Ping
			case 'ping':
				res.sendSuccess()
				break

			// Create the subscriber
			case 'add-subscriber': {
				const person = state.bevry.Person.ensure({
					email: req.query.email || req.body.email,
					profileName: req.query.name || req.body.name || null,
					docpadUser: true
					// username: req.query.username || req.body.username || null
				})
				const opts = {
					campaignMonitorListId: env.docpad.campaignMonitorListId
				}

				// Ready
				person.subscribe(opts, function (err) {
					if ( err )  return res.sendError(err.message, {email: person.email})
					person.save({}, function (err) {
						if ( err )  return res.sendError(err.message, {email: person.email})
						return res.sendSuccess({email: person.email})
					})
				})
				break
			}

			// Analytics
			case 'analytics':
				// Check body
				if ( Object.keys(req.body).length === 0 ) {
					return res.sendError(new Error('missing body'), req.body)
				}

				// No user
				if ( !req.body.userId ) {
					req.body.userId = 'undefined'
					log('warn', 'docpad: no user on track:', req.url, req.query, req.body)
				}

				// Check user
				else if ( state.docpad.spamUsers.indexOf(req.body.userId) !== -1 ) {
					return res.sendError(new Error('spam user'))
				}

				// Adjust params
				req.body.context = req.body.context || {}
				req.body.context.ip = req.body.context.ip || ipAddress

				// Action
				switch ( req.query.action ) {
					case 'identify':
						// do this in the background, send success right away and thus log error instead of sending it
						state.docpad.analytics.identify(req.body, function (err) {
							if (err)  res.log('error', err)
						})
						break

					case 'track':
						// do this in the background, send success right away and thus log error instead of sending it
						state.docpad.analytics.track(req.body, function (err) {
							if (err)  res.log('error', err)
						})
						break

					default:
						return res.sendError(new Error('unknown action'))
				}

				// Send response back to client
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
		analytics: null,
		ready: false
	}
	this.on('init', initDocPad)
	this.on('register-middleware', ({middlewares}) => {
		middlewares.push(middleware.bind(this))
	})
}
