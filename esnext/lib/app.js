/* eslint consistent-this:0 */
'use strict'

// Imports
const TaskGroup = require('taskgroup')
const Server = require('./server')
const env = require('./env')
const state = require('./state')

// Prepare
const READY_DELAY = 500

// App
module.exports = class App {
	static create (...args) {
		return new this(...args)
	}

	constructor () {
		this._destroyed = false
		this._setup = false
	}

	// This gets overwrote in ./state.js
	log (...args) {
		console.log(...args)
	}

	ready ({name = 'unknown'}, next) {
		if ( this._destroyed ) {
			console.log(`ready callback for ${name} will not be fired as app has been destroyed`)
		}
		else if ( !this.initialized ) {
			this.setTimeout(this.ready.bind(this, {name}, next), READY_DELAY)
		}

		// Chain
		return this
	}

	start (opts, next) {
		if ( this._destroyed )  return next(new Error('Start failed as Application has been destroyed'))

		const tasks = new TaskGroup().done(next)

		tasks.addTask((complete) => {
			this.listen(opts, complete)
		})

		tasks.addTask((complete) => {
			this.setup(opts, complete)
		})

		tasks.run()

		// Chain
		return this
	}

	setup (opts, next) {
		if ( this._destroyed )  return next(new Error('Setup failed as Application has been destroyed'))

		const tasks = new TaskGroup().done(next)

		if ( !state.bevry.db ) {
			tasks.addTask('connect to the database', (complete) => {
				state.app.log('info', 'Connecting to the database...')
				require('mongodb').MongoClient.connect(env.bevry.databaseUrl, (err, db) => {
					if ( err )  return complete(err)
					state.bevry.db = db
					state.app.log('info', 'Connected to the database')
					complete()
				})
			})
		}

		/* eslint camelcase:0 */
		if ( !state.bevry.twitterClient ) {
			tasks.addTask('setup twitter api client', function () {
				state.app.log('info', 'Init Twitter API Client')
				const Twit = require('twit')
				state.bevry.twitterClient = new Twit({
					consumer_key: env.bevry.twitterConsumerKey,
					consumer_secret: env.bevry.twitterConsumerSecret,
					access_token: env.bevry.twitterAccessToken,
					access_token_secret: env.bevry.twitterAccessTokenSecret
				})
			})
		}

		if ( !state.docpad.analytics ) {
			tasks.addTask('setup docpad analytics', function () {
				state.app.log('info', 'Init DocPad Analytics')
				const Analytics = require('analytics-node')
				state.docpad.analytics = new Analytics(env.docpad.segmentKey)
			})
		}

		if ( !state.docpad.pluginClerk ) {
			tasks.addTask('setup docpad plugin clerk', function () {
				state.app.log('info', 'Init Plugin Clerk')
				const PluginClerk = require('pluginclerk')
				state.docpad.pluginClerk = new PluginClerk({log: state.app.log, keyword: 'docpad-plugin', prefix: 'docpad-plugin-'})
			})
		}

		if ( !state.app.peopleFetcher ) {
			tasks.addTask('setup people fetcher and fetch people', function (complete) {
				state.app.log('info', 'Initialising people fetcher...')
				state.app.peopleFetcher = require('./people-fetcher')({log: state.app.log})
				state.app.peopleFetcher.request(function (...args) {
					state.app.log('info', 'Initialized people fetcher')
					complete(...args)
				})
			})
		}

		tasks.addTask('setup completed', () => {
			this._setup = true
		})

		tasks.run()

		return this
	}

	listen (opts, next) {
		if ( this._destroyed )  return next(new Error('Listen failed as Application has been destroyed'))
		const middlewares = opts.middlewares || [require('./docpad'), require('./startuphostel')]
		state.app.server = Server.create({log: state.app.log}).start({middlewares, next})
		return this
	}

	destroy (opts, next) {
		this._destroyed = true

		const tasks = new TaskGroup().done(next)

		if ( state.bevry.db ) {
			tasks.addTask('shutdown database', function (complete) {
				state.bevry.db.close(false, function (err) {
					if ( err )  return complete(err)
					state.bevry.db = null
					complete()
				})
			})
		}

		if ( state.app.server ) {
			tasks.addTask('shutdown the server', function (complete) {
				state.app.server.destroy(opts, function (err) {
					if ( err )  return complete(err)
					state.app.server = null
					complete()
				})
			})
		}

		tasks.run()
		return this
	}

}
