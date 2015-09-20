'use strict'

// Imports
const env = require('./env')
const state = require('./state')

// Service
module.exports = function middleware (req, res, next) {
	if ( req.query.method === 'startuphostel-people' ) {
		if ( req.query.key !== env.startuphostel.apiKey ) {
			res.sendError(new Error('Not Authorised'), 401)
		}
		else {
			state.app.peopleFetcher.request(function (err) {
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
		}
	}
	else {
		next()
	}
}
