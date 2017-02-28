/* eslint no-console:0 */
'use strict'

// Import
const joe = require('joe')
const assert = require('assert-helpers')
const superagent = require('superagent')

// Prepare
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

	test('should fetch contributors correctly', function (done) {
		const url = `${serverURL}?method=contributors&users=browserstate`
		superagent.get(url).end(function (error, res) {
			assert.equal(res.statusCode, HTTP_OK, 'status code')
			assert.equal(JSON.parse(res.text).success, true, 'latest contributors were successfully fetched')
			done()
		})
	})

	test('should shutdown server correctly', function (done) {
		app.stop(done)
	})
})
