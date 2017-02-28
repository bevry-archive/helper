/* eslint no-console:0 */
'use strict'

const uuid = require('uuid')
const superagent = require('superagent')
const extendr = require('extendr')
const eachr = require('eachr')
const Cachely = require('cachely')
const {TaskGroup} = require('TaskGroup')
const Fellow = require('fellow')
const env = require('../env')

module.exports = class Person extends Fellow {

	constructor (...args) {
		super(...args)
		if ( this.uuid == null )  this.uuid = uuid.v4()
	}

	get displayName () {
		return this.name || this.email || this.uuid
	}

	get ensureFields () {
		return super.ensureFields.concat('names', 'facebookId', 'twitterId')
	}

	get name () {
		return this.profileName || this.facebookName || this.twitterName
	}

	get firstName () {
		const name = this.name
		if ( name ) {
			return name.split(' ')[0]
		}
		return name
	}

	get lastName () {
		const name = this.name
		if ( name ) {
			return name.split(' ').slice(-1)[0]
		}
		return name
	}

	get fullName () {
		const names = []
		const firstName = this.firstName
		const lastName = this.lastName
		if ( firstName )  names.push(firstName)
		if ( lastName )   names.push(lastName)
		return names.join(' ')
	}

	get names () {
		const result = []

		// only match users by (profile) name if they have both names, as we don't want to match all "Ben" people
		const firstName = this.firstName
		const lastName = this.lastName
		if ( firstName && lastName ) result.push(firstName + ' ' + lastName)

		if ( this.facebookName ) result.push(this.facebookName)
		if ( this.twitterName ) result.push(this.twitterName)

		return result
	}

	// used for gravatar
	get emailHash () {
		const email = this.email
		if ( email ) {
			return require('crypto').createHash('md5').update(email).digest('hex')
		}
		return null
	}

	get avatar () {
		const facebook = this.facebookUsername || this.facebookId
		if ( facebook ) {
			return `http://graph.facebook.com/v2.4/${facebook}/picture`
		}

		const twitterAvatar = this.twitterAvatar
		if ( twitterAvatar ) {
			return twitterAvatar
		}

		const emailHash = this.emailHash
		if ( emailHash ) {
			return `http://www.gravatar.com/avatar/${this.emailHash}.jpg`
		}

		return null
	}

	subscribe ({campaignMonitorListId}, next) {
		// Prepare data
		const data = {
			EmailAddress: this.email,
			Name: this.name,
			Resubscribe: true,
			CustomFields: [{
				Key: 'username',
				Value: this.username
			}]
		}

		// Subscribe to the list
		superagent
			.post(`https://api.createsend.com/api/v3.1/subscribers/${campaignMonitorListId}.json`)
			.auth(env.bevry.campaignMonitorKey, 'x')
			.send(data).end((err, result) => {
				if ( err )  return next(err)
				this.addSource(`campaign-monitor-${campaignMonitorListId}`)
				next(null, result.body)
			})

		// Chain
		return this
	}

	save (opts, next) {
		const model = this.model
		const {log, database} = model

		const filter = {
			uuid: this.uuid
		}
		const update = {
			$set: this.json
		}
		const options = {
			upsert: true
		}

		log('debug', `Saving ${this.displayName} to database...`)
		database.collection('users').updateOne(filter, update, options, (err, response) => {
			if ( err )  return next(err)
			log('debug', `Saved ${this.displayName} to database`, response.result)
			next()
		})
	}

	addSource (source) {
		if ( !this.sources )  this.sources = {}
		this.sources[source] = true
		return this
	}

	static docpadUsers () {
		return this.list.filter(function (person) {
			return Boolean(person.docpadUser)
		})
	}

	static startupHostelUsers () {
		return this.list.filter(function (person) {
			return Boolean(person.startupHostelUser)
		})
	}

	static loadFromDatabase (opts, next) {
		const model = this
		const {log, database} = model
		log('debug', 'Fetching database data...')
		database.collection('users').find({}).toArray((err, result) => {
			if ( err )  return next(err)
			log('debug', 'Fetched database data')
			this.add(result)
			next()
		})

		// Chain
		return this
	}

	static loadFromCsv ({path, data = {}}, next) {
		const model = this
		const {log} = model

		const csv = require('csv')
		const fsUtil = require('safefs')
		const fields = {
			email: 'Email',
			profileName: 'Name',
			skypeUsername: 'Skype',
			twitterUsername: 'Twitter',
			githubUsername: 'Github',
			facebookUsername: 'Facebook',
			homepage: 'Website',
			bio: 'Bio'
		}

		log('debug', 'Fetching CSV data...')
		fsUtil.readFile(path, (err, fileData) => {
			if ( err )  return next(err)
			const csvOptions = {
				columns: true
			}
			csv.parse(fileData.toString(), csvOptions, (err, results) => {
				if ( err )  return next(err)

				log('debug', 'Fetched CSV data')

				for ( const result of results ) {
					const personData = {}
					eachr(fields, function (resultKey, personKey) {
						personData[personKey] = result[resultKey]
						delete result[resultKey]
					})
					delete result.Avatar
					personData.startupHostelSurvey = result
					model.ensure(extendr.extend(personData, data)).addSource('startuphostel-csv')
				}

				next()
			})
		})

		// Chain
		return this
	}

	static loadFromCampaignMonitor ({campaignMonitorListId, data = {}}, next) {
		const model = this
		const {log} = model
		log('debug', 'Fetching campaign monitor data...')

		superagent
			.get(`https://api.createsend.com/api/v3.1/lists/${campaignMonitorListId}/active.json`)
			.accept('json')
			.auth(env.bevry.campaignMonitorKey, 'x')
			.end((err, dataResponse) => {
				if ( err ) {
					return next(new Error('Request for Campaign Monitor data has failed with error:\n' + err.stack))
				}

				log('debug', 'Fetched campaign monitor data')

				for ( const result of dataResponse.body.Results ) {
					model.ensure(extendr.extend({
						email: result.EmailAddress,
						profileName: result.Name
					}, data)).addSource(`campaign-monitor-${campaignMonitorListId}`)
				}

				/*
				// Merge in custom fields
				cmUser.CustomFields.forEach(function (customField) {
					const customFieldKey = customField.Key.toLowerCase()
					user.set(customFieldKey, customField.Value, {safe: true})
				})
				*/

				next()
			})

		// Chain
		return this
	}

	static loadFromTwitter ({twitterUsername, data = {}}, next) {
		const model = this
		const {log, twitterClient} = model

		/* eslint camelcase:0 */
		log('debug', 'Fetching twitter data...', twitterUsername)
		twitterClient.get('followers/list', {screen_name: twitterUsername}, (err, data) => {
			if (err) {
				return next(new Error(
					'Request for Twitter data has failed with error:\n' + err.stack
				))
			}
			else if ( !data.users ) {
				return next(new Error(
					'Request for Twitter data has failed with no results:\n' +
					`Screen Name: ${twitterUsername}\n` +
					require('util').inspect(data)
				))
			}

			log('debug', 'Fetched twitter data', twitterUsername)

			for ( const result of data.users ) {
				model.ensure(extendr.extend({
					twitterId: result.id,
					twitterName: result.name,
					twitterUsername: result.screen_name,
					twitterAvatar: result.profile_image_url,
					location: result.location,
					timezone: result.time_zone,
					bio: result.description
				}, data)).addSource(`twitter-followed-${twitterUsername}`)
			}

			next()
		})

		// Chain
		return this
	}

	static fetch (next) {
		const model = this
		const {log} = model
		model.fetchCachely = model.fetchCachely || Cachely.create({log, method: (next) => {
			// Prepare
			const tasks = TaskGroup.create().done(function (err) {
				if ( err )  return next(err)
				next(null, 'fetched')
			})

			// Tasks
			tasks.addTask('load people from the database', function (complete) {
				log('info', 'Loading people from the database...')
				model.loadFromDatabase({}, function (err) {
					if ( err )  return complete(err)
					log('info', 'Loaded people from the database...')
					complete()
				})
			})

			/*
			tasks.addTask('load people from the CSV file', function (complete) {
				log('info', 'Loading people from the CSV file...')
				const opts = {
					path: '/Users/balupton/startup-hostel-people.csv',
					data: {
						startupHostelUser: true
					}
				}
				model.loadFromCsv(opts, function (err) {
					if ( err )  return complete(err)
					log('info', 'Loaded people from the CSV file...')
					complete()
				})
			})
			*/

			// Load people from twitter
			function twitterTask (opts) {
				return function (complete) {
					log('info', 'Loading people from twitter...')
					model.loadFromTwitter(opts, function (err) {
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
					model.loadFromCampaignMonitor(opts, function (err) {
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

			/*
			// Log who our people are
			tasks.addTask('log', function () {
				require('assert-helpers').log(Person.list)
			})
			*/

			// Update them
			tasks.addGroup('save', function (addGroup, addTask) {
				this.setConfig({concurrency: 0})
				model.list.forEach(function (person) {
					addTask(`Saving: ${person.displayName}`, function (complete) {
						person.save({}, complete)
					})
				})
			})

			// Start
			tasks.run()
		}})
		model.fetchCachely.request(next)
		return this
	}

}
