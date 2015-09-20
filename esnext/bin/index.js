const app = require('../lib/app').create()
app.init({}, function (err) {
	if ( err ) {
		console.error(err.stack)
		process.exit(1)
		return
	}

	app.listen({}, function (err) {
		if ( err ) {
			console.error(err.stack)
			process.exit(1)
			return
		}
	})
})
