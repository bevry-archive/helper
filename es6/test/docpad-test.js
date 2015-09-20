// Import
const joe = require('joe')
const assert = require('assert-helpers')
const request = require('superagent')

// Task
joe.describe('docpad-helper', function (describe, it) {
	let serverURL, server
	it('should start the server', function (done) {
		server = require('../lib/server').create()
		const docpadMiddleware = require('../lib/docpad')({
			log: server.log.bind(server),
			env: {
				campaignMonitorKey: process.env.DP_CM_KEY,
				campaignMonitorListId: process.env.DP_CM_LIST_ID,
				segmentKey: process.env.DP_SEGMENT_KEY
			}
		})
		server.start({
			middleware: docpadMiddleware,
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

	it('should fetch ping correctly', function (done) {
		const url = `${serverURL}?method=ping`
		request.get(url).redirects(2).end(function (error, res) {
			assert.equal(res.statusCode, 200, 'status code')
			console.log(assert.inspect(res.body))
			assert.equal(res.body.success, true, 'success is true')
			done()
		})
	})

	it('should fetch latest correctly', function (done) {
		const url = `${serverURL}?method=latest`
		request.get(url).redirects(2).end(function (error, res) {
			assert.equal(res.statusCode, 200, 'status code')
			assert.equal(JSON.parse(res.text).name, 'docpad', 'latest docpad package.json was successfully fetched')
			done()
		})
	})

	it('should add balupton correctly', function (done) {
		const url = `${serverURL}?method=add-subscriber`
		request.get(url).send({name: 'Benjamin Lupton', email: 'b@lupton.cc'}).redirects(2).end(function (error, res) {
			assert.equal(res.statusCode, 200, 'status code')
			console.log(assert.inspect(res.body))
			assert.equal(res.body.success, true, 'success is true')
			assert.equal(res.body.email, 'b@lupton.cc', 'email is correct')
			done()
		})
	})

	it('should fetch skeletons correctly', function (done) {
		const url = `${serverURL}?method=skeletons&version=6.78.1`
		request.get(url).redirects(2).end(function (error, res) {
			assert.equal(res.statusCode, 200, 'status code')
			assert.equal(res.text.indexOf('h5bp') !== -1, true, 'h5bp skeleton was found')
			done()
		})
	})

	it('should fetch plugins correctly', function (done) {
		const url = `${serverURL}?method=plugins`
		request.get(url).redirects(2).end(function (error, res) {
			assert.equal(res.statusCode, 200, 'status code')
			assert.equal(Object.keys(res.body.plugins).length > 100, true, 'should have returned more than 100 plugins')
			done()
		})
	})

	it('should shutdown server correctly', function (done) {
		server.close(done)
	})

})
