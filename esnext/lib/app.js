/* eslint consistent-this:0 */
'use strict'

// Imports
const TaskGroup = require('taskgroup')
const Server = require('./server')
const env = require('./env')
const state = require('./state')

// App
module.exports = class App {
	static create (...args) {
		return new this(...args)
	}

	init (opts, next) {
		if ( this.destroyed )  return next(new Error('Init failed as Application has been destroyed'))

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

		if ( !state.docpad.analytics ) {
			tasks.addTask('setup docpad analytics', () => {
				const Analytics = require('analytics-node')
				state.docpad.analytics = new Analytics(env.docpad.segmentKey)
			})
		}

		if ( !state.docpad.pluginClerk ) {
			tasks.addTask('setup docpad plugin clerk', () => {
				const PluginClerk = require('pluginclerk')
				state.docpad.pluginClerk = new PluginClerk({log: state.app.log, keyword: 'docpad-plugin', prefix: 'docpad-plugin-'})
			})
		}

		if ( !state.app.peopleFetcher ) {
			tasks.addTask('setup people fetcher', () => {
				state.app.peopleFetcher = require('./people-fetcher')({log: state.app.log})
			})
		}

		tasks.run()

		return this
	}

	listen (opts, next) {
		if ( this.destroyed )  return next(new Error('Init failed as Application has been destroyed'))

		const middlewares = opts.middlewares || [require('./docpad'), require('./startuphostel')]
		state.app.server = Server.create({log: state.app.log}).start({middlewares, next})
		return this
	}

	destroy (opts, next) {
		this.destroyed = true

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
