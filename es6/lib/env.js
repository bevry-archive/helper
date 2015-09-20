// Imports
const eachr = require('eachr')

// Prepare
const env = {
	bevry: {
		campaignMonitorKey: 'BEVRY_CM_KEY',
		databaseUrl: 'BEVRY_DATABASE_URL',
		twitterConsumerKey: 'BEVRY_TWITTER_CONSUMER_KEY',
		twitterConsumerSecret: 'BEVRY_TWITTER_CONSUMER_SECRET'
	},
	docpad: {
		campaignMonitorListId: 'DP_CM_LIST_ID',
		segmentKey: 'DP_SEGMENT_KEY'
	},
	startuphostel: {
		campaignMonitorListId: 'SH_CM_LIST_ID',
		googleSpreadsheetKey: 'SH_SPREADSHEET_KEY',
		googleSpreadsheetEmail: 'SH_SPREADSHEET_EMAIL',
		googleSpreadsheetPassword: 'SH_SPREADSHEET_PASSWORD',
		facebookGroupId: 'SH_FACEBOOK_GROUP_ID',
		facebookAccessToken: 'SH_FACEBOOK_ACCESS_TOKEN',
		apiKey: 'SH_API_KEY'
	}
}

// Check
eachr(env, function (group) {
	eachr(group, function (envKey, propertyName) {
		group[propertyName] = process.env[envKey]
		if ( !group[propertyName] ) {
			throw new Error(`Environment variable ${envKey} is missing`)
		}
	})
})


// Export
module.exports = env
