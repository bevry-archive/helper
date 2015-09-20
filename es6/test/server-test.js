/* eslint no-console:0 */
'use strict'

// Import
const joe = require('joe')
const assert = require('assert-helpers')
const request = require('superagent')

// Task
joe.suite('server', function (suite, test) {
	let serverURL, server

	suite('server', function (suite, test) {
		test('create', function () {
			server = require('../lib/server').create({log: console.log})
		})
		test('start', function (done) {
			server.start({
				middleware: function (req, res, next) {
					switch ( req.query.method ) {
						case 'error':
							res.sendError('the error', {someData: 123})
							break

						case 'success':
							res.sendSuccess({someData: 123})
							break

						case 'response':
							res.sendResponse({someData: 123})
							break

						default:
							next()  // will send 404 error
							break
					}
				},
				next: function (error, _connect, _server) {
					if ( error )  return done(error)
					server = _server
					const address = server.address()
					serverURL = `http://${address.address}:${address.port}`
					done()
				}
			})
		})
	})

	test('should send 404 correctly', function (done) {
		const url = `${serverURL}`
		request.get(url).end(function (error, res) {
			assert.equal(res.statusCode, 404, 'status code')
			assert.deepEqual(res.body, { success: false, error: '404 Not Found' }, 'body')
			done()
		})
	})

	test('should send errors correctly', function (done) {
		const url = `${serverURL}?method=error`
		request.get(url).end(function (error, res) {
			assert.equal(res.statusCode, 400, 'status code')
			assert.deepEqual(res.body, { success: false, error: 'the error', someData: 123 }, 'body')
			done()
		})
	})

	test('should send success correctly', function (done) {
		const url = `${serverURL}?method=success`
		request.get(url).end(function (error, res) {
			assert.equal(res.statusCode, 200, 'status code')
			assert.deepEqual(res.body, { success: true, someData: 123 }, 'body')
			done()
		})
	})

	test('should send response correctly', function (done) {
		const url = `${serverURL}?method=response`
		request.get(url).end(function (error, res) {
			assert.equal(res.statusCode, 200, 'status code')
			assert.deepEqual(res.body, { someData: 123 }, 'body')
			done()
		})
	})

	test('should shutdown server correctly', function (done) {
		server.close(done)
	})

})
