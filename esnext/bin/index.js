/* eslint no-console:0 */
'use strict'
const EXIT_ERROR_CODE = 1
const app = require('../lib/app').create()
const server = require('../lib/server').create({log: console.log})

// Start our application server
app.start({}, function (err) {
	if ( err ) {
		console.error(err.stack)
		process.exit(EXIT_ERROR_CODE)
		return
	}

	// Success
	app.log('info', 'successfully started the application')
})
