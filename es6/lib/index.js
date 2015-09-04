// Create our basic app
const server = require('./server').create()

// Prepare our services
const docpadHelper = require('./docpad')({
	log: server.log.bind(server),
	env: {
		campaignMonitorKey: process.env.DP_CM_KEY,
		campaignMonitorListId: process.env.DP_CM_LIST_ID,
		segmentKey: process.env.DP_SEGMENT_KEY
	}
})
/*
const startupHostelHelper = require('./startuphostel')({
	log: server.log.bind(server),
	env: {
		campaignMonitorKey: process.env.SH_CM_KEY,
		campaignMonitorListId: process.env.SH_CM_LIST_ID,
		googleSpreadsheetKey: process.env.SH_SPREADSHEET_KEY,
		googleSpreadsheetEmail: process.env.SH_SPREADSHEET_EMAIL,
		googleSpreadsheetPassword: process.env.SH_SPREADSHEET_PASSWORD,
		facebookGroupId: process.env.SH_FACEBOOK_GROUP_ID,
		facebookAccessToken: process.env.SH_FACEBOOK_ACCESS_TOKEN,
		apiKey: process.env.SH_API_KEY
	}
})
*/

// Start the application server with our service middlewares
server.start({
	middlewares: [
		docpadHelper.middleware // ,
		// startupHostelHelper.middleware
	]
})

// Start our service workers
// startupHostelHelper.worker()

// Export the app
export default server
