/* eslint no-console:0 */
// @TODO move this into the app class instance somehow so it is not a singleton, as singleton comes into issue with database and server closing

// Prepare
const state = {
	app: {
		log: console.log,
		server: null,
	},
	bevry: {
		db: null
	},
	docpad: {
		codeRedirectPermanent: 301,
		codeRedirectTemporary: 302,
		spamUsers: [
			'Lonkly',
			'55c7a10d69feeae52b991ba69e820c29aa1da960',
			'ef87bc3cbb56a7d48e8a5024f9f33706b8146591',
			'c0f96be80fa06706ad261a7d932cfd188041aae3',
			'cabe082142f897bbe8958664951a84c57143ab63',
			'1a1dfaed48032a8f11dd73bf9a34fd9f20fcb13e',
			'4db16634288144bad2d154323ba966980254b07f'
		],
		analytics: null,
		pluginClerk: null
	},
	startuphostel: {
		peopleFetcher: null
	}
}

// Logging
const logger = require('caterpillar').createLogger()
const human = require('caterpillar-human').createHuman()
logger.pipe(human).pipe(process.stdout)
state.app.log = logger.log

// Export
module.exports = state
