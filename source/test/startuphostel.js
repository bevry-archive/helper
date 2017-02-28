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
joe.suite('startuphostel-helper', function (suite, test) {
	let app, serverURL

	test('app', function (done) {
		app = require('../app')
			.create({plugins: ['app', 'bevry', 'startuphostel']})
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

	test('should fetch the data correctly', function (done) {
		const url = `${serverURL}?method=startuphostel-people&key=${process.env.SH_API_KEY}`
		request.get(url).redirects(2).end(function (error, res) {
			assert.errorEqual(error, null, 'error')
			assert.equal(res.statusCode, HTTP_OK, 'status code')
			assert.equal(res.body.people.length > 10, true, 'should have returned more than 10 people')
			done()
		})
	})

	test('should shutdown server correctly', function (done) {
		app.stop({}, done)
	})

})
