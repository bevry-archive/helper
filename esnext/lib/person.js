/* eslint no-console:0, prefer-reflect:0 */
'use strict'

const uuid = require('uuid')
const superagent = require('superagent')
const extendr = require('extendr')
const eachr = require('eachr')
const env = require('./env')
const state = require('./state')

module.exports = class Person extends require('fellow') {

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
		const filter = {
			uuid: this.uuid
		}
		const update = {
			$set: this.json
		}
		const options = {
			upsert: true
		}

		state.app.log('debug', `Saving ${this.displayName} to database...`)
		state.bevry.db.collection('users').updateOne(filter, update, options, (err, response) => {
			if ( err )  return next(err)
			state.app.log('debug', `Saved ${this.displayName} to database`, response.result)
			// console.log(result)
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
		state.app.log('debug', 'Fetching database data...')
		state.bevry.db.collection('users').find({}).toArray((err, result) => {
			if ( err )  return next(err)

			state.app.log('debug', 'Fetched database data')

			Person.add(result)

			next()
		})

		// Chain
		return this
	}

	static loadFromCsv ({path, data = {}}, next) {
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

		state.app.log('debug', 'Fetching CSV data...')
		fsUtil.readFile(path, function (err, fileData) {
			if ( err )  return next(err)
			const csvOptions = {
				columns: true
			}
			csv.parse(fileData.toString(), csvOptions, function (err, results) {
				if ( err )  return next(err)

				state.app.log('debug', 'Fetched CSV data')

				for ( const result of results ) {
					const personData = {}
					eachr(fields, function (resultKey, personKey) {
						personData[personKey] = result[resultKey]
						delete result[resultKey]
					})
					delete result.Avatar
					personData.startupHostelSurvey = result
					Person.ensure(extendr.extend(personData, data)).addSource('startuphostel-csv')
				}

				next()
			})
		})

		// Chain
		return this
	}

	static loadFromCampaignMonitor ({campaignMonitorListId, data = {}}, next) {
		state.app.log('debug', 'Fetching campaign monitor data...')

		superagent
			.get(`https://api.createsend.com/api/v3.1/lists/${campaignMonitorListId}/active.json`)
			.accept('json')
			.auth(env.bevry.campaignMonitorKey, 'x')
			.end(function (err, dataResponse) {
				if ( err ) {
					return next(new Error('Request for Campaign Monitor data has failed with error:\n' + err.stack))
				}

				state.app.log('debug', 'Fetched campaign monitor data')

				for ( const result of dataResponse.body.Results ) {
					Person.ensure(extendr.extend({
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
		/* eslint camelcase:0 */
		state.app.log('debug', 'Fetching twitter data...', twitterUsername)
		state.bevry.twitterClient.get('followers/list', {screen_name: twitterUsername}, function (err, data) {
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

			state.app.log('debug', 'Fetched twitter data', twitterUsername)

			console.log(require('util').inspect(data))

			for ( const result of data.users ) {
				Person.ensure(extendr.extend({
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

	static loadFromFacebookGroup ({facebookGroupId, data = {}}, next) {
		const url = `https://graph.facebook.com/v2.4/${facebookGroupId}/members?fields=name,id&limit=9999&access_token=${env.bevry.facebookAccessToken}`
		state.app.log('debug', 'Fetching Facebook Group data...', facebookGroupId)
		superagent
			.get(url)
			.accept('json')
			.end(function (err, dataResponse) {
				if ( dataResponse && dataResponse.body.error ) {
					return next(new Error(
						'Request for Facebook Group data has failed with returned error:\n' +
						require('util').inspect(dataResponse.body.error)
					))
				}
				else if ( err ) {
					return next(new Error('Request for Facebook Group data has failed with error:\n' + err.stack))
				}

				state.app.log('debug', 'Fetched Facebook Group data', facebookGroupId)

				for ( const result of dataResponse.body.data ) {
					Person.ensure(extendr.extend({
						facebookName: result.name,
						facebookId: result.id
					}, data)).addSource(`facebook-group-${facebookGroupId}`)
				}

				next()
			})

		// Chain
		return this
	}

}
