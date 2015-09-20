// Import
const joe = require('joe')
const assert = require('assert-helpers')
const request = require('superagent')

// Task
joe.describe('startuphostel-helper', function (describe, it) {
	let serverURL, server

	it('should start the server', function (done) {
		server = require('../lib/server').create()
		const startupHostelMiddleware = require('../lib/startuphostel')({
			log: server.log.bind(server),
			env: {
				campaignMonitorKey: process.env.SH_CM_KEY,
				campaignMonitorListId: process.env.SH_CM_LIST_ID,
				googleSpreadsheetKey: process.env.SH_SPREADSHEET_KEY,
				googleSpreadsheetEmail: process.env.SH_SPREADSHEET_EMAIL,
				googleSpreadsheetPassword: process.env.SH_SPREADSHEET_PASSWORD,
				facebookGroupId: process.env.SH_FACEBOOK_GROUP_ID,
				facebookAccessToken: process.env.SH_FACEBOOK_ACCESS_TOKEN,
				apiKey: process.env.SH_API_KEY
			}
		})
		server.start({
			middleware: startupHostelMiddleware,
			next: function (error, app, _server) {
				if ( error )  return done(error)
				server = _server
				const address = server.address()
				serverURL = `http://${address.address}:${address.port}`
				done()
			}
		})
	})

	it('should send 404 correctly', function (done) {
		const url = `${serverURL}`
		request.get(url).end(function (error, res) {
			assert.equal(res.statusCode, 404, 'status code')
			assert.deepEqual(res.body, { success: false, error: '404 Not Found' }, 'body')
			done()
		})
	})

	it('should fetch the data correctly', function (done) {
		const url = `${serverURL}?method=startuphostel-data&key=${process.env.SH_API_KEY}`
		request.get(url).redirects(2).end(function (error, res) {
			assert.equal(res.statusCode, 200, 'status code')
			console.log(assert.inspect(res.body))
			assert.equal(res.body.users.length > 10, true, 'should have returned more than 10 users')
			done()
		})
	})

	it('should shutdown server correctly', function (done) {
		server.close(done)
	})

})
