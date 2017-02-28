/* eslint consistent-this:0 */
'use strict'

// Imports
const EventEmitterGrouped = require('event-emitter-grouped')
const extractOpts = require('extract-opts')
const pathUtil = require('path')

// App
module.exports = class App extends EventEmitterGrouped {
	static create (...args) {
		return new this(...args)
	}

	constructor (opts = {}) {
		super()

		this.log = this.log.bind(this)

		this.state = {
			app: {
				logger: console
			}
		}

		this.start = this.start.bind(this)
		this.stop = this.stop.bind(this)

		const pluginsPath = opts.pluginsPath || pathUtil.join(__dirname, '..', 'plugins')
		const plugins = opts.plugins || ['app', 'contributors', 'bevry', 'docpad', 'startuphostel']

		plugins.forEach((plugin) => {
			require(pathUtil.join(pluginsPath, plugin)).call(this)
		})
	}

	log (...args) {
		const logger = this.state.app.logger
		return logger.log(...args)
	}

	start (opts, next) {
		[opts, next] = extractOpts(opts, next)
		this.emitSerial('init', function (err) {
			if ( err )  return next(err)

			return next()
		})

		return this
	}

	stop (opts, next) {
		[opts, next] = extractOpts(opts, next)
		this.emitSerial('deinit', function (err) {
			if ( err )  return next(err)

			return next()
		})
	}

}
