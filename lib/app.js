"use strict"

// Require
const CreateSend = require('createsend-node')
const Analytics = require('analytics-node')
const semver = require('semver')

// Config
const SEGMENT_SECRET = process.env.SEGMENT_SECRET || null
const CM_API_KEY = process.env.CM_API_KEY || null
const CM_LIST_ID = process.env.CM_LIST_ID || null
const codeRedirectPermanent = 301
const codeRedirectTemporary = 302

// Check
if ( !CM_API_KEY )  throw new Error('CM_API_KEY is undefined')
if ( !CM_LIST_ID )  throw new Error('CM_LIST_ID is undefined')
if ( !SEGMENT_SECRET )  throw new Error('SEGMENT_SECRET is undefined')

// Initialise libraries
const analytics = new Analytics(SEGMENT_SECRET)
const createSend = new CreateSend({apiKey: CM_API_KEY})

// Config
const spamUsers = [
	'Lonkly',
	'55c7a10d69feeae52b991ba69e820c29aa1da960',
	'ef87bc3cbb56a7d48e8a5024f9f33706b8146591',
	'c0f96be80fa06706ad261a7d932cfd188041aae3',
	'cabe082142f897bbe8958664951a84c57143ab63',
	'1a1dfaed48032a8f11dd73bf9a34fd9f20fcb13e',
	'4db16634288144bad2d154323ba966980254b07f'
]

// Create our middleware
module.exports = require('helper-service').start({
	middleware: function (req, res, next) {
		// Prepare
		const ipAddress = req.headers['X-Forwarded-For'] || req.connection.remoteAddress
		const logger = req.logger
		const sendResponse = req.sendResponse
		const sendError = req.sendError
		const sendSuccess = req.sendSuccess

		// Log a possible error
		logError = function (err) {
			if ( err )  logger.log('err', err.stack || err.message || err)
			return
		}

		// Log
		logger.log('info', 'received request:', req.url, req.query, req.body)

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
			let branch, extension, url, version, subscriberData
			// Add Subscriber
			switch ( req.query.method ) {
				// Exchange
				case 'exchange':
					version = (req.query.version || '')
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

					url = `https://raw.githubusercontent.com/bevry/docpad-extras///${branch}/exchange.//${extension}`
					res.writeHead(codeRedirectPermanent, {'Location': url})
					res.end()
					break

				// Latest
				case 'latest':
					url = "https://raw.githubusercontent.com/bevry/docpad/master/package.json"
					res.writeHead(codeRedirectPermanent, {'Location': url})
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
					createSend.subscribers.addSubscriber(CM_LIST_ID, subscriberData, function (err, subscriber) {
						// Error
						email = (subscriber && subscriber.emailAddress) || null
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
						logger.log('warn', 'no user on track:', req.url, req.query, req.body)
					}

					// Check user
					else if ( spamUsers.indexOf(req.body.userId) !== -1 ) {
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
					return next()
			}
		}

		// Unknown Request
		else {
			return sendError('unknown request')
		}
	}
})
