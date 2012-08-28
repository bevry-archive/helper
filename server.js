// Require
var url, http, request;
url = require('url');
http = require('http');
createsend = require('createsend');

// Don't crash when an error occurs, instead log it
process.on('uncaughtException', function(err){
	console.log(err);
});

// Config
var CM_API_KEY, CM_LIST_ID;
CM_API_KEY = process.env.CM_API_KEY || null;
CM_LIST_ID = process.env.CM_LIST_ID || null;

// Check
if (!CM_API_KEY)  throw new Error('CM_API_KEY is undefined');
if (!CM_LIST_ID)  throw new Error('CM_LIST_ID is undefined');

// Helpers
var cmApi, sendResponse;
cmApi = new createsend(CM_API_KEY);
sendResponse = function(code,data,jsonpCallback,res){
	// Prepare
	var str;

	// Send code
	res.writeHead(code);

	// Send response
	if (jsonpCallback) {
		str = jsonpCallback+'('+JSON.stringify(data)+')';
	} else {
		str = JSON.stringify(data);
	}
	res.write(str);

	// Log
	console.log('Sending response:', str);

	// Flush
	res.end();
};

// Create our server
var server;
server = http.createServer(function(req,res){
	// Prepare
	var responseCode, responseData;

	// Set CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
	if ( req.method === 'OPTIONS' ) {
		res.writeHead(200);
		res.end();
		return;
	}

	// Get the params
	var query, jsonpCallback;
	query = url.parse(req.url,true).query;
	jsonpCallback = query.callback;

	// Log
	console.log('Received request:', req.url);

	// Check for correct params
	if ( !query.method ) {
		// Send error
		responseCode = 400; // bad request
		responseData = {success:false,error:'missing method'};
		sendResponse(responseCode,responseData,jsonpCallback,res);

		// Done
		return;
	}

	// Add Subscriber
	if ( query.method === 'add-subscriber' ) {
		// Create the subscriber
		var subscriberData;
		subscriberData = {
			EmailAddress: query.email,
			Name: query.name,
			Resubscribe: true,
			CustomFields: [
				{
					Key: "username",
					Value: query.username
				}
			]
		};

		// Subscribe to the list
		cmApi.subscriberAdd(CM_LIST_ID, subscriberData, function(err,email){
			// Prepare response
			var responseCode, responseData;
			if (err) {
				console.log(err);
				responseCode = 400; // bad request
				responseData = {success:false,error:err.message,email:email};
			}
			else {
				responseCode = 200; // okay
				responseData = {success:true,email:email};
			}

			// Send response back to client
			sendResponse(responseCode,responseData,jsonpCallback,res);
		});

		// Done
		return;
	}

	// Unknown Method
	else {
		// Send error
		responseCode = 400; // bad request
		responseData = {success:false,error:'unknown method'};
		sendResponse(responseCode,responseData,jsonpCallback,res);

		// Done
		return;
	}

});

// Start our server
server.listen(process.env.PORT || 8000, function() {
	var address = server.address();
	console.log("opened server on %j", address);
});

// Export
module.exports = server;