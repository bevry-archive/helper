/* eslint no-console:0 */
const EXIT_ERROR_CODE = 1
const app = require('../lib/app').create()

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
