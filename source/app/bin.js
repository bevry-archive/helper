/* eslint no-console:0 */
'use strict'

const EXIT_ERROR_CODE = 1

const app = require('../../').create().start(function (err) {
	if ( err ) {
		console.error(err.stack)
		process.exit(EXIT_ERROR_CODE)
		return
	}

	// Success
	app.log('info', 'successfully started the application')
})
