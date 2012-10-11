# Require
url = require("url")
http = require("http")
createsend = require("createsend")

# Don't crash when an error occurs, instead log it
process.on "uncaughtException", (err) ->
	console.log(err)

# Config
CM_API_KEY = undefined
CM_LIST_ID = undefined
CM_API_KEY = process.env.CM_API_KEY or null
CM_LIST_ID = process.env.CM_LIST_ID or null

# Check
throw new Error("CM_API_KEY is undefined")	unless CM_API_KEY
throw new Error("CM_LIST_ID is undefined")	unless CM_LIST_ID

# Helpers
cmApi = undefined
sendResponse = undefined
cmApi = new createsend(CM_API_KEY)
sendResponse = (code, data, jsonpCallback, res) ->

	# Prepare
	str = undefined

	# Send code
	res.writeHead code

	# Send response
	if jsonpCallback
		str = jsonpCallback + "(" + JSON.stringify(data) + ")"
	else
		str = JSON.stringify(data)
	res.write str

	# Log
	console.log "Sending response:", str

	# Flush
	res.end()


# Create our server
server = undefined
server = http.createServer((req, res) ->

	# Prepare
	responseCode = undefined
	responseData = undefined

	# Set CORS headers
	res.setHeader "Access-Control-Allow-Origin", "*"
	res.setHeader "Access-Control-Request-Method", "*"
	res.setHeader "Access-Control-Allow-Methods", "OPTIONS, GET"
	res.setHeader "Access-Control-Allow-Headers", "*"
	if req.method is "OPTIONS"
		res.writeHead 200
		res.end()
		return

	# Get the params
	query = undefined
	jsonpCallback = undefined
	query = url.parse(req.url, true).query
	jsonpCallback = query.callback

	# Log
	console.log "Received request:", req.url

	# Check for correct params
	unless query.method

		# Send error
		responseCode = 400 # bad request
		responseData =
			success: false
			error: "missing method"

		sendResponse responseCode, responseData, jsonpCallback, res

		# Done
		return

	# Add Subscriber
	if query.method is "add-subscriber"

		# Create the subscriber
		subscriberData = undefined
		subscriberData =
			EmailAddress: query.email
			Name: query.name
			Resubscribe: true
			CustomFields: [
				Key: "username"
				Value: query.username
			]


		# Subscribe to the list
		cmApi.subscriberAdd CM_LIST_ID, subscriberData, (err, email) ->

			# Prepare response
			responseCode = undefined
			responseData = undefined
			if err
				console.log err
				responseCode = 400 # bad request
				responseData =
					success: false
					error: err.message
					email: email
			else
				responseCode = 200 # okay
				responseData =
					success: true
					email: email

			# Send response back to client
			sendResponse responseCode, responseData, jsonpCallback, res


		# Done
		return

	# Unknown Method
	else

		# Send error
		responseCode = 400 # bad request
		responseData =
			success: false
			error: "unknown method"

		sendResponse responseCode, responseData, jsonpCallback, res

		# Done
		return
)

# Start our server
server.listen process.env.PORT or 8000, ->
	address = server.address()
	console.log "opened server on %j", address


# Export
module.exports = server