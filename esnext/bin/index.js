/* eslint no-console:0 */
'use strict'
const EXIT_ERROR_CODE = 1
const app = require('../lib/app').create()
const server = require('../lib/server').create({log: console.log})

// Initialise a temporary server so heroku doesn't die waiting
server.start({
	middleware (req, res) {
		res.sendError('helper still initialising')
	},
	next (err) {
		if ( err ) {
			console.error(err.stack)
			process.exit(EXIT_ERROR_CODE)
			return
		}

		// Initialise the App
		app.init({}, function (err) {
			if ( err ) {
				console.error(err.stack)
				process.exit(EXIT_ERROR_CODE)
				return
			}

			// Kill our temporary server so we can boot up our application server
			server.destroy({}, function (err) {
				if ( err ) {
					console.error(err.stack)
					process.exit(EXIT_ERROR_CODE)
					return
				}

				// Start our application server
				app.listen({}, function (err) {
					if ( err ) {
						console.error(err.stack)
						process.exit(EXIT_ERROR_CODE)
						return
					}
				})
			})
		})

	}
})
