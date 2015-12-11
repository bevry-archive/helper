/* eslint no-console:0 */
// @TODO move this into the app class instance somehow so it is not a singleton, as singleton comes into issue with database and server closing
'use strict'

// Prepare
const state = {
	app: null,
	docpad: {
		spamUsers: [
			'Lonkly',
			'55c7a10d69feeae52b991ba69e820c29aa1da960',
			'ef87bc3cbb56a7d48e8a5024f9f33706b8146591',
			'c0f96be80fa06706ad261a7d932cfd188041aae3',
			'cabe082142f897bbe8958664951a84c57143ab63',
			'1a1dfaed48032a8f11dd73bf9a34fd9f20fcb13e',
			'4db16634288144bad2d154323ba966980254b07f',
			'80008a40c3d5a68f1345c2b351555257aecf78a2'
		],
		analytics: null,
		pluginClerk: null
	},
	startuphostel: {
		peopleFetcher: null
	}
}

// Export
module.exports = state
