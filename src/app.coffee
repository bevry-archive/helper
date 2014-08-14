# Require
CreateSend = require('createsend-node')
Analytics = require('analytics-node')

# Config
SEGMENT_SECRET = process.env.SEGMENT_SECRET or null
CM_API_KEY = process.env.CM_API_KEY or null
CM_LIST_ID = process.env.CM_LIST_ID or null

# Check
throw new Error('CM_API_KEY is undefined')	unless CM_API_KEY
throw new Error('CM_LIST_ID is undefined')	unless CM_LIST_ID
throw new Error('SEGMENT_SECRET is undefined')	unless SEGMENT_SECRET

# Initialise libraries
analytics = new Analytics(SEGMENT_SECRET)
createSend = new CreateSend(apiKey: CM_API_KEY)

# Config
spamUsers = [
	'55c7a10d69feeae52b991ba69e820c29aa1da960'
	'ef87bc3cbb56a7d48e8a5024f9f33706b8146591'
]

# Create our middleware
module.exports = require('helper-service').start({
	middleware: (req, res, next) ->
		# Prepare
		ipAddress = req.headers['X-Forwarded-For'] or req.connection.remoteAddress
		{logger, sendResponse, sendError, sendSuccess} = req

		# Log
		logger.log('info', 'received request:', req.url, req.query, req.body)

		# Check for correct params
		return sendError('missing method')  unless req.query.method

		# Add Subscriber
		switch req.query.method
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
})