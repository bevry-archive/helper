'use strict'

// Imports
const GetContributors = require('getcontributors')
const env = require('../env')

function initGetter () {
	const {state, log} = this
	state.contributors.getter = GetContributors.create({
		githubClientId: env.contributors.GITHUB_CLIENT_ID,
		githubClientSecret: env.contributors.GITHUB_CLIENT_SECRET,
		log
	})
}

// Middleware
function middleware (req, res, next) {
	// Prepare
	const {state} = this
	const log = res.log

	// Log
	log('info', 'contributors: received request:', req.url, req.query, req.body)

	// HAndle
	if ( req.query.method === 'contributors' ) {
		if ( req.query.users ) {
			state.contributors.getter.fetchContributorsFromUsers(req.query.users.split(','), function (err, contributors) {
				if ( err )  return res.sendError(err)
				res.sendSuccess({contributors})
			})
		}
		else if ( req.query.repos ) {
			state.contributors.getter.fetchContributorsFromRepos(req.query.repos.split(','), function (err, contributors) {
				if ( err )  return res.sendError(err)
				res.sendSuccess({contributors})
			})
		}
		else {
			return res.sendError(new Error('contributors: requires either users and repos'))
		}
	}
	else {
		next()
	}
}

// Register
module.exports = function () {
	this.state.contributors = {
		getter: null
	}
	this.on('init', initGetter)
	this.on('register-middleware', ({middlewares}) => {
		middlewares.push(middleware.bind(this))
	})
}
