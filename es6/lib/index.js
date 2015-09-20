/* eslint consistent-this:0 */
'use strict'

// Imports
const TaskGroup = require('taskgroup')
const env = require('./env')
const state = require('./state')
const Person = require('./person')
const Server = require('./server')
const docpadMiddleware = require('./docpad')
const startuphostelMiddleware = require('./startuphostel')

// Logging
const logger = require('caterpillar').createLogger()
const human = require('caterpillar-human').createHuman()
logger.pipe(human).pipe(process.stdout)
const log = state.log = logger.log

// Setup
const tasks = TaskGroup.create().done(function (err) {
	if ( err ) {
		log('error', err.stack || err.message || err)
		process.exit(1)
		return
	}
	// server.start()
	log('info', 'App started successfully')
})

tasks.addGroup('init state', function () {
	const tasks = this

	tasks.addTask('connect to the database', function (complete) {
		log('info', 'Connecting to the database...')
		require('mongodb').MongoClient.connect(env.bevry.databaseUrl, function (err, db) {
			if ( err )  return complete(err)
			state.bevry.db = db
			log('info', 'Connected to the database')
			complete()
		})
	})

	tasks.addTask('setup docpad analytics', function () {
		const Analytics = require('analytics-node')
		state.docpad.analytics = new Analytics(env.docpad.segmentKey)
	})

	tasks.addTask('setup docpad plugin clerk', function () {
		const PluginClerk = require('pluginclerk')
		state.docpad.pluginClerk = new PluginClerk({log, keyword: 'docpad-plugin', prefix: 'docpad-plugin-'})
	})
})

/*
tasks.addGroup('load users', function () {
	const tasks = this

	tasks.addTask('load people from the database', function (complete) {
		log('info', 'Loading people from the database...')
		Person.loadFromDatabase({}, function (err) {
			if ( err )  return complete(err)
			log('info', 'Loaded people from the database...')
			complete()
		})
	})

	tasks.addTask('load people from the CSV file', function (complete) {
		log('info', 'Loading people from the CSV file...')
		const opts = {
			path: '/Users/balupton/startup-hostel-people.csv',
			data: {
				startupHostelUser: true
			}
		}
		Person.loadFromCsv(opts, function (err) {
			if ( err )  return complete(err)
			log('info', 'Loaded people from the CSV file...')
			complete()
		})
	})

	// Load people from twitter
	function twitterTask (opts) {
		return function (complete) {
			log('info', 'Loading people from twitter...')
			Person.loadFromTwitter(opts, function (err) {
				if ( err )  return complete(err)
				log('info', 'Loaded people from twitter')
				complete()
			})
		}
	}
	tasks.addTask('load startuphostel twitter followers', twitterTask({
		twitterUsername: 'StartupHostel',
		data: {
			startupHostelUser: true
		}
	}))
	tasks.addTask('load docpad twitter followers', twitterTask({
		twitterUsername: 'DocPad',
		data: {
			docpadUser: true
		}
	}))
	tasks.addTask('load bevry twitter followers', twitterTask({
		twitterUsername: 'BevryMe',
		data: {}
	}))

	// Load people from campaign monitor
	function subscriberTask (opts) {
		return function (complete) {
			log('info', 'Loading people from campaign monitor...')
			Person.loadFromCampaignMonitor(opts, function (err) {
				if ( err )  return complete(err)
				log('info', 'Loaded people from campaign monitor')
				complete()
			})
		}
	}
	tasks.addTask('load startuphostel subscribers', subscriberTask({
		campaignMonitorListId: env.startuphostel.campaignMonitorListId,
		data: {
			startupHostelUser: true
		}
	}))
	tasks.addTask('load docpad subscribers', subscriberTask({
		campaignMonitorListId: env.docpad.campaignMonitorListId,
		data: {
			docpadUser: true
		}
	}))

	tasks.addTask('load startuphostel facebook group members', function (complete) {
		log('info', 'Loading people from facebook group...')
		const opts = {
			facebookGroupId: env.startuphostel.facebookGroupId,
			data: {
				startupHostelUser: true
			}
		}
		Person.loadFromFacebookGroup(opts, function (err) {
			if ( err )  return complete(err)
			log('info', 'Loaded people from facebook group')
			complete()
		})
	})

	// Log who our people are
	tasks.addTask('log', function () {
		require('assert-helpers').log(Person.list)
	})
})
*/

// Start the server
tasks.addTask('server', function () {
	state.app.server = Server.create({log}).start({
		middlewares: [docpadMiddleware, startuphostelMiddleware]
	})
})

// Run
tasks.run()
