'use strict'

const Person = require('../lib/person')
const Twit = require('twit')
const {MongoClient} = require('mongodb')
const env = require('../env')

function initTwitter () {
	/* eslint camelcase:0 */
	const {state, log} = this
	log('info', 'init twitter API client')
	state.bevry.twitterClient = new Twit({
		consumer_key: env.bevry.twitterConsumerKey,
		consumer_secret: env.bevry.twitterConsumerSecret,
		access_token: env.bevry.twitterAccessToken,
		access_token_secret: env.bevry.twitterAccessTokenSecret
	})
}

function initDatabase (complete) {
	const {state, log} = this
	log('info', 'connecting to the database...')
	MongoClient.connect(env.bevry.databaseUrl, (err, db) => {
		if ( err )  return complete(err)
		state.bevry.database = db
		log('info', 'connected to the database')
		complete()
	})
}

function deinitDatabase (complete) {
	const {state, log} = this
	log('info', 'closing to the database...')
	state.bevry.database.close(false, (err) => {
		if ( err )  return complete(err)
		state.bevry.database = null
		log('info', 'closed the database')
		complete()
	})
}

module.exports = function () {
	const app = this

	class AppPerson extends Person {
		/* eslint class-methods-use-this:0 */
		get model () {
			return AppPerson
		}
		static log (...args) {
			return app.log(...args)
		}
		static get database () {
			return app.state.bevry.database
		}
		static get twitterClient () {
			return app.state.bevry.twitterClient
		}
	}

	this.state.bevry = {
		database: null,
		twitterClient: null,
		Person: AppPerson
	}

	this.on('init', initTwitter)
	this.on('init', initDatabase)
	this.on('deinit', deinitDatabase)
}
