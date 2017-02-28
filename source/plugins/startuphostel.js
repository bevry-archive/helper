'use strict'

// Imports
const env = require('../env')

// Prepare
const HTTP_UNAUTHORIZED = 401

// Listeners
function initStartupHostel (complete) {
	const {state, log} = this
	log('info', 'init startup hostel people fetcher...')
	state.bevry.Person.fetch((...args) => {
		log('info', 'init startup hostel people fetcher')
		complete(...args)
	})
}

// Service
function middleware (req, res, next) {
	// Prepare
	const {state} = this
	const log = res.log

	// Log
	log('info', 'startuphostel: received request:', req.url, req.query, req.body)

	// Handle
	if ( req.query.method === 'startuphostel-people' ) {
		if ( !req.query.key || req.query.key !== env.startuphostel.apiKey ) {
			res.sendError(new Error('Not Authorised'), null, HTTP_UNAUTHORIZED)
		}
		else {
			// Ready
			state.bevry.Person.fetch(function (err) {
				if ( err )  return res.sendError(err)
				const people = state.bevry.Person.startupHostelUsers().map(function (person) {
					return {
						name: person.name,
						bio: person.bio,
						url: person.url,
						email: person.email,
						avatar: person.avatar
					}
				})
				res.sendSuccess({people})
			})
		}
	}
	else {
		next()
	}
}

// Register
module.exports = function () {
	this.on('init', initStartupHostel)
	this.on('init', () => {
		this.state.app.middlewares.push(middleware.bind(this))
	})
}
