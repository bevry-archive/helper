export default function (opts) {
	'use strict'

	// Import
	const eachr = require('eachr')
	const gsheets = require('google-sheets')
	const TaskGroup = require('taskgroup')
	const CreateSend = require('createsend')

	// Environment Variables
	const envData = opts.env
	const envKeys = [
		'campaignMonitorKey',
		'campaignMonitorListId',
		'googleSpreadsheetKey',
		'googleSpreadsheetEmail',
		'googleSpreadsheetPassword',
		'facebookGroupId',
		'facebookAccessToken',
		'apiKey'
	]
	envKeys.forEach(function (key) {
		if ( !envData[key] ) {
			throw new Error(`startuphostel: Environment Variable [${key}] is undefined`)
		}
	})

	// Logger
	const log = opts.log

	// Prepare
	const appData = {
		sales: 0,
		gsheets: null,
		spreadsheet: null,
		worksheets: null,
		worksheet: null,
		rows: null,
		users: []
	}

	// Initialise
	const feedr = require('feedr').create({log: log})
	const createsendConnection = new CreateSend(envData.campaignMonitorKey)
	const result = {}

	// ===================================
	// Preparation

	// Class
	class User {

		// Create user
		static create (data) {
			let user = null
			if ( data instanceof User ) {
				user = data
			}
			else {
				user = new User(data)
			}
			return user
		}

		// Find user
		static find (data) {
			const checks = 'name email skype twitter facebook github website avatar'.split(' ')
			const foundUser = User.create(data)
			let result = null
			appData.users.forEach((user) => {
				if ( result )  return false
				checks.forEach((check) => {
					if ( user.attributes[check] && user.attributes[check] === foundUser.attributes[check] ) {
						result = user
						return false
					}
				})
			})
			return result
		}

		// Add user
		static add (data) {
			// Find
			const newUser = User.create(data)
			const foundUser = User.find(newUser)
			if ( foundUser ) {
				// Merge
				foundUser.set(newUser.toJSON(), {safe: true})

				// Return
				return foundUser
			}
			else {
				// Add
				appData.users.push(newUser)

				// Return
				return newUser
			}
		}

		// toJSON
		static toJSON () {
			const list = []
			appData.users.forEach(function (user) {
				list.push(user.toJSON())
			})
			return list
		}


		constructor (values) {
			this.attributes = {
				name: null,
				email: null,
				skype: null,
				github: null,
				twitter: null,
				twitterID: null,  // id number
				facebook: null,   // id number (or possibly username)
				gender: null,
				website: null,
				bio: null,
				confirmed: null,
				avatar: null,  // url
				spreadsheetUser: null
			}
			this.set(values)
		}

		toJSON () {
			return this.attributes
		}

		set (key, value, opts = {}) {
			// Set
			if ( key ) {
				// Single
				if ( typeof key === 'string' ) {
					// Check
					if ( value ) {
						// Adjust
						switch ( key ) {
							case 'facebook':
							case 'github':
							case 'twitter':
								value = value.replace(/^.+com\//, '').replace(/\//g, '').replace(/\@/g, '') || null
								break

							case 'email':
								value = value.replace('\u0040', '@')
								break

							case 'confirmed':
								let lc = String(value).toLowerCase()
								if ( lc === 'yes' || lc === 'true' ) {
									value = 'TRUE'
								}
								else {
									value = false
								}
								break

							default:
								break
						}

						// Apply
						if ( opts.safe ) {
							this.attributes[key] = this.attributes[key] || value || null
						}
						else {
							this.attributes[key] = value || null
						}
					}
				}

				// Multiple
				else {
					// Apply each
					eachr(key, (_value, _key) => {
						this.set(_key, _value, value || opts || null)
					})
				}
			}

			// Chain
			return this
		}

		get (key) {
			// Prepare
			let value = null

			// Apply
			switch ( key ) {
				case 'hash':
					// hash for user identification
					// don't save this as this may change
					let username = this.get('username')
					if ( username ) {
						value = require('crypto').createHash('md5').update(username).digest('hex')
					}
					break

				case 'username':
					value = this.attributes.username || this.get('email') || this.get('name')
					break

				case 'name':
					value = this.attributes.name || this.get('skype') || this.get('twitter') || this.get('facebook') || this.get('github')
					break

				case 'emailHash':
					// user for gravatars
					let email = this.get('email')
					if ( email ) {
						value = require('crypto').createHash('md5').update(email).digest('hex')
					}
					break

				case 'text':
					let name = this.get('name')
					if ( name ) {
						let bio = this.get('bio')
						if ( bio ) {
							value = name + `: ${bio}`
						}
						else {
							value = name
						}
					}
					break

				case 'twitterURL':
					let twitter = this.get('twitter')
					if ( twitter ) {
						value = `http://twitter.com/${twitter}`
					}
					break

				case 'facebookURL':
					let facebook = this.get('facebook')
					if ( facebook ) {
						value = `https://www.facebook.com/${facebook}`
					}
					break

				case 'website':
					value = this.attributes.website || this.get('twitterURL') || this.get('facebookURL')
					break

				default:
					if ( typeof this.attributes[key] === 'undefined' ) {
						log('warn', 'startuphostel: tried to access an unknown attribute:', key)
					}

					value = this.attributes[key]
					break
			}

			// Return
			return value || null
		}

		save (next) {
			// Check
			if ( !appData.rows )  return next()

			// Prepare
			let keys = 'name email bio confirmed avatar skype twitter github facebook website'.split(' ')

			// Handle
			let row = this.get('spreadsheetUser')
			if ( row ) {
				// Apply
				let changed = false
				keys.forEach((key) => {
					let oldValue = row.data[key] || ''
					let newValue = this.attributes[key] || ''
					if (oldValue !== newValue ) {
						row.data[key] = newValue
						log('info', 'startuphostel: CHANGED:', row.title, key, {newValue, oldValue})
						changed = true
					}
				})

				// Update
				if ( changed ) {
					appData.rows.save(row, (err, row) => {
						if ( err )  return next(err)
						log('info', 'startuphostel: SAVED:', row.title)
						return next()
					})
				}

				// Same
				else {
					log('info', 'startuphostel: same:', row.title)
					return next()
				}
			}

			// Add
			else {
				// Apply
				let data = {}
				keys.forEach((key) => {
					data[key] = this.attributes[key] || ''
				})

				// Create
				appData.rows.create(data, (err, row) => {
					if ( err )  return next(err)
					log('info', 'startuphostel: ADDED:', row.title)
					this.set('spreadsheetUser', row)
					return next()
				})
			}

			// Chain
			return this
		}
	}

	// ===================================
	// Worker

	result.worker = function () {
		// Start
		const tasks = new TaskGroup()
			.done(function (err) {
				if ( err ) {
					log('err', 'startuphostel: syncronisation failed:', err.stack || err.message || err)
				}
				else {
					log('startuphostel: syncronised successfully')
					setTimeout(result.worker, 60 * 60 * 24)  // repeat in 24 hourse
				}
				tasks.destroy()
			})
			.on('item.started', function (item) {
				log('info', 'startuphostel: running', item.getNames())
			})

		// -----------------------------------
		// Spreadsheet Connection

		tasks.addTask('Spreadsheet Connection', function (next) {
			// Are we missing anything required for the spreadsheet connection?
			if ( !envData.googleSpreadsheetKey || !envData.googleSpreadsheetEmail || !envData.googleSpreadsheetPassword )  return next()

			// Setup auth variable from env data
			const authData = {
				email: envData.googleSpreadsheetEmail,
				password: envData.googleSpreadsheetPassword
			}

			// Sheets
			gsheets.auth(authData, function (err) {
				if ( err )  return next(err)

				// Spreadsheet
				gsheets.getSpreadsheet(envData.googleSpreadsheetKey, function (err, spreadsheet) {
					if ( err )  return next(err)

					// set the global variable
					appData.spreadsheet = spreadsheet

					// Worksheets
					spreadsheet.getWorksheets(function (err, worksheets) {
						if ( err )  return next(err)

						// Set the global variable
						appData.worksheets = worksheets

						// Check
						if ( worksheets.length === 0 ) {
							const err = new Error('No worksheets!')
							log('err', 'startuphostel:', err, spreadsheet)
							return next(err)
						}

						// Set the global variable
						appData.worksheet = worksheets[0]

						// Continue
						return next()
					})
				})
			})
		})

		// -----------------------------------
		// Spreadsheet Users

		tasks.addTask('Speadsheet Users', function (next) {
			if ( !appData.worksheet )  return next()
			appData.worksheet.getRows(function (err, rows) {
				if ( err )  return next(err)

				// Set the global variable
				appData.rows = rows

				// Cycle through the rows
				rows.forEach(function (row) {
					// Prepare
					const data = row.data

					// Apply user information
					User.add({
						name: data.name,
						email: data.email,
						bio: data.bio,
						confirmed: data.confirmed,
						avatar: data.avatar || data.avatarurl,
						skype: data.skype || data.skypeusername,
						twitter: data.twitter || data.twitterusername,
						github: data.github || data.githubusername,
						facebook: data.facebook || data.facebookurl,
						website: data.website || data.websiteurl,
						spreadsheetUser: row
					})
				})

				return next()
			})
		})

		// -----------------------------------
		// Campaign Monitor Users

		tasks.addTask('Campaign Monitor Users', function (next) {
			if ( !envData.campaignMonitorListId )  return next()
			createsendConnection.listActive(envData.campaignMonitorListId, null, function (err, data) {
				if ( err )  return next(err)
				data.Results.forEach(function (cmUser) {
					// Apply user information
					const user = User.create({
						name: cmUser.Name,
						email: cmUser.EmailAddress,
						cmUser: cmUser
					})

					// Merge in custom fields
					cmUser.CustomFields.forEach(function (customField) {
						const customFieldKey = customField.Key.toLowerCase()
						user.set(customFieldKey, customField.Value, {safe: true})
					})

					// Add user
					User.add(user)
				})

				return next()
			})
		})

		// -----------------------------------
		// Twitter Users

		tasks.addTask(function (next) {
			const feedOptions = {
				url: 'http://api.twitter.com/1/statuses/followers.json?screen_name=StartupHostel&cursor=-1',
				parse: 'json'
			}
			feedr.readFeed(feedOptions, function (err, data) {
				if ( err )  return next(err)
				if ( !data )  return next(new Error('no twitter data'))
				const errorMessage = data && data.errors && data.errors[0] && data.errors[0].message
				if ( errorMessage )  return next(new Error(errorMessage))
				if ( !data.users )  return next(new Error('no twitter users'))

				// Users
				data.users.forEach(function (twitterUser) {
					// Apply user information
					User.add({
						name: twitterUser.name,
						bio: twitterUser.description,
						twitter: twitterUser.screen_name,
						twitterID: twitterUser.id,
						website: twitterUser.url,
						avatar: twitterUser.profile_image_url,
						twitterUser: twitterUser
					})
				})

				// Done
				return next()
			})
		})

		// -----------------------------------
		// Facebook Users

		tasks.addTask('Facebook Users', function (next) {
			if ( !envData.facebookGroupId || !envData.facebookAccessToken )  return next()
			const feedOptions = {
				url: `https://graph.facebook.com/v2.4/${envData.facebookGroupId}/members?fields=name,id&limit=9999&access_token=${envData.facebookAccessToken}`,
				parse: 'json'
			}

			feedr.readFeed(feedOptions, function (err, result) {
				if ( err )  return next(err)
				if ( !result || !result.data )  return next(new Error('no facebook user data'))
				const facebookUsers = result.data

				// Users
				facebookUsers.forEach(function (facebookUser) {
					// Apply user information
					User.add({
						// Unfortunately, facebook doesn't provide any more data than that
						name: facebookUser.name,
						facebook: facebookUser.id
					})
				})

				// Done
				return next()
			})
		})

		// -----------------------------------
		// Normalize

		tasks.addTask('Normalize Fields', function (next) {
			// Prepare
			const usersTasks = new TaskGroup().setConfig({concurrency: 0}).done(function (err) {
				if ( err )  return next(err)
				log('info', `startuphostel: fetched ${appData.users.length} users`)
				return next()
			})

			// Users
			appData.users.forEach(function (user, index) {
				usersTasks.addTask(function (next) {
					// Note users that have no username
					if ( !user.get('username') ) {
						log('warn', 'startuphostel: user has no username:', user, index)
					}

					// Sales
					if ( user.get('confirmed') ) {
						appData.sales++
					}

					// User Tasks
					const userTasks = new TaskGroup().done(next)

					// User Tasks: Avatar: Facebook
					userTasks.addTask(function (complete) {
						if ( user.get('avatar') )  return complete()
						if ( !user.get('facebook') )  return complete()
						user.set('avatar', `http://graph.facebook.com/v2.4/${user.get('facebook')}/picture`)
						return complete()
					})

					// User Tasks: Avatar: Twitter
					userTasks.addTask(function (complete) {
						if ( user.get('avatar') )  return complete()
						if ( !user.get('twitter') )  return complete()
						const feedOptions = {
							url: `http://api.twitter.com/1/users/lookup.json?screen_name=${user.get('twitter')}`,
							parse: 'json'
						}
						feedr.readFeed(feedOptions, function (err, twitterUser) {
							if ( err )  return complete(err)
							user.set('avatar', twitterUser.profile_image_url)
							return complete()
						})
					})

					// User Tasks: Avatar: Email
					userTasks.addTask(function (complete) {
						if ( user.get('avatar') )  return complete()
						if ( !user.get('emailHash') )  return complete()
						user.set('avatar', `http://www.gravatar.com/avatar/${user.get('emailHash')}.jpg`)
						return complete()
					})

					// User Tasks: Save
					userTasks.addTask(function (complete) {
						user.save(complete)
					})

					// User Tasks: run
					userTasks.run()
				})
			})

			// Run
			usersTasks.run()
		})

		// Run
		return tasks.run()
	}

	// ===================================
	// Middleware

	// Create our middleware
	result.middleware = function (req, res, next) {
		if ( req.query.method === 'startuphostel-data' ) {
			if ( req.query.key !== envData.apiKey ) {
				res.sendError(new Error('Not Authorised'), 401)
			}
			else {
				res.sendSuccess({
					users: User.toJSON(),
					sales: appData.sales
				})
			}
		}
		else {
			next()
		}
	}

	// ===================================
	// Export

	return result
}
