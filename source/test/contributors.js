/* eslint no-console:0 */
'use strict'

// Import
const joe = require('joe')
const assert = require('assert-helpers')
const request = require('superagent')

// Prepare
const HTTP_NOT_FOUND = 404
const HTTP_OK = 200

// Task
joe.suite('contributors-helper', function (suite, test) {
	let app, serverURL

	test('app', function (done) {
		app = require('../app')
			.create({plugins: ['app', 'contributors']})
			.start(function (err) {
				if ( err )  return done(err)
				serverURL = app.state.app.serverURL
				console.log(`testing server listing on ${serverURL}`)
				done()
			})
	})

	test('should send 404 correctly', function (done) {
		const url = `${serverURL}`
		request.get(url).end(function (error, res) {
			assert.errorEqual(error, 'Not Found', 'error')
			assert.equal(res.statusCode, HTTP_NOT_FOUND, 'status code')
			assert.deepEqual(res.body, { success: false, error: '404 Not Found' }, 'body')
			done()
		})
	})

	test('should fetch contributors correctly', function (done) {
		const url = `${serverURL}?method=contributors&users=browserstate`
		request.get(url).end(function (error, res) {
			assert.errorEqual(error, null, 'error')
			assert.equal(res.statusCode, HTTP_OK, `status code, res: ${res.text}`)
			assert.equal(JSON.parse(res.text).success, true, `latest contributors were successfully fetched, res: ${res.text}`)
			done()
		})
	})

	test('should shutdown server correctly', function (done) {
		app.stop(done)
	})
})
