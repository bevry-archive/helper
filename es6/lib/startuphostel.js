'use strict'

// Imports
const Person = require('./person')
const env = require('./env')

// Service
module.exports = function middleware (req, res, next) {
	if ( req.query.method === 'startuphostel-users' ) {
		if ( req.query.key !== env.startuphostel.apiKey ) {
			res.sendError(new Error('Not Authorised'), 401)
		}
		else {
			res.sendSuccess(Person.startupHostelUsers().map(function (user) {
				return {
					name: user.name,
					bio: user.bio,
					url: user.url,
					email: user.email,
					avatar: user.avatar
				}
			}))
		}
	}
	else {
		next()
	}
}
