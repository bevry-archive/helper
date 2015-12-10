/* eslint no-console:0 */
'use strict'
const EXIT_ERROR_CODE = 1
const app = require('../lib/app').create()
app.init({}, function (err) {
	if ( err ) {
		console.error(err.stack)
		process.exit(EXIT_ERROR_CODE)
		return
	}

	app.listen({}, function (err) {
		if ( err ) {
			console.error(err.stack)
			process.exit(EXIT_ERROR_CODE)
			return
		}
	})
})
