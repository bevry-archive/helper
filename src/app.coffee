# Require
createsend = require('createsend')
analytics = require('analytics-node')
extendr = require('extendr')
connect = require('connect')

# Logging
logger = new (require('caterpillar').Logger)()
human  = new (require('caterpillar-human').Human)()
logger.pipe(human).pipe(process.stdout)

# Don't crash when an error occurs, instead log it
analytics.on 'error', (err) ->
	logger.log('err', err.message)
process.on 'uncaughtException', (err) ->
	logger.log('err', err.message)

# Config
SEGMENT_SECRET = process.env.SEGMENT_SECRET or null
CM_API_KEY = process.env.CM_API_KEY or null
CM_LIST_ID = process.env.CM_LIST_ID or null
PORT = process.env.PORT or 8000

# Check
throw new Error('CM_API_KEY is undefined')	unless CM_API_KEY
throw new Error('CM_LIST_ID is undefined')	unless CM_LIST_ID
throw new Error('SEGMENT_SECRET is undefined')	unless SEGMENT_SECRET

# Initialise libraries
analytics.init({secret:SEGMENT_SECRET})
cmApi = new createsend(CM_API_KEY)
app = connect()

# Create our server
app.use connect.limit('200kb')
app.use connect.timeout()
app.use connect.compress()
app.use connect.query()
app.use connect.json()
app.use (req,res) ->
	# Prepare
	ipAddress = req.headers['X-Forwarded-For'] or req.connection.remoteAddress

	# CORS
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Request-Method', '*')
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET')
	res.setHeader('Access-Control-Allow-Headers', '*')
	if req.method is 'OPTIONS'
		res.writeHead(200)
		res.end()
		return

	# Send Response Helper
	sendResponse = (data,code=200) ->
		# Prepare
		str = null

		# Send code
		res.writeHead(code, {
			'Content-Type': 'application/json'
		})

		# Prepare response
		if req.query.callback
			str = req.query.callback + '(' + JSON.stringify(data) + ')'
		else
			str = JSON.stringify(data)

		# Log
		level = if code is 200 then 'info' else 'warning'
		logger.log(level, "#{code} response:", str)

		# Flush
		res.write(str)
		res.end()

	# Send Error Helper
	sendError = (message,data={},code=400) ->
		# Prepare error
		responseData = extendr.extend({
			success: false
			error: message
		},data)

		# Send error
		return sendResponse(responseData, code)

	# Send Success Helper
	sendSuccess = (data={},code=200) ->
		# Prepare error
		responseData = extendr.extend({
			success: true
		},data)

		# Send response
		return sendResponse(responseData, code)

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
				Name: req.query.name or req.body.name
				Resubscribe: true
				CustomFields: [
					Key: 'username'
					Value: req.query.username or req.body.username
				]

			# Subscribe to the list
			cmApi.subscriberAdd CM_LIST_ID, subscriberData, (err, email) ->
				# Error
				return sendError(err.message, {email})  if err

				# Send response back to client
				return sendSuccess({email})

		# Analytics
		when 'analytics'
			# Check body
			return sendError('missing body', req.body)  if Object.keys(req.body).length is 0

			# Check user
			if req.body.userId in ['55c7a10d69feeae52b991ba69e820c29aa1da960']
				return sendError('spam user')

			# Adjust params
			req.body.context or= {}
			req.body.context.ip or= ipAddress

			# Action
			switch req.query.action
				when 'identify'
					analytics.identify(req.body)
				when 'track'
					analytics.track(req.body)
				else
					return sendError('unknown action')

			# Send response back to client
			return sendSuccess()

		# Unknown method
		else
			return sendError('unknown method')


# Start our server
app.listen PORT, ->
	logger.log('info', 'opened server on', PORT)

# Export
module.exports = app