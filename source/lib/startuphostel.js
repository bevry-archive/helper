// Imports
const env = require('./env')
const state = require('./state')

// Prepare
const HTTP_UNAUTHORIZED = 401

// Service
module.exports = function middleware (req, res, next) {
	// Prepare
	const log = res.log

	// Log
	log('info', 'startuphostel: received request:', req.url, req.query, req.body)

	// HAndle
	if ( req.query.method === 'startuphostel-people' ) {
		if ( !req.query.key || req.query.key !== env.startuphostel.apiKey ) {
			res.sendError(new Error('Not Authorised'), null, HTTP_UNAUTHORIZED)
		}
		else {
			// Wait for ready
			state.app.ready({name: 'startup hostel people'}, function (err) {
				if ( err )  return res.sendError(err)
				// Ready
				state.startuphostel.peopleFetcher.request(function (err) {
					if ( err )  return res.sendError(err)
					const people = require('./person').startupHostelUsers().map(function (person) {
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
			})
		}
	}
	else {
		next()
	}
}
