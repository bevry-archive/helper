'use strict'

const Caterpillar = require('caterpillar')
const CaterpillarFilter = require('caterpillar-filter')
const CaterpillarHuman = require('caterpillar-human')

class CaterpillarClean extends Caterpillar.Transform {
	/* eslint class-methods-use-this: 0*/
	format (message) {
		return message.replace(/(client_id|clientid|key|secret)=[a-z0-9]+/gi, '$1=SECRET_REMOVED_BY_CATERPILLAR_CLEAN')
	}
}

const Server = require('../lib/server')
const env = require('../env')

function initLogger () {
	const {state} = this
	const logger = Caterpillar.create({level: env.app.logLevel})
	const filter = CaterpillarFilter.create()
	const human = CaterpillarHuman.create()
	const clean = CaterpillarClean.create()
	state.app.logger = logger
	logger.pipe(filter).pipe(human).pipe(clean).pipe(process.stdout)
}
initLogger.priority = 100


function initServer (next) {
	const {state, log} = this
	state.app.server = Server.create({log})

	state.app.server.start({
		middlewares: state.app.middlewares,
		next (err, connect, server) {
			if ( err )  return next(err, connect, server)
			const address = server.address()
			state.app.serverURL = `http://${address.address}:${address.port}`
			return next(null, connect, server)
		}
	})
}
initServer.priority = -100


function deinitServer (complete) {
	const {state, log} = this
	log('info', 'destroying the server')
	state.app.server.destroy((err) => {
		log('info', 'destroyed the server', err)
		if ( err )  return complete(err)
		state.app.serverURL = state.app.server = null
		complete()
	})
}
deinitServer.priority = 100


module.exports = function () {
	Object.assign(this.state.app, {
		logger: null,
		log: null,
		server: null,
		middlewares: []
	})
	this.on('init', initLogger)
	this.on('init', initServer)
	this.on('deinit', deinitServer)
}
