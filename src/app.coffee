# Require
CreateSend = require('createsend-node')
Analytics = require('analytics-node')
semver = require('semver')

# Config
SEGMENT_SECRET = process.env.SEGMENT_SECRET or null
CM_API_KEY = process.env.CM_API_KEY or null
CM_LIST_ID = process.env.CM_LIST_ID or null
codeRedirectPermanent = 301
codeRedirectTemporary = 302

# Check
throw new Error('CM_API_KEY is undefined')	unless CM_API_KEY
throw new Error('CM_LIST_ID is undefined')	unless CM_LIST_ID
throw new Error('SEGMENT_SECRET is undefined')	unless SEGMENT_SECRET

# Initialise libraries
analytics = new Analytics(SEGMENT_SECRET)
createSend = new CreateSend(apiKey: CM_API_KEY)

# Config
spamUsers = [
	'Lonkly'
	'55c7a10d69feeae52b991ba69e820c29aa1da960'
	'ef87bc3cbb56a7d48e8a5024f9f33706b8146591'
	'c0f96be80fa06706ad261a7d932cfd188041aae3'
	'cabe082142f897bbe8958664951a84c57143ab63'
	'1a1dfaed48032a8f11dd73bf9a34fd9f20fcb13e'
	'4db16634288144bad2d154323ba966980254b07f'
]

# Create our middleware
module.exports = require('helper-service').start({
	middleware: (req, res, next) ->
		# Prepare
		ipAddress = req.headers['X-Forwarded-For'] or req.connection.remoteAddress
		{logger, sendResponse, sendError, sendSuccess} = req

		# Log a possible error
		logError = (err) ->
			if err
				logger.log('err', err.stack or err.message or err)
			return

		# Log
		logger.log('info', 'received request:', req.url, req.query, req.body)

		# Alias http://helper.docpad.org/exchange.blah?version=6.32.0 to http://helper.docpad.org/?method=exchange&version=6.32.0
		if req.url.indexOf('exchange') isnt -1
			req.query.method ?= 'exchange'

		# Alias http://helper.docpad.org/latest.json to http://helper.docpad.org/?method=latest
		else if req.url.indexOf('latest') isnt -1
			req.query.method ?= 'latest'

		# Method Request
		if req.query.method
			# Add Subscriber
			switch req.query.method
				# Exchange
				when 'exchange'
					version = (req.query.version or '')
					if semver.satisfies(version, '5')
						if semver.satisfies(version, '5.3')
							branch = 'docpad-5.3.x'
							extension = 'json'
						else
							branch = 'docpad-5.x'
							extension = 'json'
					else if semver.satisfies(version, '6')
						if semver.satisfies(version, '<6.73.6')
							branch = '4c4605558e551be8dc35775e48424ecb06f625fd'
							extension = 'json'
						else
							branch = 'docpad-6.x'
							extension = 'cson'
					else
						return sendError('Unknown DocPad version', {version})

					url = "https://raw.githubusercontent.com/bevry/docpad-extras/#{branch}/exchange.#{extension}"
					res.writeHead(codeRedirectPermanent, {'Location':url})
					res.end()

				# Latest
				when 'latest'
					url = "https://raw.githubusercontent.com/bevry/docpad/master/package.json"
					res.writeHead(codeRedirectPermanent, {'Location':url})
					res.end()

				# Ping
				when 'ping'
					return sendSuccess()

				# Create the subscriber
				when 'add-subscriber'
					# Prepare data
					subscriberData =
						EmailAddress: req.query.email or req.body.email
						Name: req.query.name or req.body.name or null
						Resubscribe: true
						CustomFields: [
							Key: 'username'
							Value: req.query.username or req.body.username or null
						]

					# Subscribe to the list
					createSend.subscribers.addSubscriber CM_LIST_ID, subscriberData, (err, subscriber) ->
						# Error
						email = subscriber?.emailAddress or null
						return sendError(err.message, {email})  if err

						# Send response back to client
						return sendSuccess({email})

				# Analytics
				when 'analytics'
					# Check body
					return sendError('missing body', req.body)  if Object.keys(req.body).length is 0

					# No user
					unless req.body.userId
						req.body.userId = 'undefined'
						logger.log('warn', 'no user on track:', req.url, req.query, req.body)

					# Check user
					else if req.body.userId in spamUsers
						return sendError('spam user')

					# Adjust params
					req.body.context or= {}
					req.body.context.ip or= ipAddress

					# Action
					switch req.query.action
						when 'identify'
							analytics.identify(req.body, logError)
						when 'track'
							analytics.track(req.body, logError)
						else
							return sendError('unknown action')

					# Send response back to client
					return sendSuccess()

				# Unknown method, continue
				else
					return next()

		# Unknown Request
		else
			return sendError('unknown request')
})
