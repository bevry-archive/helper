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
		this._logger = null
		this.db = null
		this.server = null
		this.log = console.log
		state.app = this
	}

	ready ({name = 'unknown'}, next) {
		if ( this._destroyed ) {
			this.log('warn', new Error(`ready callback for ${name} will not be fired as app has been destroyed`))
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

		if ( !this._logger ) {
			tasks.addTask('setup logger', () => {
				const logger = require('caterpillar').createLogger()
				const human = require('caterpillar-human').createHuman()
				this._logger = logger.pipe(human).pipe(process.stdout)
				this.log = logger.log.bind(logger)
			})
		}

		if ( !this.db ) {
			tasks.addTask('connect to the database', (complete) => {
				this.log('info', 'Connecting to the database...')
				require('mongodb').MongoClient.connect(env.bevry.databaseUrl, (err, db) => {
					if ( err )  return complete(err)
					this.db = db
					this.log('info', 'Connected to the database')
					complete()
				})
			})
		}

		/* eslint camelcase:0 */
		if ( !this.twitterClient ) {
			tasks.addTask('setup twitter api client', () => {
				this.log('info', 'Init Twitter API Client')
				const Twit = require('twit')
				this.twitterClient = new Twit({
					consumer_key: env.bevry.twitterConsumerKey,
					consumer_secret: env.bevry.twitterConsumerSecret,
					access_token: env.bevry.twitterAccessToken,
					access_token_secret: env.bevry.twitterAccessTokenSecret
				})
			})
		}

		if ( !state.docpad.analytics ) {
			tasks.addTask('setup docpad analytics', () => {
				this.log('info', 'Init DocPad Analytics')
				const Analytics = require('analytics-node')
				state.docpad.analytics = new Analytics(env.docpad.segmentKey)
			})
		}

		if ( !state.docpad.pluginClerk ) {
			tasks.addTask('setup docpad plugin clerk', () => {
				this.log('info', 'Init Plugin Clerk')
				const PluginClerk = require('pluginclerk')
				state.docpad.pluginClerk = new PluginClerk({log: this.log, keyword: 'docpad-plugin', prefix: 'docpad-plugin-'})
			})
		}

		if ( !state.startuphostel.peopleFetcher ) {
			tasks.addTask('setup people fetcher and fetch people', (complete) => {
				this.log('info', 'Initialising people fetcher...')
				state.startuphostel.peopleFetcher = require('./people-fetcher')({log: state.app.log})
				state.startuphostel.peopleFetcher.request((...args) => {
					this.log('info', 'Initialized people fetcher')
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

		if ( this.db ) {
			tasks.addTask('shutdown database', (complete) => {
				this.db.close(false, (err) => {
					if ( err )  return complete(err)
					this.db = null
					complete()
				})
			})
		}

		if ( state.app.server ) {
			tasks.addTask('shutdown the server', (complete) => {
				this.server.destroy(opts, (err) => {
					if ( err )  return complete(err)
					this.server = null
					complete()
				})
			})
		}

		tasks.run()
		return this
	}

}
