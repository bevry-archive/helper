/* eslint no-console:0, no-magic-numbers:0 */
'use strict'

// Import
const joe = require('joe')
const assert = require('assert-helpers')
const superagent = require('superagent')

// Prepare
const HTTP_NOT_FOUND = 404
const HTTP_OK = 200

// Task
joe.suite('startuphostel-helper', function (suite, test) {
	let serverURL, server, app

	suite('app', function (suite, test) {
		test('create', function () {
			app = require('../lib/app').create()
		})
		test('setup', function (complete) {
			app.setup({}, complete)
		})
		test('listen', function (complete) {
			app.listen({middlewares: [require('../lib/startuphostel')]}, function (err, _connect, _server) {
				if ( err )  return complete(err)
				server = _server
				const address = server.address()
				serverURL = `http://${address.address}:${address.port}`
				complete()
			})
		})
	})

	test('should send 404 correctly', function (done) {
		const url = `${serverURL}`
		superagent.get(url).end(function (error, res) {
			assert.equal(res.statusCode, HTTP_NOT_FOUND, 'status code')
			assert.deepEqual(res.body, { success: false, error: '404 Not Found' }, 'body')
			done()
		})
	})

	test('should fetch the data correctly', function (done) {
		const url = `${serverURL}?method=startuphostel-people&key=${process.env.SH_API_KEY}`
		superagent.get(url).redirects(2).end(function (error, res) {
			assert.equal(res.statusCode, HTTP_OK, 'status code')
			assert.equal(res.body.people.length > 10, true, 'should have returned more than 10 people')
			done()
		})
	})

	test('should shutdown server correctly', function (done) {
		app.destroy({}, done)
	})

})
