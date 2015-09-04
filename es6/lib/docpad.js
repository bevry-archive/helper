export default function (opts) {
	'use strict'

	// Import
	const CreateSend = require('createsend-node')
	const Analytics = require('analytics-node')
	const PluginClerk = require('pluginclerk')
	const semver = require('semver')

	// Environment Variables
	const envData = opts.env
	const envKeys = [
		'campaignMonitorKey',
		'campaignMonitorListId',
		'segmentKey'
	]
	envKeys.forEach(function (key) {
		if ( !envData[key] ) {
			throw new Error(`docpad: Environment Variable [${key}] is undefined`)
		}
	})

	// Logger
	const log = opts.log

	// Prepare
	const appData = {
		codeRedirectPermanent: 301,
		codeRedirectTemporary: 302,
		spamUsers: [
			'Lonkly',
			'55c7a10d69feeae52b991ba69e820c29aa1da960',
			'ef87bc3cbb56a7d48e8a5024f9f33706b8146591',
			'c0f96be80fa06706ad261a7d932cfd188041aae3',
			'cabe082142f897bbe8958664951a84c57143ab63',
			'1a1dfaed48032a8f11dd73bf9a34fd9f20fcb13e',
			'4db16634288144bad2d154323ba966980254b07f'
		]
	}

	// Helpers
	function logError (err) {
		if ( err )  log('err', 'docpad:', err.stack || err.message || err)
	}

	// Initialise
	const analytics = new Analytics(envData.segmentKey)
	const createSend = new CreateSend({apiKey: envData.campaignMonitorKey})
	const pluginClerk = new PluginClerk({log: log, keyword: 'docpad-plugin', prefix: 'docpad-plugin-'})
	const result = {}


	// ===================================
	// Middleware

	// Create our middleware
	result.middleware = function (req, res, next) {
		// Prepare
		const ipAddress = req.headers['X-Forwarded-For'] || req.connection.remoteAddress
		const sendError = res.sendError
		const sendSuccess = res.sendSuccess
		// const sendResponse = res.sendResponse

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
			let branch, extension, url, version, subscriberData, clerkOptions

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
					res.writeHead(appData.codeRedirectPermanent, {Location: url})
					res.end()
					break

				// Plugin
				case 'plugin':
					clerkOptions = {
						name: req.body.name || req.query.name,
						dependencies: req.body.dependencies
					}
					pluginClerk.fetchPlugin(clerkOptions, function (err, result) {
						if ( err )  return sendError(err, clerkOptions)
						res.sendSuccess(result)
					})
					break

				// Plugins
				case 'plugins':
					clerkOptions = {
						dependencies: req.body.dependencies
					}
					pluginClerk.fetchPlugins(clerkOptions, function (err, result) {
						if ( err )  return sendError(err, clerkOptions)
						res.sendSuccess(result)
					})
					break

				// Latest
				case 'latest':
					url = 'http://raw.githubusercontent.com/bevry/docpad/master/package.json'
					res.writeHead(appData.codeRedirectPermanent, {Location: url})
					res.end()
					break

				// Ping
				case 'ping':
					return sendSuccess()

				// Create the subscriber
				case 'add-subscriber':
					// Prepare data
					subscriberData = {
						EmailAddress: req.query.email || req.body.email,
						Name: req.query.name || req.body.name || null,
						Resubscribe: true,
						CustomFields: [{
							Key: 'username',
							Value: req.query.username || req.body.username || null
						}]
					}

					// Subscribe to the list
					createSend.subscribers.addSubscriber(envData.campaignMonitorListId, subscriberData, function (err, subscriber) {
						// Error
						const email = subscriber && subscriber.emailAddress || null
						if ( err )  return sendError(err.message, {email: email})

						// Send response back to client
						return sendSuccess({email: email})
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
					else if ( appData.spamUsers.indexOf(req.body.userId) !== -1 ) {
						return sendError('spam user')
					}

					// Adjust params
					req.body.context = req.body.context || {}
					req.body.context.ip = req.body.context.ip || ipAddress

					// Action
					switch ( req.query.action ) {
						case 'identify':
							analytics.identify(req.body, logError)
							break

						case 'track':
							analytics.track(req.body, logError)
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

	// ===================================
	// Export

	return result
}
